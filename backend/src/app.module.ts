import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { ProductsModule } from './products/products.module';
import { MessagesModule } from './messages/messages.module';
import { SavedProductsModule } from './saved-products/saved-products.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    ProductsModule,
    MessagesModule,
    SavedProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
