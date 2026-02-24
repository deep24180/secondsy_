import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { IncomingMessage, Server } from 'http';
import { createHash } from 'crypto';
import { Duplex } from 'stream';
import jwt from 'jsonwebtoken';
import { MessagesService } from './messages.service';

type ConnectedClient = {
  userId: string;
  socket: Duplex;
  joinedConversationIds: Set<string>;
  buffer: Buffer;
};

@Injectable()
export class MessagesWsService implements OnModuleDestroy {
  private readonly logger = new Logger(MessagesWsService.name);
  private readonly clients = new Set<ConnectedClient>();

  constructor(private readonly messagesService: MessagesService) {}

  onModuleDestroy() {
    for (const client of this.clients) {
      client.socket.destroy();
    }

    this.clients.clear();
  }

  attachServer(server: Server) {
    server.on('upgrade', async (request, socket) => {
      if (!request.url?.startsWith('/ws')) {
        socket.destroy();
        return;
      }

      const userId = await this.resolveUserId(request);

      if (!userId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      if (!this.completeHandshake(request, socket)) {
        socket.destroy(); 
        return;
      }

      const client: ConnectedClient = {
        userId,
        socket,
        joinedConversationIds: new Set<string>(),
        buffer: Buffer.alloc(0),
      };

      this.clients.add(client);

      socket.on('data', async (chunk: Buffer) => {
        await this.handleSocketData(client, chunk);
      });

      socket.on('close', () => {
        this.clients.delete(client);
      });

      socket.on('error', () => {
        this.clients.delete(client);
      });

      this.send(client.socket, {
        type: 'connected',
        payload: { userId },
      });
    });
  }

  private completeHandshake(request: IncomingMessage, socket: Duplex) {
    const wsKey = request.headers['sec-websocket-key'];

    if (!wsKey || Array.isArray(wsKey)) {
      return false;
    }

    const acceptKey = createHash('sha1')
      .update(`${wsKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n',
    ];

    socket.write(headers.join('\r\n'));
    return true;
  }

  private async resolveUserId(request: IncomingMessage) {
    const url = request.url || '';
    const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
    const params = new URLSearchParams(query);
    const token = params.get('token');

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    const jwtPublicKey = process.env.SUPABASE_JWT_PUBLIC_KEY?.replace(
      /\\n/g,
      '\n',
    );
    const signingKey = jwtSecret || jwtPublicKey;

    if (signingKey) {
      return this.verifyWithJwt(token, signingKey, Boolean(jwtSecret));
    }

    return this.verifyWithSupabaseAuthApi(token);
  }

  private verifyWithJwt(
    token: string,
    signingKey: string,
    isHmacSecret: boolean,
  ) {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

    const verifyOptions: jwt.VerifyOptions = {
      algorithms: isHmacSecret ? ['HS256'] : ['RS256'],
    };

    if (supabaseUrl) {
      verifyOptions.issuer = `${supabaseUrl}/auth/v1`;
    }

    let verified: string | jwt.JwtPayload;
    try {
      verified = jwt.verify(token, signingKey, verifyOptions);
    } catch {
      return null;
    }

    if (typeof verified !== 'object' || typeof verified.sub !== 'string') {
      return null;
    }

    return verified.sub;
  }

  private async verifyWithSupabaseAuthApi(token: string) {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return null;
    }

    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const user = (await response.json()) as { id?: string };
    return typeof user.id === 'string' ? user.id : null;
  }

  private async handleSocketData(client: ConnectedClient, chunk: Buffer) {
    client.buffer = Buffer.concat([client.buffer, chunk]);

    while (client.buffer.length >= 2) {
      const parsed = this.parseFrame(client.buffer);

      if (!parsed) {
        break;
      }

      client.buffer = client.buffer.subarray(parsed.frameLength);

      if (parsed.opcode === 0x8) {
        client.socket.end();
        return;
      }

      if (parsed.opcode === 0x9) {
        this.sendRaw(client.socket, parsed.payload, 0x8a);
        continue;
      }

      if (parsed.opcode !== 0x1) {
        continue;
      }

      await this.handleIncomingMessage(client, parsed.payload.toString('utf8'));
    }
  }

  private parseFrame(buffer: Buffer) {
    if (buffer.length < 2) {
      return null;
    }

    const firstByte = buffer[0];
    const secondByte = buffer[1];

    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) === 0x80;
    let payloadLength = secondByte & 0x7f;
    let offset = 2;

    if (payloadLength === 126) {
      if (buffer.length < offset + 2) return null;
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      if (buffer.length < offset + 8) return null;
      const bigLength = buffer.readBigUInt64BE(offset);
      if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) return null;
      payloadLength = Number(bigLength);
      offset += 8;
    }

    if (!masked) {
      return null;
    }

    if (buffer.length < offset + 4 + payloadLength) {
      return null;
    }

    const mask = buffer.subarray(offset, offset + 4);
    offset += 4;

    const payload = Buffer.from(
      buffer.subarray(offset, offset + payloadLength),
    );

    for (let i = 0; i < payload.length; i += 1) {
      payload[i] ^= mask[i % 4];
    }

    return {
      opcode,
      payload,
      frameLength: offset + payloadLength,
    };
  }

  private async handleIncomingMessage(client: ConnectedClient, raw: string) {
    try {
      let event: { type?: string; payload?: unknown };

      try {
        event = JSON.parse(raw);
      } catch {
        this.send(client.socket, {
          type: 'error',
          payload: { message: 'Invalid JSON payload' },
        });
        return;
      }

      if (event.type === 'join_conversation') {
        const payload = event.payload as { conversationId?: string };
        const conversationId = payload?.conversationId;

        if (!conversationId) {
          this.send(client.socket, {
            type: 'error',
            payload: { message: 'conversationId is required' },
          });
          return;
        }

        const messages = await this.messagesService.listMessages(
          conversationId,
          client.userId,
        );

        client.joinedConversationIds.add(conversationId);

        this.send(client.socket, {
          type: 'conversation_joined',
          payload: { conversationId, messages },
        });
        return;
      }

      if (event.type === 'send_message') {
        const payload = event.payload as {
          conversationId?: string;
          content?: string;
        };

        const conversationId = payload?.conversationId;
        const content = payload?.content;

        if (!conversationId || typeof content !== 'string') {
          this.send(client.socket, {
            type: 'error',
            payload: {
              message: 'conversationId and content are required',
            },
          });
          return;
        }

        const { message, conversation } =
          await this.messagesService.sendMessage(
            conversationId,
            client.userId,
            content,
          );

        this.broadcastToParticipants(
          conversation.participantAId,
          conversation.participantBId,
          {
            type: 'new_message',
            payload: {
              conversationId,
              message,
            },
          },
        );
        return;
      }

      this.send(client.socket, {
        type: 'error',
        payload: { message: 'Unsupported event type' },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to process message';

      this.logger.warn(`WS event error: ${message}`);

      this.send(client.socket, {
        type: 'error',
        payload: { message },
      });
    }
  }

  private broadcastToParticipants(
    participantAId: string,
    participantBId: string,
    data: Record<string, unknown>,
  ) {
    for (const client of this.clients) {
      if (
        client.userId !== participantAId &&
        client.userId !== participantBId
      ) {
        continue;
      }

      this.send(client.socket, data);
    }
  }

  private send(socket: Duplex, data: Record<string, unknown>) {
    try {
      const payload = Buffer.from(JSON.stringify(data));
      this.sendRaw(socket, payload, 0x81);
    } catch (error) {
      this.logger.warn(`WS send failed: ${String(error)}`);
    }
  }

  private sendRaw(socket: Duplex, payload: Buffer, firstByte: number) {
    let header: Buffer;

    if (payload.length < 126) {
      header = Buffer.from([firstByte, payload.length]);
    } else if (payload.length < 65536) {
      header = Buffer.alloc(4);
      header[0] = firstByte;
      header[1] = 126;
      header.writeUInt16BE(payload.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = firstByte;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(payload.length), 2);
    }

    socket.write(Buffer.concat([header, payload]));
  }
}
