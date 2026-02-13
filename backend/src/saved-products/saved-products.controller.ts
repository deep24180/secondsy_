import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/auth/supabase.guard';
import { CreateSavedProductDto } from './dto/create-saved-product.dto';
import { SavedProductsService } from './saved-products.service';

@Controller('saved-products')
@UseGuards(SupabaseAuthGuard)
export class SavedProductsController {
  constructor(private readonly savedProductsService: SavedProductsService) {}

  @Get()
  list(@Req() req) {
    const currentUserId = req.user.sub;
    return this.savedProductsService.list(currentUserId);
  }

  @Post()
  create(@Body() dto: CreateSavedProductDto, @Req() req) {
    const currentUserId = req.user.sub;
    return this.savedProductsService.create(currentUserId, dto.productId);
  }

  @Delete(':productId')
  remove(@Param('productId') productId: string, @Req() req) {
    const currentUserId = req.user.sub;
    return this.savedProductsService.remove(currentUserId, productId);
  }
}
