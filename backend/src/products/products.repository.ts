import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

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

  async findAll(query: QueryProductsDto = {}) {
    const page = query.page;
    const limit = query.limit;
    const shouldPaginate = Boolean(page && limit);
    const q = query.q?.trim();
    const category = query.category?.trim();
    const subcategory = query.subcategory?.trim();
    const tag = query.tag?.trim();
    const userId = query.userId?.trim();
    const includeStatuses = query.status
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const excludedStatuses = query.excludeStatus
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const andFilters: Prisma.ProductWhereInput[] = [];

    if (q) {
      andFilters.push({
        OR: [
          { title: { contains: q } },
          { category: { contains: q } },
          { subcategory: { contains: q } },
          { location: { contains: q } },
          { description: { contains: q } },
        ],
      });
    }

    if (category) {
      andFilters.push({ category: { equals: category } });
    }

    if (subcategory) {
      andFilters.push({ subcategory: { equals: subcategory } });
    }

    if (tag) {
      andFilters.push({
        tags: { has: tag },
      });
    }

    if (userId) {
      andFilters.push({ userId });
    }

    if (includeStatuses && includeStatuses.length > 0) {
      andFilters.push({ status: { in: includeStatuses } });
    }

    if (excludedStatuses && excludedStatuses.length > 0) {
      andFilters.push({ status: { notIn: excludedStatuses } });
    }

    const where: Prisma.ProductWhereInput =
      andFilters.length > 0 ? { AND: andFilters } : {};

    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...(shouldPaginate
          ? {
              skip: ((page as number) - 1) * (limit as number),
              take: limit,
            }
          : {}),
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: shouldPaginate ? page : 1,
        limit: shouldPaginate ? limit : total,
        hasNextPage: shouldPaginate
          ? (page as number) * (limit as number) < total
          : false,
      },
    };
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

  async deleteByIdAndUser(id: string, userId: string) {
    const result = await this.prisma.product.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return null;
    }

    await this.prisma.savedProduct.deleteMany({
      where: { productId: id },
    });

    return { success: true };
  }
}
