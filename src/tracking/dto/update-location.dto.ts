import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({
    description: 'Order ID đang được giao',
    example: 'uuid-order-123',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Latitude (vĩ độ)',
    example: 10.762622,
    minimum: -90,
    maximum: 90,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude (kinh độ)',
    example: 106.660172,
    minimum: -180,
    maximum: 180,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: 'Timestamp (optional, sẽ tự động tạo nếu không truyền)',
    example: '2025-11-04T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  timestamp?: string;
}
