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
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import type { AuthenticatedRequest } from '../auth/auth-request.interface';
import { CreateSavedProductDto } from './dto/create-saved-product.dto';
import { SavedProductsService } from './saved-products.service';

@Controller('saved-products')
@UseGuards(SupabaseAuthGuard)
export class SavedProductsController {
  constructor(private readonly savedProductsService: SavedProductsService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    const currentUserId = req.user.sub;
    return this.savedProductsService.list(currentUserId);
  }

  @Post()
  create(@Body() dto: CreateSavedProductDto, @Req() req: AuthenticatedRequest) {
    const currentUserId = req.user.sub;
    return this.savedProductsService.create(currentUserId, dto.productId);
  }

  @Delete(':productId')
  remove(
    @Param('productId') productId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const currentUserId = req.user.sub;
    return this.savedProductsService.remove(currentUserId, productId);
  }
}
