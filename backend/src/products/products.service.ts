import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async create(dto: CreateProductDto, userId: string) {
    return this.productsRepo.create(dto, userId);
  }

  async findAll() {
    return this.productsRepo.findAll();
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
}
