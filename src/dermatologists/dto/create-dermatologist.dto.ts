import {
  IsOptional,
  IsNumber,
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
}
