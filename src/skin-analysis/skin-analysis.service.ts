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
import { Repository, DeepPartial, In } from 'typeorm';
import { SkinAnalysis } from './entities/skin-analysis.entity';
import { CreateManualAnalysisDto } from './dto/create-manual-analysis.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import axios from 'axios';
import * as FormData from 'form-data';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SkinAnalysisService {
  private readonly logger = new Logger(SkinAnalysisService.name);
  private readonly aiServiceUrl: string;

  private readonly DISEASE_TO_SKIN_TYPES: Record<string, string[]> = {
    warts: ['combination', 'dry', 'normal', 'oily', 'sensitive'],
    acne: ['combination', 'oily', 'sensitive'],
    actinic_keratosis: ['dry', 'normal'],
    drug_eruption: ['combination', 'dry', 'normal', 'oily', 'sensitive'],
    eczema: ['combination', 'dry', 'normal', 'oily', 'sensitive'],
    psoriasis: ['dry'],
    rosacea: ['combination', 'oily', 'sensitive'],
    seborrh_keratoses: ['normal', 'oily', 'sensitive'],
    sun_sunlight_damage: ['combination', 'dry', 'normal', 'sensitive'],
    tinea: ['combination', 'oily'],
    normal: ['normal'],
  };

  constructor(
    @InjectRepository(SkinAnalysis)
    private skinAnalysisRepository: Repository<SkinAnalysis>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
    private readonly customersService: CustomersService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000';
  }

  private createFormData(file: Express.Multer.File): FormData {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    return formData;
  }

  private handleAxiosError(error: any, context: string) {
    this.logger.error(`AI Service Error [${context}]:`, error.message);

    if (error.response) {
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
    throw new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);
  }

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

  private async uploadBase64ToCloudinary(
    base64String: string,
    folder: string,
  ): Promise<string | null> {
    try {
      // Remove header if present (e.g., "data:image/png;base64,")
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Create a mock file object compatible with CloudinaryService.uploadImage
      const mockFile: any = {
        buffer: buffer,
        originalname: `mask_${Date.now()}.png`,
        mimetype: 'image/png',
      };

      const uploadResult = await this.cloudinaryService.uploadImage(
        mockFile,
        folder,
      );
      return uploadResult.secure_url;
    } catch (error) {
      this.logger.error('Failed to upload Base64 mask to Cloudinary', error);
      return null;
    }
  }

  private async findProductIdsByNames(
    productNames: string[],
  ): Promise<string[]> {
    if (!productNames || productNames.length === 0) {
      return [];
    }

    try {
      this.logger.debug(`Searching for products: ${productNames.join(', ')}`);

      // Search for products by name (case-insensitive, partial match)
      const products = await this.productRepository
        .createQueryBuilder('product')
        .where(
          productNames
            .map(
              (_, index) =>
                `LOWER(product.productName) LIKE LOWER(:name${index})`,
            )
            .join(' OR '),
          productNames.reduce((acc, name, index) => {
            acc[`name${index}`] = `%${name.trim()}%`;
            return acc;
          }, {}),
        )
        .getMany();

      const foundProductIds = products.map((product) => product.productId);

      this.logger.debug(
        `Found ${foundProductIds.length} products: ${foundProductIds.join(', ')}`,
      );

      if (foundProductIds.length === 0) {
        this.logger.warn(
          `No products found for names: ${productNames.join(', ')}`,
        );
      }

      return foundProductIds;
    } catch (error) {
      this.logger.error('Error finding products by names:', error);
      return [];
    }
  }

  async detectFace(file: Express.Multer.File): Promise<boolean> {
    try {
      const formData = this.createFormData(file);
      const response = await axios.post(
        `${this.aiServiceUrl}/api/face-detection`,
        formData,
        { headers: { ...formData.getHeaders() } },
      );
      return response.data.has_face;
    } catch (error) {
      this.logger.warn(
        `Face detection service warning: ${error.message}. Defaulting to true.`,
      );
      return true;
    }
  }

  async classifyDisease(file: Express.Multer.File, notes?: string) {
    try {
      const formData = this.createFormData(file);
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
      return response.data; // Returns { mask: "base64...", lesion_on_black: "base64..." }
    } catch (error) {
      this.handleAxiosError(error, 'segmentation');
    }
  }

  async createManualEntry(
    userId: string,
    dto: CreateManualAnalysisDto,
    files?: Express.Multer.File[],
  ): Promise<SkinAnalysis> {
    const customer = await this.customersService.findByUserId(userId);

    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      this.logger.debug(
        `Uploading ${files.length} manual images to Cloudinary...`,
      );
      try {
        const uploadPromises = files.map((file) =>
          this.cloudinaryService.uploadImage(
            file,
            'skin-analysis/manual-uploads',
          ),
        );

        const uploadResults = await Promise.all(uploadPromises);

        imageUrls = uploadResults.map((result) => result.secure_url);
      } catch (error) {
        this.logger.error('Cloudinary Upload Failed', error);
        throw new BadGatewayException('Failed to upload one or more images');
      }
    }

    const analysisData: DeepPartial<SkinAnalysis> = {
      customerId: customer.customerId,
      source: 'MANUAL',
      chiefComplaint: dto.chiefComplaint,
      patientSymptoms: dto.patientSymptoms,
      notes: dto.notes ?? null,
      imageUrls: imageUrls,
      aiDetectedDisease: null,
      aiDetectedCondition: null,
      aiRecommendedProducts: null,
      mask: null,
      confidence: null,
      allPredictions: null,
    };

    const entity = this.skinAnalysisRepository.create(analysisData);
    const savedAnalysis = await this.skinAnalysisRepository.save(entity);

    return savedAnalysis;
  }

  async diseaseDetection(
    file: Express.Multer.File,
    customerId: string,
    notes?: string,
  ): Promise<SkinAnalysis> {
    this.logger.log(`Starting disease detection for: ${customerId}`);
    await this.validateCustomer(customerId);

    if (notes === 'facial') {
      const hasFace = await this.detectFace(file);
      if (!hasFace) {
        throw new BadRequestException(
          'No face detected. Please upload a clear image of a face for facial analysis.',
        );
      }
    }

    // 1. Upload Original Image
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'skin-analysis/disease-detection',
    );
    const imageUrl = uploadResult.secure_url;

    // 2. Run AI Analysis
    const [classificationResult, segmentationResult] = await Promise.all([
      this.classifyDisease(file, notes),
      this.segmentDisease(file),
    ]);

    // Log AI response to debug
    this.logger.debug(
      `AI Classification Response: ${JSON.stringify(classificationResult)}`,
    );

    // 3. Process Mask
    let maskUrls: string[] | null = null;
    if (segmentationResult?.mask) {
      this.logger.debug('Uploading segmentation mask to Cloudinary...');
      const uploadedMaskUrl = await this.uploadBase64ToCloudinary(
        segmentationResult.mask,
        'skin-analysis/masks',
      );
      if (uploadedMaskUrl) {
        maskUrls = [uploadedMaskUrl];
      }
    }

    // 4. Find product IDs from product suggestions
    let recommendedProductIds: string[] | null = null;
    if (
      classificationResult.product_suggestions &&
      Array.isArray(classificationResult.product_suggestions) &&
      classificationResult.product_suggestions.length > 0
    ) {
      this.logger.debug(
        `Product suggestions from AI: ${JSON.stringify(classificationResult.product_suggestions)}`,
      );
      recommendedProductIds = await this.findProductIdsByNames(
        classificationResult.product_suggestions,
      );

      if (recommendedProductIds.length === 0) {
        recommendedProductIds = null;
      }
    }

    // 5. Map disease to skin conditions
    const detectedDisease = classificationResult.predicted_class;
    const skinConditions = this.mapDiseaseToConditions(detectedDisease);

    this.logger.debug(
      `Mapped disease "${detectedDisease}" to conditions: ${JSON.stringify(skinConditions)}`,
    );

    // 6. Save to DB with all predictions, product IDs, and skin conditions
    const skinAnalysisData: DeepPartial<SkinAnalysis> = {
      customerId,
      source: 'AI_SCAN',
      imageUrls: [imageUrl],
      notes: notes ?? null,
      aiDetectedDisease: detectedDisease,
      aiDetectedCondition: skinConditions ? skinConditions.join(', ') : null, // Store as comma-separated string
      confidence: classificationResult.confidence,
      allPredictions: classificationResult.all_predictions,
      aiRecommendedProducts: recommendedProductIds,
      mask: maskUrls,
    };

    const entity = this.skinAnalysisRepository.create(skinAnalysisData);
    const savedAnalysis = await this.skinAnalysisRepository.save(entity);

    this.logger.log(`Disease analysis completed: ${savedAnalysis.analysisId}`);
    this.logger.log(
      `Recommended product IDs: ${JSON.stringify(savedAnalysis.aiRecommendedProducts)}`,
    );
    this.logger.log(
      `Detected conditions: ${savedAnalysis.aiDetectedCondition}`,
    );

    return savedAnalysis;
  }

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
    await this.validateCustomer(customerId);
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

  /**
   * Maps the detected disease to possible skin conditions/types
   * @param disease - The AI detected disease (e.g., "Acne", "Tinea", "Normal")
   * @returns Array of possible skin conditions or null if no mapping found
   */
  private mapDiseaseToConditions(disease: string | null): string[] | null {
    if (!disease) {
      return null;
    }

    // Normalize the disease name: lowercase and replace spaces with underscores
    const normalizedDisease = disease.toLowerCase().replace(/\s+/g, '_');

    // Try to find exact match first
    if (this.DISEASE_TO_SKIN_TYPES[normalizedDisease]) {
      return this.DISEASE_TO_SKIN_TYPES[normalizedDisease];
    }

    // Try partial match for cases like "Seborrh_Keratoses" vs "seborrheic_keratoses"
    for (const [key, conditions] of Object.entries(this.DISEASE_TO_SKIN_TYPES)) {
      if (
        normalizedDisease.includes(key) ||
        key.includes(normalizedDisease) ||
        normalizedDisease.replace(/_/g, '').includes(key.replace(/_/g, '')) ||
        key.replace(/_/g, '').includes(normalizedDisease.replace(/_/g, ''))
      ) {
        return conditions;
      }
    }

    this.logger.warn(`No skin condition mapping found for disease: ${disease}`);
    return null;
  }
}
