import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkinAnalysis } from './entities/skin-analysis.entity';
import { CreateSkinAnalysisDto } from './dto/create-skin-analysis.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class SkinAnalysisService {
  private readonly logger = new Logger(SkinAnalysisService.name);
  private readonly aiServiceUrl: string;

  constructor(
    @InjectRepository(SkinAnalysis)
    private skinAnalysisRepository: Repository<SkinAnalysis>,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000';
  }

  async classifyDisease(file: Express.Multer.File) {
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
      this.logger.error('Failed to classify disease:', error);
      throw new HttpException(
        error.response?.data?.message ||
          'Error calling AI classification service',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async segmentDisease(file: Express.Multer.File) {
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
      this.logger.error('Failed to segment disease:', error);
      throw new HttpException(
        error.response?.data?.message ||
          'Error calling AI segmentation service',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async classifyCondition(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      const response = await axios.post(
        `${this.aiServiceUrl}/api/condition`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to classify condition:', error);
      throw new HttpException(
        error.response?.data?.message || 'Error calling AI condition service',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Complete disease detection - Upload image, classify, segment, and save to database
   * @param file - Image file to analyze
   * @param customerId - Customer ID (passed as parameter)
   */
  async diseaseDetection(
    file: Express.Multer.File,
    customerId: string,
  ): Promise<SkinAnalysis> {
    try {
      this.logger.log(`Starting disease detection for customer: ${customerId}`);

      // 1. Upload image to Cloudinary
      this.logger.log('Uploading image to Cloudinary...');
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'skin-analysis/disease-detection',
      );
      const imageUrl = uploadResult.secure_url;
      this.logger.log(`Image uploaded: ${imageUrl}`);

      // 2. Call classify API
      this.logger.log('Calling AI classification service...');
      const classificationResult = await this.classifyDisease(file);
      const aiDetectedDisease = classificationResult.predicted_class;
      this.logger.log(`Disease detected: ${aiDetectedDisease}`);

      // 3. Call segment API
      this.logger.log('Calling AI segmentation service...');
      const segmentationResult = await this.segmentDisease(file);
      const maskBase64 = segmentationResult.mask;
      this.logger.log('Segmentation completed');

      // 4. Prepare data for database
      const skinAnalysisData: CreateSkinAnalysisDto = {
        customerId,
        source: 'AI_SCAN',
        imageUrls: [imageUrl],
        aiDetectedDisease,
        mask: [maskBase64],
      };

      // 5. Save to database
      this.logger.log('Saving analysis to database...');
      const analysis = this.skinAnalysisRepository.create(skinAnalysisData);
      const savedAnalysis = await this.skinAnalysisRepository.save(analysis);

      this.logger.log(`Analysis saved with ID: ${savedAnalysis.analysisId}`);

      return savedAnalysis;
    } catch (error) {
      this.logger.error('Disease detection failed:', error);
      throw new HttpException(
        error.message || 'Disease detection failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get analysis by ID
   */
  async findOne(analysisId: string): Promise<SkinAnalysis> {
    const analysis = await this.skinAnalysisRepository.findOne({
      where: { analysisId },
      relations: ['customer'],
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis with ID "${analysisId}" not found`);
    }

    return analysis;
  }

  /**
   * Get all analyses for a customer
   */
  async findByCustomerId(customerId: string): Promise<SkinAnalysis[]> {
    return await this.skinAnalysisRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all analyses
   */
  async findAll(): Promise<SkinAnalysis[]> {
    return await this.skinAnalysisRepository.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }
}
