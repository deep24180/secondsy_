import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';
import { MessagesService } from './messages.service';
import { MessagesWsService } from './messages.ws';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepository, MessagesWsService],
  exports: [MessagesWsService],
})
export class MessagesModule {}
