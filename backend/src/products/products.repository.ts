import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateProductDto, userId: string) {
    return this.prisma.product.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOneById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async updateStatusById(id: string, userId: string, status: string) {
    const result = await this.prisma.product.updateMany({
      where: { id, userId },
      data: { status },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async updateByIdAndUser(id: string, userId: string, dto: UpdateProductDto) {
    const result = await this.prisma.product.updateMany({
      where: { id, userId },
      data: dto,
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.product.findUnique({
      where: { id },
    });
  }
}
