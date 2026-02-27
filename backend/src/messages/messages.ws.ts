import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { MessagesService } from './messages.service';
import { corsOriginResolver } from '../lib/cors';

type JoinConversationPayload = {
  conversationId?: string;
};

type SendMessagePayload = {
  conversationId?: string;
  content?: string;
};

type JwtVerifyOptions = {
  algorithms: string[];
  issuer?: string;
};

type JwtVerifyFn = (
  token: string,
  signingKey: string,
  options: JwtVerifyOptions,
) => unknown;

@WebSocketGateway({
  cors: {
    origin: corsOriginResolver,
    credentials: true,
  },
})
@Injectable()
export class MessagesWsService
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(MessagesWsService.name);
  private readonly authenticatedClients = new WeakMap<Socket, string>();

  constructor(private readonly messagesService: MessagesService) {}

  onModuleDestroy() {
    void this.server?.close();
  }

  async handleConnection(client: Socket) {
    const userId = await this.resolveUserId(client);

    if (!userId) {
      client.emit('message_error', { message: 'Unauthorized' });
      client.disconnect();
      return;
    }

    this.authenticatedClients.set(client, userId);
    void client.join(this.getUserRoom(userId));
    client.emit('connected', { userId });
  }

  handleDisconnect(client: Socket) {
    const userId = this.authenticatedClients.get(client);
    if (!userId) return;

    this.authenticatedClients.delete(client);
    void client.leave(this.getUserRoom(userId));
  }

  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationPayload,
  ) {
    const userId = this.authenticatedClients.get(client);

    if (!userId) {
      client.emit('message_error', { message: 'Unauthorized' });
      return;
    }

    const conversationId = payload?.conversationId;

    if (!conversationId) {
      client.emit('message_error', { message: 'conversationId is required' });
      return;
    }

    try {
      const messages = await this.messagesService.listMessages(
        conversationId,
        userId,
      );

      client.emit('conversation_joined', { conversationId, messages });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load conversation';
      client.emit('message_error', { message });
    }
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const userId = this.authenticatedClients.get(client);

    if (!userId) {
      client.emit('message_error', { message: 'Unauthorized' });
      return;
    }

    const conversationId = payload?.conversationId;
    const content = payload?.content;

    if (!conversationId || typeof content !== 'string') {
      client.emit('message_error', {
        message: 'conversationId and content are required',
      });
      return;
    }

    try {
      const { message, conversation } = await this.messagesService.sendMessage(
        conversationId,
        userId,
        content,
      );

      const event = {
        conversationId,
        message,
      };

      this.server
        .to(this.getUserRoom(conversation.participantAId))
        .emit('new_message', event);
      this.server
        .to(this.getUserRoom(conversation.participantBId))
        .emit('new_message', event);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to process message';
      this.logger.warn(`Socket event error: ${message}`);
      client.emit('message_error', { message });
    }
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }

  private async resolveUserId(client: Socket) {
    const handshake = client.handshake as {
      auth?: { token?: unknown };
      query?: { token?: unknown };
    };
    const rawToken = handshake.auth?.token ?? handshake.query?.token;
    const token = typeof rawToken === 'string' ? rawToken : null;

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
  ): string | null {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

    const verifyOptions: JwtVerifyOptions = {
      algorithms: isHmacSecret ? ['HS256'] : ['RS256'],
    };

    if (supabaseUrl) {
      verifyOptions.issuer = `${supabaseUrl}/auth/v1`;
    }

    const jwtVerify = (jwt as unknown as { verify: JwtVerifyFn }).verify;
    let verified: unknown;
    try {
      verified = jwtVerify(token, signingKey, verifyOptions);
    } catch {
      return null;
    }

    if (
      typeof verified !== 'object' ||
      verified === null ||
      typeof (verified as { sub?: unknown }).sub !== 'string'
    ) {
      return null;
    }

    return (verified as { sub: string }).sub;
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

    const rawUser = (await response.json()) as unknown;
    if (
      typeof rawUser !== 'object' ||
      rawUser === null ||
      typeof (rawUser as { id?: unknown }).id !== 'string'
    ) {
      return null;
    }

    return (rawUser as { id: string }).id;
  }
}
