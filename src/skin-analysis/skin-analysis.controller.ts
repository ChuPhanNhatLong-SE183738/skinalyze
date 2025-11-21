import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  HttpStatus,
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

  // ==================================================================
  // PIPELINE: DISEASE DETECTION (Có check Face)
  // ==================================================================
  @Post('disease-detection/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete disease detection pipeline',
    description:
      '1. Checks for face visibility (FastAPI)\n' +
      '2. Uploads to Cloudinary\n' +
      '3. Classifies disease & segments lesion\n' +
      '4. Saves result to MySQL',
  })
  @ApiParam({
    name: 'customerId',
    description: 'Customer ID (UUID)',
    required: true,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (Max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Analysis saved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file OR No face detected in image',
  })
  @UseInterceptors(FileInterceptor('file'))
  async diseaseDetection(
    @Param('customerId') customerId: string,
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
    return await this.skinAnalysisService.diseaseDetection(file, customerId);
  }

  // ==================================================================
  // PIPELINE: CONDITION DETECTION (Có check Face)
  // ==================================================================
  @Post('condition-detection/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete condition detection pipeline',
    description:
      '1. Checks for face visibility (FastAPI)\n' +
      '2. Uploads to Cloudinary\n' +
      '3. Detects skin condition (Oily, Dry, Normal)\n' +
      '4. Saves result to MySQL',
  })
  @ApiParam({ name: 'customerId', required: true })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Analysis saved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file OR No face detected',
  })
  @UseInterceptors(FileInterceptor('file'))
  async detectCondition(
    @Param('customerId') customerId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.skinAnalysisService.conditionDetection(file, customerId);
  }

  // ==================================================================
  // HELPER ENDPOINTS (Testing Only - Optional)
  // ==================================================================
  @Post('classification')
  @UseInterceptors(FileInterceptor('file'))
  async classifyImage(@UploadedFile() file: Express.Multer.File) {
    return await this.skinAnalysisService.classifyDisease(file);
  }

  @Post('segmentation')
  @UseInterceptors(FileInterceptor('file'))
  async segmentImage(@UploadedFile() file: Express.Multer.File) {
    return await this.skinAnalysisService.segmentDisease(file);
  }

  // ==================================================================
  // RETRIEVAL ENDPOINTS
  // ==================================================================
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get skin analysis by ID' })
  async findOne(@Param('id') id: string) {
    return await this.skinAnalysisService.findOne(id);
  }

  @Get('customer/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all analyses for a customer' })
  async findByCustomerId(@Param('customerId') customerId: string) {
    return await this.skinAnalysisService.findByCustomerId(customerId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all skin analyses (Admin)' })
  async findAll() {
    return await this.skinAnalysisService.findAll();
  }
}