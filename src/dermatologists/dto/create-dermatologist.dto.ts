import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateDermatologistDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsNumber()
  yearsOfExp?: number;

  @IsArray()
  @IsString({ each: true })
  specializations?: string[];
}

export class UpdateDermatologistDto {
  @IsOptional()
  @IsNumber()
  yearsOfExp?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];
}
