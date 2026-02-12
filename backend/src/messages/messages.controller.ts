import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/auth/supabase.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(SupabaseAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations/start')
  startConversation(@Body() dto: CreateConversationDto, @Req() req) {
    const currentUserId = req.user.sub;
    return this.messagesService.getOrCreateConversation(
      dto.productId,
      currentUserId,
      dto.otherUserId,
    );
  }

  @Get('conversations')
  listConversations(@Req() req) {
    const currentUserId = req.user.sub;
    return this.messagesService.listConversations(currentUserId);
  }

  @Get('conversations/:id/messages')
  listMessages(@Param('id') id: string, @Req() req) {
    const currentUserId = req.user.sub;
    return this.messagesService.listMessages(id, currentUserId);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @Req() req,
  ) {
    const currentUserId = req.user.sub;
    return this.messagesService.sendMessage(id, currentUserId, dto.content);
  }
}
