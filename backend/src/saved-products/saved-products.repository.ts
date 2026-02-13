import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SavedProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: string) {
    return this.prisma.savedProduct.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(userId: string, productId: string) {
    return this.prisma.savedProduct.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  create(userId: string, productId: string) {
    return this.prisma.savedProduct.create({
      data: {
        userId,
        productId,
      },
    });
  }

  delete(userId: string, productId: string) {
    return this.prisma.savedProduct.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }
}
