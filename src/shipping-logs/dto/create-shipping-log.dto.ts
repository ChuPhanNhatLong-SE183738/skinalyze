import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsString, IsOptional } from 'class-validator';
import { ShippingStatus } from '../entities/shipping-log.entity';

export class CreateShippingLogDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ enum: ShippingStatus, default: ShippingStatus.PENDING })
  @IsEnum(ShippingStatus)
  status: ShippingStatus;

  @ApiProperty({ example: 'Distribution Center - District 1', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'Package picked up by courier', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
