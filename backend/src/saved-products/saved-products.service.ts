import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SavedProductsRepository } from './saved-products.repository';

@Injectable()
export class SavedProductsService {
  constructor(
    private readonly savedProductsRepository: SavedProductsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(userId: string) {
    const saved = await this.savedProductsRepository.findManyByUser(userId);
    const productIds = saved.map((item) => item.productId);

    if (productIds.length === 0) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    return productIds
      .map((productId) => productsById.get(productId))
      .filter((item) => Boolean(item));
  }

  async create(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.savedProductsRepository.findOne(
      userId,
      productId,
    );
    if (!existing) {
      await this.savedProductsRepository.create(userId, productId);
    }

    return product;
  }

  async remove(userId: string, productId: string) {
    const existing = await this.savedProductsRepository.findOne(
      userId,
      productId,
    );
    if (!existing) {
      throw new NotFoundException('Saved product not found');
    }

    await this.savedProductsRepository.delete(userId, productId);
    return { success: true };
  }
}
