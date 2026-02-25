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
    return this.messagesRepo.findConversationsForUser(currentUserId);
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

    return {
      message,
      conversation,
    };
  }
}
