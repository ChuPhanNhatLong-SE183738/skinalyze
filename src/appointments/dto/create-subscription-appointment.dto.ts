import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
  ValidateIf,
  IsNotEmpty, // 👈 Thêm
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType } from '../types/appointment.types';

export class CreateSubscriptionAppointmentDto {
  @IsUUID()
  dermatologistId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsEnum(AppointmentType)
  appointmentType: AppointmentType;

  @ValidateIf(
    (object: CreateSubscriptionAppointmentDto) =>
      object.appointmentType === AppointmentType.NEW_PROBLEM,
  )
  @IsUUID()
  analysisId: string;

  @ValidateIf(
    (object: CreateSubscriptionAppointmentDto) =>
      object.appointmentType === AppointmentType.FOLLOW_UP,
  )
  @IsUUID()
  trackingRoutineId: string;

  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ description: 'CustomerSubscription ID to use' })
  @IsUUID()
  @IsNotEmpty()
  customerSubscriptionId: string;
}
