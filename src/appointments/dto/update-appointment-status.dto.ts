import { IsEnum, IsString } from 'class-validator';
import {
  AppointmentStatus,
  TerminationReason,
} from '../types/appointment.types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}

export class InterruptAppointmentDto {
  @IsEnum(TerminationReason)
  @ApiProperty({
    description:
      'Lý do gián đoạn (CUSTOMER_ISSUE, DOCTOR_ISSUE, PLATFORM_ISSUE)',
    enum: [
      TerminationReason.CUSTOMER_ISSUE,
      TerminationReason.DOCTOR_ISSUE,
      TerminationReason.PLATFORM_ISSUE,
    ],
  })
  reason: TerminationReason;

  @IsString()
  @ApiProperty({
    description: 'Mô tả chi tiết lý do (ví dụ: "Khách rớt mạng 3 lần")',
    required: false,
  })
  terminationNote: string;
}
