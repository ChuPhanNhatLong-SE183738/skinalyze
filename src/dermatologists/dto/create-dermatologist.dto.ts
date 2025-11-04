import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateDermatologistDto {
  @IsOptional()
  @IsNumber()
  yearsOfExp?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(0)
  defaultSlotPrice?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  specializations?: string[];
}

export class UpdateDermatologistDto {
  @IsOptional()
  @IsNumber()
  yearsOfExp?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(0)
  defaultSlotPrice?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];
}
