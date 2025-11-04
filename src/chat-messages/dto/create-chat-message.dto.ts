import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatMessageDto {
  @ApiProperty({ description: 'Chat session ID', example: 'chat-123' })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ description: 'Message content', example: 'What products should I use for dry skin?' })
  @IsString()
  @IsNotEmpty()
  messageContent: string;
}