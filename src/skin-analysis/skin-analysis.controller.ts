import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SkinAnalysisService } from './skin-analysis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Skin Analysis')
@Controller('skin-analysis')
export class SkinAnalysisController {
  constructor(private readonly skinAnalysisService: SkinAnalysisService) {}

  @Post('classification')
  @ApiOperation({
    summary: 'Classify skin disease from image',
    description:
      'Upload an image to classify the skin disease using AI. Returns the predicted disease class with confidence scores.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload an image file for disease classification',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (.jpg, .jpeg, .png) - Max 5MB',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image classified successfully',
    schema: {
      type: 'object',
      properties: {
        predicted_class: {
          type: 'string',
          example: 'Rosacea',
          description: 'The predicted disease class',
        },
        confidence: {
          type: 'number',
          example: 0.697215735912323,
          description: 'Confidence score for the prediction (0-1)',
        },
        all_predictions: {
          type: 'object',
          example: {
            Acne: 0.11240947246551514,
            Rosacea: 0.697215735912323,
            Eczema: 0.08234567890123456,
          },
          description: 'Confidence scores for all possible disease classes',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file format or file too large',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error calling AI classification service',
  })
  @UseInterceptors(FileInterceptor('file'))
  async classifyImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.skinAnalysisService.classifyDisease(file);
  }

  @Post('segmentation')
  @ApiOperation({
    summary: 'Segment skin lesion from image',
    description:
      'Upload an image to segment the skin lesion using AI. Returns a base64-encoded mask highlighting the affected area.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload an image file for lesion segmentation',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (.jpg, .jpeg, .png) - Max 5MB',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image segmented successfully',
    schema: {
      type: 'object',
      properties: {
        mask: {
          type: 'string',
          example: 'iVBORw0KGgoAAAANSUhEUgAAA...',
          description: 'Base64-encoded PNG image of the segmentation mask',
        },
        format: {
          type: 'string',
          example: 'base64_png',
          description: 'Format of the mask data',
        },
        original_size: {
          type: 'array',
          items: { type: 'number' },
          example: [275, 183],
          description: 'Original image dimensions [width, height]',
        },
        confidence: {
          type: 'number',
          example: 0.9554877281188965,
          description: 'Confidence score for the segmentation (0-1)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file format or file too large',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error calling AI segmentation service',
  })
  @UseInterceptors(FileInterceptor('file'))
  async segmentImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.skinAnalysisService.segmentDisease(file);
  }

  @Post('disease-detection')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete disease detection pipeline',
    description:
      'Complete AI-powered skin disease detection pipeline. This endpoint:\n' +
      '1. Uploads the image to Cloudinary\n' +
      '2. Classifies the disease using AI\n' +
      '3. Segments the affected area\n' +
      '4. Saves all results to the database\n\n' +
      'Requires JWT authentication and a valid customerId.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload image and provide customer ID for disease detection',
    schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Customer ID (UUID format)',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (.jpg, .jpeg, .png) - Max 5MB',
        },
      },
      required: ['customerId', 'file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Disease detection completed and analysis saved to database',
    schema: {
      type: 'object',
      properties: {
        analysisId: {
          type: 'string',
          example: '8a94a13f-9e06-4ba1-858c-5af59218d832',
          description: 'Unique identifier for the analysis',
        },
        customerId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
          description: 'Customer ID who requested the analysis',
        },
        source: {
          type: 'string',
          example: 'AI_SCAN',
          description: 'Source of the analysis',
        },
        chiefComplaint: {
          type: 'string',
          nullable: true,
          example: null,
          description: 'Chief complaint (optional)',
        },
        patientSymptoms: {
          type: 'string',
          nullable: true,
          example: null,
          description: 'Patient symptoms (optional)',
        },
        imageUrls: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'https://res.cloudinary.com/dmtfteyxh/image/upload/v1761915961/skin-analysis/disease-detection/udikjltqwqmy2e8zvhw8.jpg',
          ],
          description: 'URLs of uploaded images',
        },
        notes: {
          type: 'string',
          nullable: true,
          example: null,
          description: 'Additional notes (optional)',
        },
        aiDetectedDisease: {
          type: 'string',
          example: 'Rosacea',
          description: 'AI-detected disease classification',
        },
        aiDetectedCondition: {
          type: 'string',
          nullable: true,
          example: null,
          description: 'AI-detected skin condition (optional)',
        },
        aiRecommendedProducts: {
          type: 'array',
          nullable: true,
          example: null,
          description: 'AI-recommended products (optional)',
        },
        mask: {
          type: 'array',
          items: { type: 'string' },
          example: ['iVBORw0KGgoAAAANSUhEUgAAA...'],
          description: 'Base64-encoded segmentation masks',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-31T20:06:05.123Z',
          description: 'Timestamp when analysis was created',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-31T20:06:05.123Z',
          description: 'Timestamp when analysis was last updated',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request - customerId is required or invalid file',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error during processing',
  })
  @UseInterceptors(FileInterceptor('file'))
  async diseaseDetection(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('customerId') customerId: string,
  ) {
    // Validate customerId is provided
    if (!customerId) {
      throw new HttpException(
        'customerId is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.skinAnalysisService.diseaseDetection(file, customerId);
  }

  @Post('condition-detection')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete condition detection pipeline',
    description:
      'Complete AI-powered skin condition detection pipeline. This endpoint:\n' +
      '1. Uploads the image to Cloudinary\n' +
      '2. Detects the skin condition using AI\n' +
      '3. Saves all results to the database\n\n' +
      'Requires JWT authentication and a valid customerId.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload image and provide customer ID for condition detection',
    schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Customer ID (UUID format)',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (.jpg, .jpeg, .png) - Max 5MB',
        },
      },
      required: ['customerId', 'file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Condition detection completed and analysis saved to database',
    schema: {
      type: 'object',
      properties: {
        analysisId: {
          type: 'string',
          example: '8a94a13f-9e06-4ba1-858c-5af59218d832',
          description: 'Unique identifier for the analysis',
        },
        customerId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
          description: 'Customer ID who requested the analysis',
        },
        source: {
          type: 'string',
          example: 'AI_SCAN',
          description: 'Source of the analysis',
        },
        chiefComplaint: {
          type: 'string',
          nullable: true,
          example: null,
          description: 'Chief complaint (will be null for AI scans)',
        },
        patientSymptoms: {
          type: 'string',
          nullable: true,
          example: null,
          description: 'Patient symptoms (will be null for AI scans)',
        },
        imageUrls: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'https://res.cloudinary.com/dmtfteyxh/image/upload/v1761915961/skin-analysis/condition-detection/xyz789.jpg',
          ],
          description: 'URLs of uploaded images from Cloudinary',
        },
        notes: {
          type: 'string',
          nullable: true,
          example: null,
          description: 'Additional notes (will be null for AI scans)',
        },
        aiDetectedDisease: {
          type: 'string',
          nullable: true,
          example: null,
          description: 'AI-detected disease classification (will be null for condition detection)',
        },
        aiDetectedCondition: {
          type: 'string',
          example: 'Oily',
          description: 'AI-detected skin condition (Oily, Dry, Normal, Sensitive, etc.)',
        },
        aiRecommendedProducts: {
          type: 'array',
          nullable: true,
          example: null,
          description: 'AI-recommended products (will be null for now)',
        },
        mask: {
          type: 'array',
          items: { type: 'string' },
          nullable: true,
          example: null,
          description: 'Segmentation masks (will be null for condition detection)',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-31T20:06:05.123Z',
          description: 'Timestamp when analysis was created',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-31T20:06:05.123Z',
          description: 'Timestamp when analysis was last updated',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request - customerId is required or invalid file',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error during processing',
  })
  @UseInterceptors(FileInterceptor('file'))
  async detectCondition(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('customerId') customerId: string,
  ) {
    // Validate customerId is provided
    if (!customerId) {
      throw new HttpException(
        'customerId is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.skinAnalysisService.conditionDetection(file, customerId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get skin analysis by ID',
    description: 'Retrieve a specific skin analysis record by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Analysis ID (UUID)',
    example: '8a94a13f-9e06-4ba1-858c-5af59218d832',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analysis found and returned successfully',
    schema: {
      type: 'object',
      properties: {
        analysisId: { type: 'string', example: '8a94a13f-9e06-4ba1-858c-5af59218d832' },
        customerId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        source: { type: 'string', example: 'AI_SCAN' },
        imageUrls: {
          type: 'array',
          items: { type: 'string' },
          example: ['https://res.cloudinary.com/.../image.jpg'],
        },
        aiDetectedDisease: { type: 'string', example: 'Rosacea' },
        mask: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        customer: {
          type: 'object',
          description: 'Customer information (if relations are loaded)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Analysis not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findOne(@Param('id') id: string) {
    return await this.skinAnalysisService.findOne(id);
  }

  @Get('customer/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all analyses for a customer',
    description:
      'Retrieve all skin analysis records for a specific customer, ordered by creation date (newest first).',
  })
  @ApiParam({
    name: 'customerId',
    description: 'Customer ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of analyses for the customer',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          analysisId: { type: 'string' },
          customerId: { type: 'string' },
          source: { type: 'string' },
          imageUrls: { type: 'array', items: { type: 'string' } },
          aiDetectedDisease: { type: 'string' },
          mask: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findByCustomerId(@Param('customerId') customerId: string) {
    return await this.skinAnalysisService.findByCustomerId(customerId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all skin analyses',
    description:
      'Retrieve all skin analysis records in the system (Admin only). Includes customer relations and ordered by creation date (newest first).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all analyses',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          analysisId: { type: 'string' },
          customerId: { type: 'string' },
          source: { type: 'string' },
          imageUrls: { type: 'array', items: { type: 'string' } },
          aiDetectedDisease: { type: 'string' },
          mask: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          customer: {
            type: 'object',
            description: 'Customer information',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin access required',
  })
  async findAll() {
    return await this.skinAnalysisService.findAll();
  }
}