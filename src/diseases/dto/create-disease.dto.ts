import { IsNotEmpty, IsString, IsBoolean, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { SeverityLevel } from '../entities/disease.entity';

export class CreateDiseaseDto {
  @IsNotEmpty()
  @IsUUID()
  diseaseGroupId: string;

  @IsNotEmpty()
  @IsString()
  diseaseName: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  symptoms: string;

  @IsNotEmpty()
  @IsString()
  causes: string;

  @IsOptional()
  @IsBoolean()
  isInfectious?: boolean;

  @IsOptional()
  @IsEnum(SeverityLevel)
  severityLevel?: SeverityLevel;
}