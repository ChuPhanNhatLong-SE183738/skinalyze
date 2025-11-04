import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatMessagesService } from './chat-messages.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('chat-messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat-messages')
export class ChatMessagesController {
  constructor(private readonly chatMessagesService: ChatMessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message and get AI response' })
  @ApiResponse({ status: 201, description: 'Message sent and AI response received' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  create(@Body() createChatMessageDto: CreateChatMessageDto) {
    return this.chatMessagesService.createUserMessage(createChatMessageDto);
  }

  @Get('chat/:chatId')
  @ApiOperation({ summary: 'Get all messages in a chat session' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  findAllByChatSession(@Param('chatId') chatId: string) {
    return this.chatMessagesService.findAllByChatSession(chatId);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  remove(@Param('messageId') messageId: string) {
    return this.chatMessagesService.remove(messageId);
  }
}