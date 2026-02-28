import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsRepository } from './products.repository';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async create(dto: CreateProductDto, userId: string) {
    return this.productsRepo.create(dto, userId);
  }

  async findAll(query?: QueryProductsDto) {
    return this.productsRepo.findAll(query);
  }

  async findOne(id: string) {
    const product = await this.productsRepo.findOneById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateStatus(id: string, userId: string, status: string) {
    const product = await this.productsRepo.updateStatusById(
      id,
      userId,
      status,
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, userId: string, dto: UpdateProductDto) {
    const product = await this.productsRepo.updateByIdAndUser(id, userId, dto);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async remove(id: string, userId: string) {
    const removed = await this.productsRepo.deleteByIdAndUser(id, userId);

    if (!removed) {
      throw new NotFoundException('Product not found');
    }

    return { success: true };
  }
}
