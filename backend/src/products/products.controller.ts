import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SupabaseAuthGuard } from 'src/auth/supabase.guard';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}
  @UseGuards(SupabaseAuthGuard)
  @Post()
  create(@Body() dto: CreateProductDto, @Req() req) {
    const supabaseId = req.user.sub;
    return this.productsService.create(dto, supabaseId);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
    @Req() req,
  ) {
    const supabaseId = req.user.sub;
    return this.productsService.updateStatus(id, supabaseId, dto.status);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req) {
    const supabaseId = req.user.sub;
    return this.productsService.update(id, supabaseId, dto);
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const supabaseId = req.user.sub;
    return this.productsService.remove(id, supabaseId);
  }
}
