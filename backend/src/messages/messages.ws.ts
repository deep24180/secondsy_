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

type JoinConversationPayload = {
  conversationId?: string;
};

type SendMessagePayload = {
  conversationId?: string;
  content?: string;
};

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
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

  constructor(private readonly messagesService: MessagesService) {}

  onModuleDestroy() {
    this.server?.close();
  }

  async handleConnection(client: Socket) {
    const userId = await this.resolveUserId(client);

    if (!userId) {
      client.emit('message_error', { message: 'Unauthorized' });
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    client.join(this.getUserRoom(userId));
    client.emit('connected', { userId });
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    client.leave(this.getUserRoom(userId));
  }

  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationPayload,
  ) {
    const userId = client.data.userId as string | undefined;

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
    const userId = client.data.userId as string | undefined;

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
    const rawToken = client.handshake.auth?.token ?? client.handshake.query.token;
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
}
