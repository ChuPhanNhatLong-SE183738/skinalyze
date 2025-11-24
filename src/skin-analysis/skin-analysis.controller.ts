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
  Body,
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
import { CreateManualAnalysisDto } from './dto/create-manual-analysis.dto';

@ApiTags('Skin Analysis')
@Controller('skin-analysis')
export class SkinAnalysisController {
  constructor(private readonly skinAnalysisService: SkinAnalysisService) {}

  // ==================================================================
  // 1. PIPELINE: DISEASE DETECTION (AI + Face Check + Notes)
  // ==================================================================
  @Post('disease-detection/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete disease detection pipeline',
    description:
      '1. Checks for face visibility (Conditionally based on notes)\n' +
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
        notes: {
          type: 'string',
          description: 'Area context (e.g., "facial" or "other")',
          example: 'facial',
          nullable: true,
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
    @Body('notes') notes: string,
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
    return await this.skinAnalysisService.diseaseDetection(
      file,
      customerId,
      notes,
    );
  }

  // ==================================================================
  // 2. PIPELINE: CONDITION DETECTION (AI + Strict Face Check)
  // ==================================================================
  @Post('condition-detection/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete condition detection pipeline',
    description:
      '1. Strictly checks for face visibility\n' +
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
  // 3. MANUAL ENTRY (No AI)
  // ==================================================================
  @Post('manual-entry/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create manual skin analysis entry',
    description:
      'Uploads optional image and saves patient symptoms/complaints without AI processing.',
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
          description: 'Optional Image (Max 5MB)',
        },
        chiefComplaint: { type: 'string', example: 'Itchy skin' },
        patientSymptoms: { type: 'string', example: 'Redness, swelling' },
        notes: { type: 'string', nullable: true, example: 'Started yesterday' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async manualEntry(
    @Param('customerId') customerId: string,
    @Body() body: CreateManualAnalysisDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Manual entry allows optional file, so we don't use ParseFilePipe here
    // or we use a custom validator that allows undefined.
    // For simplicity, we just check file type if file exists inside service or here manually.
    return await this.skinAnalysisService.createManualEntry(
      customerId,
      body,
      file,
    );
  }

  // ==================================================================
  // 4. HELPER ENDPOINTS (Testing Only - Optional)
  // ==================================================================
  @Post('classification')
  @UseInterceptors(FileInterceptor('file'))
  async classifyImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('notes') notes: string,
  ) {
    return await this.skinAnalysisService.classifyDisease(file, notes);
  }

  @Post('segmentation')
  @UseInterceptors(FileInterceptor('file'))
  async segmentImage(@UploadedFile() file: Express.Multer.File) {
    return await this.skinAnalysisService.segmentDisease(file);
  }

  // ==================================================================
  // 5. RETRIEVAL ENDPOINTS
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
  @ApiOperation({ summary: 'Get all analyses for a specific customer' })
  async findByCustomerId(@Param('customerId') customerId: string) {
    return await this.skinAnalysisService.findByCustomerId(customerId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all skin analyses (Admin/Debug)' })
  async findAll() {
    return await this.skinAnalysisService.findAll();
  }
}