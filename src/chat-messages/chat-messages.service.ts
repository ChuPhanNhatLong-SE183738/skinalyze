import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatSession } from '../chat-sessions/entities/chat-session.entity';
import { ChatSessionsService } from '../chat-sessions/chat-sessions.service';

@Injectable()
export class ChatMessagesService {
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
    private chatSessionsService: ChatSessionsService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async createUserMessage(createChatMessageDto: CreateChatMessageDto): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
    const { chatId, messageContent } = createChatMessageDto;

    // Verify chat session exists
    const chatSession = await this.chatSessionRepository.findOne({
      where: { chatId },
      relations: ['messages'],
    });

    if (!chatSession) {
      throw new NotFoundException(`Chat session with ID ${chatId} not found`);
    }

    // Check if this is the first user message (only greeting exists)
    const userMessages = chatSession.messages.filter(msg => msg.sender === 'user');
    const isFirstUserMessage = userMessages.length === 0;

    // Save user message
    const userMessage = this.chatMessageRepository.create({
      chatId,
      sender: 'user',
      messageContent,
    });
    await this.chatMessageRepository.save(userMessage);

    // Update chat title if this is the first user message
    if (isFirstUserMessage) {
      await this.chatSessionsService.updateTitleFromMessage(chatId, messageContent);
    }

    // Get AI response
    const aiResponse = await this.getGeminiResponse(messageContent, chatSession.messages);

    // Save AI message
    const aiMessage = this.chatMessageRepository.create({
      chatId,
      sender: 'ai',
      messageContent: aiResponse,
    });
    await this.chatMessageRepository.save(aiMessage);

    return { userMessage, aiMessage };
  }

  private async getGeminiResponse(userMessage: string, previousMessages: ChatMessage[]): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        systemInstruction: {
          role: 'system',
          parts: [{ 
            text: `You are Skinalyze AI, a specialized skincare and dermatology assistant. Your expertise is strictly limited to:
- Skincare products and ingredients
- Acne treatment and prevention
- Skincare routines and regimens
- Dermatological conditions and concerns
- Skin types and their specific needs
- Product recommendations for skin concerns
- General skincare advice and best practices

IMPORTANT RULES:
1. ONLY answer questions related to skincare, dermatology, and skin health.
2. If a user asks about topics outside of skincare (like programming, math, general knowledge, etc.), politely decline and redirect them back to skincare topics.
3. Use this exact response format for off-topic questions: "I apologize, but I'm specialized in skincare and dermatology advice only. I can help you with skin concerns, product recommendations, skincare routines, acne treatment, and other skin-related questions. Is there anything about skincare I can help you with today?"
4. Always provide helpful, accurate, and personalized skincare advice within your domain.
5. Recommend consulting a dermatologist for severe skin conditions or medical concerns.`
          }]
        }
      });

      // Filter out the greeting message
      const greetingMessage = "Greeting, I'm Skinalyze AI, how can i help you today?";
      const conversationMessages = previousMessages.filter(msg => 
        msg.messageContent !== greetingMessage
      );

      // Build history and ensure it starts with 'user' role
      let history = conversationMessages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.messageContent }],
      }));

      // If history exists and first message is from 'model', remove it
      // This ensures the conversation always starts with a user message
      while (history.length > 0 && history[0].role === 'model') {
        history.shift();
      }

      const chat = model.startChat({
        history: history.length > 0 ? history : undefined,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  async findAllByChatSession(chatId: string): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.find({
      where: { chatId },
      order: { createdAt: 'ASC' },
    });
  }

  async remove(messageId: string): Promise<void> {
    const message = await this.chatMessageRepository.findOne({ where: { messageId } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }
    await this.chatMessageRepository.remove(message);
  }
}