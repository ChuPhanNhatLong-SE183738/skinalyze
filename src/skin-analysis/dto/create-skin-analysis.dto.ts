import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsUrl,
  IsDateString,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateSkinAnalysisDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'https://example.com/skin-images/image123.jpg' })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    example: 'Oily',
    description: 'Skin type: Oily, Dry, Combination, Normal, Sensitive',
  })
  @IsString()
  skinType: string;

  @ApiProperty({ example: '2025-10-08T10:30:00Z', required: false })
  @IsOptional()
  @IsDateString()
  analysisDate?: string;

  @ApiProperty({
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendedProducts?: string[];
}
