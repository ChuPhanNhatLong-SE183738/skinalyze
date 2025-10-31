import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkinAnalysis } from './entities/skin-analysis.entity';
import { CreateSkinAnalysisDto } from './dto/create-skin-analysis.dto';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class SkinAnalysisService {
  private readonly aiServiceUrl: string;

  constructor(
    @InjectRepository(SkinAnalysis)
    private skinAnalysisRepository: Repository<SkinAnalysis>,
    private configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
  }

  async classifyImage(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const response = await axios.post(
        `${this.aiServiceUrl}/api/classify`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Error calling AI classification service',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async segmentImage(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const response = await axios.post(
        `${this.aiServiceUrl}/api/segment`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Error calling AI segmentation service',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}