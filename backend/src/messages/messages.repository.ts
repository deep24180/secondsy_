import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const participantSelect = {
  supabaseId: true,
  firstName: true,
  lastName: true,
  email: true,
};

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProductById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findConversationById(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        participantA: {
          select: participantSelect,
        },
        participantB: {
          select: participantSelect,
        },
      },
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
      include: {
        participantA: {
          select: participantSelect,
        },
        participantB: {
          select: participantSelect,
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
      include: {
        participantA: {
          select: participantSelect,
        },
        participantB: {
          select: participantSelect,
        },
      },
    });
  }

  findConversationsForUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      include: {
        participantA: {
          select: participantSelect,
        },
        participantB: {
          select: participantSelect,
        },
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
            sender: {
              select: participantSelect,
            },
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
      include: {
        sender: {
          select: participantSelect,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ) {
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
        },
        include: {
          sender: {
            select: participantSelect,
          },
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
