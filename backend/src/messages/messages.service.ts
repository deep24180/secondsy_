import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepo: MessagesRepository) {}

  private sortParticipants(userIdA: string, userIdB: string) {
    return [userIdA, userIdB].sort((a, b) => a.localeCompare(b));
  }

  private assertParticipant(
    conversation: {
      participantAId: string;
      participantBId: string;
    },
    userId: string,
  ) {
    const isParticipant =
      conversation.participantAId === userId ||
      conversation.participantBId === userId;

    if (!isParticipant) {
      throw new ForbiddenException('Not allowed to access this conversation');
    }
  }

  async getOrCreateConversation(
    productId: string,
    currentUserId: string,
    otherUserId: string,
  ) {
    if (currentUserId === otherUserId) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    const product = await this.messagesRepo.findProductById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.userId !== otherUserId) {
      throw new BadRequestException(
        'Conversation target must be the product owner',
      );
    }

    const [participantAId, participantBId] = this.sortParticipants(
      currentUserId,
      otherUserId,
    );

    const existing = await this.messagesRepo.findConversationByKey(
      productId,
      participantAId,
      participantBId,
    );

    if (existing) {
      return existing;
    }

    return this.messagesRepo.createConversation(
      productId,
      participantAId,
      participantBId,
    );
  }

  async listConversations(currentUserId: string) {
    const conversations =
      await this.messagesRepo.findConversationsForUser(currentUserId);

    return conversations.map((conversation) => {
      const { reads, ...rest } = conversation;
      return {
        ...rest,
        lastReadAt: reads?.[0]?.lastReadAt ?? null,
      };
    });
  }

  async listMessages(conversationId: string, currentUserId: string) {
    const conversation =
      await this.messagesRepo.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    this.assertParticipant(conversation, currentUserId);

    return this.messagesRepo.findMessagesByConversation(conversationId);
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation =
      await this.messagesRepo.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    this.assertParticipant(conversation, senderId);

    const trimmed = content.trim();

    if (!trimmed) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const message = await this.messagesRepo.createMessage(
      conversationId,
      senderId,
      trimmed,
    );
    await this.messagesRepo.markConversationRead(
      conversationId,
      senderId,
      message.createdAt,
    );

    return {
      message,
      conversation,
    };
  }

  async markConversationRead(
    conversationId: string,
    currentUserId: string,
    seenAt?: string,
  ) {
    const conversation =
      await this.messagesRepo.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    this.assertParticipant(conversation, currentUserId);

    const nextSeenAt = seenAt ? new Date(seenAt) : new Date();
    if (Number.isNaN(nextSeenAt.getTime())) {
      throw new BadRequestException('Invalid seenAt value');
    }

    const latestMessage = (
      await this.messagesRepo.findMessagesByConversation(conversationId)
    ).slice(-1)[0];
    const boundedSeenAt =
      latestMessage && latestMessage.createdAt < nextSeenAt
        ? latestMessage.createdAt
        : nextSeenAt;

    const read = await this.messagesRepo.markConversationRead(
      conversationId,
      currentUserId,
      boundedSeenAt,
    );

    return {
      conversationId,
      lastReadAt: read.lastReadAt,
    };
  }
}
