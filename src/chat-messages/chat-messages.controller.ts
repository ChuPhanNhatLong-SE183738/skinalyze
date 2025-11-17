import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatMessagesService } from './chat-messages.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@ApiTags('Chat Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat-messages')
export class ChatMessagesController {
  constructor(private readonly chatMessagesService: ChatMessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message in a chat session' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async create(@Body() createChatMessageDto: CreateChatMessageDto) {
    return await this.chatMessagesService.createUserMessage(
      createChatMessageDto,
    );
  }

  @Post('analyze-image/:chatId')
  @ApiOperation({ summary: 'Upload and analyze skin image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image analyzed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid image file' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  @UseInterceptors(FileInterceptor('image'))
  async analyzeImage(
    @Param('chatId') chatId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('additionalText') additionalText?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG and PNG images are allowed',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 5MB');
    }

    return await this.chatMessagesService.analyzeImage(
      chatId,
      file,
      additionalText,
    );
  }

  @Get('chat/:chatId')
  @ApiOperation({ summary: 'Get all messages in a chat session' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async findAllByChatSession(@Param('chatId') chatId: string) {
    return await this.chatMessagesService.findAllByChatSession(chatId);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async remove(@Param('messageId') messageId: string) {
    await this.chatMessagesService.remove(messageId);
    return { message: 'Message deleted successfully' };
  }
}