import {
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AvailabilityStatus {
  AVAILABLE = 'available', // Có thể đặt lịch
  OCCUPIED = 'occupied', // Đã có lịch hẹn/bận
}

export class TimeSlotDto {
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @IsEnum(AvailabilityStatus)
  status: AvailabilityStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateAvailabilityDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots: TimeSlotDto[];
}

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots?: TimeSlotDto[];
}

export class AvailabilityResponseDto {
  date: string;
  timeSlots: TimeSlotDto[];
  dermatologistId: string;
  createdAt: Date;
  updatedAt: Date;
}
