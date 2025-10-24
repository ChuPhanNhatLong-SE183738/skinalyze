import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  subscriptionDescription: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsInt()
  @Min(1)
  totalSessions: number;

  @IsInt()
  @Min(1)
  durationInDays: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
