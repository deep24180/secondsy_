import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProductById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findConversationById(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
    });
  }

  async findConversationByKey(
    productId: string,
    participantAId: string,
    participantBId: string,
  ) {
    return this.prisma.conversation.findUnique({
      where: {
        productId_participantAId_participantBId: {
          productId,
          participantAId,
          participantBId,
        },
      },
    });
  }

  createConversation(
    productId: string,
    participantAId: string,
    participantBId: string,
  ) {
    return this.prisma.conversation.create({
      data: {
        productId,
        participantAId,
        participantBId,
      },
    });
  }

  findConversationsForUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            senderId: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });
  }

  findMessagesByConversation(conversationId: string) {
    return this.prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createMessage(conversationId: string, senderId: string, content: string) {
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
        },
      }),
    ]);

    return message;
  }
}
