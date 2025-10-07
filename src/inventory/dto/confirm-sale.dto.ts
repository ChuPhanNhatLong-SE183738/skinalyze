import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsInt, Min } from 'class-validator';

export class ConfirmSaleDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  shopId: string;

  @ApiProperty({
    example: '123 Nguyen Hue, Quan 1, Ho Chi Minh',
    description: 'Shop address',
  })
  @IsString()
  address: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'BATCH-2025-001' })
  @IsString()
  batchId: string;

  @ApiProperty({ example: 80, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
