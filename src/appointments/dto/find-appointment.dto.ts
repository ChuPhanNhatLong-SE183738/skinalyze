import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../types/appointment.types';

export class FindAppointmentsDto {
  @ApiPropertyOptional({
    description: 'Filter appointments by customer ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter appointments by dermatologist ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dermatologistId?: string;

  @ApiPropertyOptional({
    description: 'Filter appointments by status',
    enum: AppointmentStatus,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
