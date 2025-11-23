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
      // Pass through specific error messages from FastAPI (e.g., "No face detected")
      throw new HttpException(
        error.response.data?.detail ||
          error.response.data?.message ||
          'AI Service Error',
        error.response.status,
      );
    } else if (error.request) {
      throw new BadGatewayException(
        'Cannot connect to AI Service. Please try again later.',
      );
    }
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
      // FastAPI returns: { "has_face": boolean }
      return response.data.has_face;
    } catch (error) {
      this.logger.warn(
        `Face detection service warning: ${error.message}. Proceeding cautiously.`,
      );
      // Fail open: If AI service errors (not 400, but 500/network), assume true to not block user
      // unless it's a logic error handled elsewhere.
      return true;
    }
  }

  /**
   * Call classification endpoint, optionally sending notes about area
   */
  async classifyDisease(file: Express.Multer.File, notes?: string) {
    try {
      const formData = this.createFormData(file);

      // Append the note if it exists (facial / other)
      if (notes) {
        formData.append('notes', notes);
      }

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
   * Flow: Validate -> Face Check -> Upload -> AI (with Notes) -> Save
   */
  async diseaseDetection(
    file: Express.Multer.File,
    customerId: string,
    notes?: string,
  ): Promise<SkinAnalysis> {
    this.logger.log(`Starting disease detection for: ${customerId}`);

    // 1. Validate Customer
    await this.validateCustomer(customerId);

    // 2. Check Face (FastAPI)
    this.logger.debug('Step 1: Checking for face...');
    
    // CRITICAL LOGIC: If user selected "facial", we MUST detect a face.
    // If user selected "other", we skip the face check check or ignore false results.
    if (notes === 'facial') {
      const hasFace = await this.detectFace(file);
      if (!hasFace) {
        this.logger.warn('No face detected for facial analysis. Aborting.');
        throw new BadRequestException(
          'No face detected. Please upload a clear image of a face for facial analysis.',
        );
      }
    }

    // 3. Upload to Cloudinary (Only happens if face check passed/skipped)
    this.logger.debug('Step 2: Uploading to Cloudinary...');
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'skin-analysis/disease-detection',
    );
    const imageUrl = uploadResult.secure_url;

    // 4. AI Analysis (Parallel execution)
    this.logger.debug('Step 3: Calling AI Services...');
    
    // We pass 'notes' to classifyDisease so the Python backend also has context 
    // (and performs its own double-check if configured)
    const [classificationResult, segmentationResult] = await Promise.all([
      this.classifyDisease(file, notes), 
      this.segmentDisease(file),
    ]);

    // 5. Save to DB
    this.logger.debug('Step 4: Saving to Database...');
    const skinAnalysisData: CreateSkinAnalysisDto = {
      customerId,
      source: 'AI_SCAN',
      imageUrls: [imageUrl],
      notes: notes, // Store "facial" or "other" in the database
      aiDetectedDisease: classificationResult.predicted_class,
      mask: [segmentationResult.mask], // mask is array string
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
    // Condition detection (Oily/Dry/Normal) is ALWAYS facial.
    this.logger.debug('Step 1: Checking for face...');
    const hasFace = await this.detectFace(file);
    
    if (!hasFace) {
      this.logger.warn('No face detected for condition analysis. Aborting.');
      // Stop execution immediately. Do not upload. Do not save.
      throw new BadRequestException(
        'No face detected. Please upload a clear image of a face for skin condition analysis.',
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