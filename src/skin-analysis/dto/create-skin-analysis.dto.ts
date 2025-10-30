import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateSkinAnalysisDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'In-person consultation', required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({
    example: 'Patient reports redness and itchiness on cheeks',
    required: false,
  })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiProperty({
    example: 'Dry patches and occasional flaking',
    required: false,
  })
  @IsOptional()
  @IsString()
  patientSymptoms?: string;

  @ApiProperty({
    example: [
      'https://example.com/skin-images/image123.jpg',
      'https://example.com/skin-images/image456.jpg',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiProperty({ example: 'Recommend gentle moisturizer', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'Eczema', required: false })
  @IsOptional()
  @IsString()
  aiDetectedDisease?: string;

  @ApiProperty({ example: 'Dry skin', required: false })
  @IsOptional()
  @IsString()
  aiDetectedCondition?: string;

  @ApiProperty({
    example: ['product-id-1', 'product-id-2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aiRecommendedProducts?: string[];
}
