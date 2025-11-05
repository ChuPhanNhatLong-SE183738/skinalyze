import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { AppointmentType } from '../types/appointment.types';

export class CreateAppointmentDto {
  @IsUUID()
  dermatologistId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsEnum(AppointmentType)
  appointmentType: AppointmentType;

  /**
   * Bắt buộc phải có nếu 'appointmentType' là 'NEW_PROBLEM'.
   * Đây là ID của 'Skin_Analysis' (lần quét da) mà buổi hẹn này sẽ khám.
   */
  @ValidateIf(
    (object: CreateAppointmentDto) =>
      object.appointmentType === AppointmentType.NEW_PROBLEM,
  )
  @IsUUID()
  analysisId: string;

  /**
   * Bắt buộc phải có nếu 'appointmentType' là 'FOLLOW_UP'.
   * Đây là ID của 'Treatment_Routine' mà buổi hẹn này sẽ theo dõi.
   */
  @ValidateIf(
    (object: CreateAppointmentDto) =>
      object.appointmentType === AppointmentType.FOLLOW_UP,
  )
  @IsUUID()
  trackingRoutineId: string;

  @IsOptional()
  @IsString()
  note?: string;
}
