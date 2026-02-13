import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SavedProductsController } from './saved-products.controller';
import { SavedProductsRepository } from './saved-products.repository';
import { SavedProductsService } from './saved-products.service';

@Module({
  imports: [PrismaModule],
  controllers: [SavedProductsController],
  providers: [SavedProductsRepository, SavedProductsService],
})
export class SavedProductsModule {}
