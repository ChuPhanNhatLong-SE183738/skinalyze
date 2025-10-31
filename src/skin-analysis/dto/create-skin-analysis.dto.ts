import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';

export class CreateSkinAnalysisDto {
  @IsString()
  customerId: string;

  @IsEnum(['AI_SCAN', 'MANUAL'])
  source: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  patientSymptoms?: string;

  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  aiDetectedDisease?: string;

  @IsOptional()
  @IsString()
  aiDetectedCondition?: string;

  @IsOptional()
  @IsArray()
  aiRecommendedProducts?: any[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mask?: string[];
}