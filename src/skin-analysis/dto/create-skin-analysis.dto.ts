import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';

export class CreateSkinAnalysisDto {
  @IsString()
  customerId: string;

  @IsString()
  diseaseGroupId: string;

  @IsEnum(['AI_SCAN', 'MANUAL'])
  source: string;

  @IsString()
  chiefComplaint: string;

  @IsString()
  patientSymptoms: string;

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
}