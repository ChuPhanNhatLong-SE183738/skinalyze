import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ShippingMethod } from '../entities/shipping-log.entity';

export class CreateBatchDeliveryDto {
  @ApiProperty({
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    description: 'Array of order IDs to combine in one delivery batch',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  orderIds: string[];

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  shippingStaffId: string;

  @ApiProperty({
    example: 'Giao 3 đơn cùng địa chỉ vào buổi chiều',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AssignGhnOrderDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'GHN12345678' })
  @IsString()
  ghnOrderCode: string;

  @ApiProperty({ example: '1444-C', required: false })
  @IsOptional()
  @IsString()
  ghnSortCode?: string;

  @ApiProperty({ example: 35000, required: false })
  @IsOptional()
  ghnShippingFee?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  ghnTrackingData?: any;
}

export class UpdateShippingMethodDto {
  @ApiProperty({
    enum: ShippingMethod,
    example: ShippingMethod.GHN,
  })
  @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;

  @ApiProperty({
    example: 'Khoảng cách quá xa, cần GHN hỗ trợ',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
