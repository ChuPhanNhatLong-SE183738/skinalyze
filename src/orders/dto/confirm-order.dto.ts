import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmOrderDto {
  @ApiProperty({
    description: 'ID of staff/admin who is processing the order',
    example: 'staff-uuid-123',
  })
  @IsString()
  processedBy: string;

  @ApiProperty({
    description: 'Optional note when confirming order',
    example: 'Đã kiểm tra hàng, sẵn sàng giao',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}
