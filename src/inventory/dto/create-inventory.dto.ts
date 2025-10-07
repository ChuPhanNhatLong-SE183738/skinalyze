import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
  IsString,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReserveStockDto {
  @ApiProperty({ example: 'SHOP001', description: 'Shop ID' })
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({
    example: '123 Nguyen Hue, Quan 1, Ho Chi Minh',
    description: 'Shop address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'prod-001', description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 50, description: 'Quantity to reserve' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    example: true,
    required: false,
    default: true,
    description: 'Use FIFO strategy (default: true)',
  })
  @IsBoolean()
  @IsOptional()
  useFIFO?: boolean;
}

export class ReleaseReservationDto {
  @ApiProperty({ example: 'SHOP001' })
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({
    example: '123 Nguyen Hue, Quan 1, Ho Chi Minh',
    description: 'Shop address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'prod-001' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'batch-001' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class ConfirmSaleDto {
  @ApiProperty({ example: 'SHOP001' })
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({
    example: '123 Nguyen Hue, Quan 1, Ho Chi Minh',
    description: 'Shop address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'prod-001' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'batch-001' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class SaleItemDto {
  @ApiProperty({ example: 'prod-001' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: '123 Nguyen Hue, Quan 1, Ho Chi Minh',
    description: 'Shop address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'batch-001' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class ConfirmMultipleSalesDto {
  @ApiProperty({ example: 'SHOP001' })
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({
    example: '123 Nguyen Hue, Quan 1, Ho Chi Minh',
    description: 'Shop address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  sales: SaleItemDto[];
}

export class AdjustStockDto {
  @ApiProperty({ example: 'SHOP001' })
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({
    example: '123 Nguyen Hue, Quan 1, Ho Chi Minh',
    description: 'Shop address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'prod-001' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'batch-001' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({
    example: -5,
    description: 'Positive to add, negative to subtract',
  })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'Damaged goods adjustment' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class TransferInventoryDto {
  @ApiProperty({ description: 'Source shop ID' })
  @IsString()
  @IsNotEmpty()
  fromShopId: string;

  @ApiProperty({ description: 'Destination shop ID' })
  @IsString()
  @IsNotEmpty()
  toShopId: string;

  @ApiProperty({ description: 'Product ID to transfer' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Batch ID (optional)', required: false })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty({ description: 'Quantity to transfer' })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CreateInventoryDto {
  @ApiProperty({ description: 'Shop ID' })
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({
    example: '123 Nguyen Hue, Quan 1, Ho Chi Minh',
    description: 'Shop address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Batch ID', required: false })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty({ description: 'Current stock quantity' })
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiProperty({ description: 'Reserved stock quantity', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedStock?: number;
}

export class UpdateInventoryStockDto {
  @ApiProperty({ description: 'New current stock quantity' })
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiProperty({ description: 'New reserved stock quantity', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedStock?: number;
}
