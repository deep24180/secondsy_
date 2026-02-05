import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

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
}
