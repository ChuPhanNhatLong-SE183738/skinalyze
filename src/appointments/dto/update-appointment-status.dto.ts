import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../types/appointment.types';

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
