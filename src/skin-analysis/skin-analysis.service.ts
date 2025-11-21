import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkinAnalysis } from './entities/skin-analysis.entity';
import { CreateSkinAnalysisDto } from './dto/create-skin-analysis.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Customer } from '../customers/entities/customer.entity';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class SkinAnalysisService {
  private readonly logger = new Logger(SkinAnalysisService.name);
  private readonly aiServiceUrl: string;

  constructor(
    @InjectRepository(SkinAnalysis)
    private skinAnalysisRepository: Repository<SkinAnalysis>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000';
  }

  // ==================================================================
  // HELPER METHODS
  // ==================================================================

  /**
   * Helper to create FormData for Axios calls to FastAPI
   */
  private createFormData(file: Express.Multer.File): FormData {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    return formData;
  }

  /**
   * Standardized Error Handling for Axios calls
   */
  private handleAxiosError(error: any, context: string) {
    this.logger.error(`AI Service Error [${context}]:`, error.message);

    if (error.response) {
      // Lỗi từ FastAPI trả về (4xx, 5xx)
      throw new HttpException(
        error.response.data?.detail ||
          error.response.data?.message ||
          'AI Service Error',
        error.response.status,
      );
    } else if (error.request) {
      // Không nhận được response (FastAPI down)
      throw new BadGatewayException(
        'Cannot connect to AI Service. Please try again later.',
      );
    }
    // Lỗi code nội bộ
    throw new HttpException(
      'Internal Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Validate if customer exists
   */
  private async validateCustomer(customerId: string): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { customerId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ID ${customerId} not found`);
      }
      return customer;
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      // Handle invalid UUID format error from DB
      throw new BadRequestException('Invalid Customer ID format');
    }
  }

  // ==================================================================
  // AI MICROSERVICE CALLS
  // ==================================================================

  /**
   * Check if image contains a face
   */
  async detectFace(file: Express.Multer.File): Promise<boolean> {
    try {
      const formData = this.createFormData(file);
      const response = await axios.post(
        `${this.aiServiceUrl}/api/face-detection`,
        formData,
        { headers: { ...formData.getHeaders() } },
      );
      // FastAPI trả về: { "has_face": boolean }
      return response.data.has_face;
    } catch (error) {
      this.logger.warn(
        `Face detection service warning: ${error.message}. Proceeding anyway.`,
      );
      // Nếu service check mặt bị lỗi, ta có thể chọn:
      // 1. return true (cho qua để AI chính xử lý) -> Chọn cách này để an toàn
      // 2. throw error (chặn luôn)
      return true;
    }
  }

  async classifyDisease(file: Express.Multer.File) {
    try {
      const formData = this.createFormData(file);
      const response = await axios.post(
        `${this.aiServiceUrl}/api/classification-disease`,
        formData,
        { headers: { ...formData.getHeaders() } },
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'disease classification');
    }
  }

  async segmentDisease(file: Express.Multer.File) {
    try {
      const formData = this.createFormData(file);
      const response = await axios.post(
        `${this.aiServiceUrl}/api/segmentation-disease`,
        formData,
        { headers: { ...formData.getHeaders() } },
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'segmentation');
    }
  }

  async classifyCondition(file: Express.Multer.File) {
    try {
      const formData = this.createFormData(file);
      const response = await axios.post(
        `${this.aiServiceUrl}/api/classification-condition`,
        formData,
        { headers: { ...formData.getHeaders() } },
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'condition classification');
    }
  }

  // ==================================================================
  // MAIN BUSINESS LOGIC
  // ==================================================================

  /**
   * Flow: Validate -> Face Check -> Upload -> AI -> Save
   */
  async diseaseDetection(
    file: Express.Multer.File,
    customerId: string,
  ): Promise<SkinAnalysis> {
    this.logger.log(`Starting disease detection for: ${customerId}`);

    // 1. Validate Customer
    await this.validateCustomer(customerId);

    // 2. Check Face (FastAPI) - Fail fast
    this.logger.debug('Step 1: Checking for face...');
    const hasFace = await this.detectFace(file);
    if (!hasFace) {
      throw new BadRequestException(
        'No face detected. Please upload a clear image of a face.',
      );
    }

    // 3. Upload to Cloudinary
    this.logger.debug('Step 2: Uploading to Cloudinary...');
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'skin-analysis/disease-detection',
    );
    const imageUrl = uploadResult.secure_url;

    // 4. AI Analysis (Parallel execution)
    this.logger.debug('Step 3: Calling AI Services...');
    const [classificationResult, segmentationResult] = await Promise.all([
      this.classifyDisease(file),
      this.segmentDisease(file),
    ]);

    // 5. Save to DB
    this.logger.debug('Step 4: Saving to Database...');
    const skinAnalysisData: CreateSkinAnalysisDto = {
      customerId,
      source: 'AI_SCAN',
      imageUrls: [imageUrl],
      aiDetectedDisease: classificationResult.predicted_class,
      mask: [segmentationResult.mask], // mask là array string
      // Bạn có thể lưu thêm confidence nếu entity có cột đó
    };

    const savedAnalysis = await this.skinAnalysisRepository.save(
      this.skinAnalysisRepository.create(skinAnalysisData),
    );

    this.logger.log(`Disease analysis completed: ${savedAnalysis.analysisId}`);
    return savedAnalysis;
  }

  /**
   * Flow: Validate -> Face Check -> Upload -> AI -> Save
   */
  async conditionDetection(
    file: Express.Multer.File,
    customerId: string,
  ): Promise<SkinAnalysis> {
    this.logger.log(`Starting condition detection for: ${customerId}`);

    // 1. Validate Customer
    await this.validateCustomer(customerId);

    // 2. Check Face
    this.logger.debug('Step 1: Checking for face...');
    const hasFace = await this.detectFace(file);
    if (!hasFace) {
      throw new BadRequestException(
        'No face detected. Please upload a clear image of a face.',
      );
    }

    // 3. Upload to Cloudinary
    this.logger.debug('Step 2: Uploading to Cloudinary...');
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'skin-analysis/condition-detection',
    );
    const imageUrl = uploadResult.secure_url;

    // 4. AI Analysis
    this.logger.debug('Step 3: Calling AI Condition Service...');
    const classificationResult = await this.classifyCondition(file);

    // 5. Save to DB
    this.logger.debug('Step 4: Saving to Database...');
    const skinAnalysisData: CreateSkinAnalysisDto = {
      customerId,
      source: 'AI_SCAN',
      imageUrls: [imageUrl],
      aiDetectedCondition: classificationResult.predicted_condition,
    };

    const savedAnalysis = await this.skinAnalysisRepository.save(
      this.skinAnalysisRepository.create(skinAnalysisData),
    );

    this.logger.log(`Condition analysis completed: ${savedAnalysis.analysisId}`);
    return savedAnalysis;
  }

  // ==================================================================
  // DATA RETRIEVAL
  // ==================================================================

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

  async findByCustomerId(customerId: string): Promise<SkinAnalysis[]> {
    return await this.skinAnalysisRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<SkinAnalysis[]> {
    return await this.skinAnalysisRepository.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }
}