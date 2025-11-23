import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as FormData from 'form-data';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatSession } from '../chat-sessions/entities/chat-session.entity';
import { ChatSessionsService } from '../chat-sessions/chat-sessions.service';

interface ConversationHistory {
  role: 'user' | 'ai';
  content: string;
}

interface ChatResponse {
  answer: string;
  response_time: number;
  timestamp: string;
}

interface ImageAnalysisResponse {
  skin_analysis: string;
  product_recommendation: string;
  severity_warning: string | null;
  response_time: number;
  timestamp: string;
}

@Injectable()
export class ChatMessagesService {
  private axiosInstance: AxiosInstance;
  private aiServiceUrl: string;

  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
    private chatSessionsService: ChatSessionsService,
    private configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
    
    if (!this.aiServiceUrl) {
      throw new Error('AI_SERVICE_URL is not set in environment variables');
    }

    // Initialize axios instance with a longer timeout for AI processing
    this.axiosInstance = axios.create({
      baseURL: this.aiServiceUrl,
      timeout: 60000, // 60 seconds timeout (VLM can take time)
    });
  }

  async createUserMessage(
    createChatMessageDto: CreateChatMessageDto,
    imageFile?: Express.Multer.File,
  ): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
    const { chatId, messageContent } = createChatMessageDto;

    // Verify chat session exists
    const chatSession = await this.chatSessionRepository.findOne({
      where: { chatId },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } } // Ensure order for context
    });

    if (!chatSession) {
      throw new NotFoundException(`Chat session with ID ${chatId} not found`);
    }

    // Check if this is the first user message
    const userMessages = chatSession.messages.filter(
      (msg) => msg.sender === 'user',
    );
    const isFirstUserMessage = userMessages.length === 0;

    // 1. Save User Message
    // If an image is attached, we append a marker to the text content stored in DB
    // This helps the UI know an image was sent (if you don't have a separate image URL field)
    const storedContent = imageFile 
      ? `${messageContent}\n[Attached Image: ${imageFile.originalname}]`
      : messageContent;

    const userMessage = this.chatMessageRepository.create({
      chatId,
      sender: 'user',
      messageContent: storedContent,
    });
    await this.chatMessageRepository.save(userMessage);

    // Update chat title if this is the first user message
    if (isFirstUserMessage) {
      await this.chatSessionsService.updateTitleFromMessage(
        chatId,
        messageContent,
      );
    }

    // 2. Get AI response from FastAPI backend
    const aiResponse = await this.getAIResponse(
      messageContent,
      chatSession.messages,
      imageFile,
    );

    // 3. Save AI message
    const aiMessage = this.chatMessageRepository.create({
      chatId,
      sender: 'ai',
      messageContent: aiResponse,
    });
    await this.chatMessageRepository.save(aiMessage);

    return { userMessage, aiMessage };
  }

  private async getAIResponse(
    userMessage: string,
    previousMessages: ChatMessage[],
    imageFile?: Express.Multer.File,
  ): Promise<string> {
    try {
      const formData = new FormData();

      // A. Append Question
      formData.append('question', userMessage);

      // B. Append History
      // Filter out greeting and clean up history
      const greetingMessage = "Greeting, I'm Skinalyze AI, how can i help you today?";
      const conversationHistory: ConversationHistory[] = previousMessages
        .filter((msg) => msg.messageContent !== greetingMessage)
        .map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'ai',
          // Remove internal image markers from history to not confuse the AI text model
          content: msg.messageContent.replace(/\[Attached Image:.*?\]/g, '').trim(),
        }));

      // FastAPI expects history as a JSON string in form-data
      formData.append('conversation_history', JSON.stringify(conversationHistory));

      // C. Append Image (if exists)
      if (imageFile) {
        formData.append('image', imageFile.buffer, {
          filename: imageFile.originalname,
          contentType: imageFile.mimetype,
        });
      }

      // Call FastAPI /chat endpoint
      // Note: We must spread formData.getHeaders() to set the correct Content-Type boundary
      const response = await this.axiosInstance.post<ChatResponse>('/chat', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      return response.data.answer;
    } catch (error) {
      console.error('AI Service error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('AI Service response error:', error.response.data);
          throw new BadRequestException(
            `AI Service error: ${error.response.data.detail || 'Unknown error'}`,
          );
        } else if (error.request) {
          console.error('No response from AI Service');
          throw new BadRequestException(
            'AI Service is not responding. Please try again later.',
          );
        }
      }
      
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  async analyzeImage(
    chatId: string,
    imageFile: Express.Multer.File,
    additionalText?: string,
  ): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
    // Verify chat session exists
    const chatSession = await this.chatSessionRepository.findOne({
      where: { chatId },
    });

    if (!chatSession) {
      throw new NotFoundException(`Chat session with ID ${chatId} not found`);
    }

    try {
      // Create FormData for image upload
      const formData = new FormData();
      
      formData.append('image', imageFile.buffer, {
        filename: imageFile.originalname,
        contentType: imageFile.mimetype,
      });

      if (additionalText) {
        formData.append('additional_text', additionalText);
      }

      // Call FastAPI /analyze-image endpoint
      const response = await this.axiosInstance.post<ImageAnalysisResponse>(
        '/analyze-image',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      // Save user message (image upload notification)
      const userMessage = this.chatMessageRepository.create({
        chatId,
        sender: 'user',
        messageContent: additionalText || '[Uploaded an image for analysis]',
      });
      await this.chatMessageRepository.save(userMessage);

      // Format AI response
      let aiResponseText = '';
      
      if (response.data.skin_analysis) {
        aiResponseText += `**Phân tích da:**\n${response.data.skin_analysis}\n\n`;
      }
      
      if (response.data.product_recommendation) {
        aiResponseText += `**Gợi ý sản phẩm:**\n${response.data.product_recommendation}\n\n`;
      }
      
      if (response.data.severity_warning) {
        aiResponseText += `⚠️ **Cảnh báo:**\n${response.data.severity_warning}`;
      }

      // Save AI message
      const aiMessage = this.chatMessageRepository.create({
        chatId,
        sender: 'ai',
        messageContent: aiResponseText.trim(),
      });
      await this.chatMessageRepository.save(aiMessage);

      return { userMessage, aiMessage };
    } catch (error) {
      console.error('Image analysis error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new BadRequestException(
            `Image analysis error: ${error.response.data.detail || 'Unknown error'}`,
          );
        } else if (error.request) {
          throw new BadRequestException(
            'AI Service is not responding. Please try again later.',
          );
        }
      }
      
      throw new BadRequestException(
        'Failed to analyze image. Please try again.',
      );
    }
  }

  async findAllByChatSession(chatId: string): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.find({
      where: { chatId },
      order: { createdAt: 'ASC' },
    });
  }

  async remove(messageId: string): Promise<void> {
    const message = await this.chatMessageRepository.findOne({
      where: { messageId },
    });
    
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }
    
    await this.chatMessageRepository.remove(message);
  }
}