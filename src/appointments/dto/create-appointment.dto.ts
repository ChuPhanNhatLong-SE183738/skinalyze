import {
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  dermatologistId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  transactionId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;
}
