import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({ description: 'Shop ID where inventory is located' })
  @IsNotEmpty()
  @IsUUID()
  shopId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Batch ID (optional)', required: false })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiProperty({ description: 'Current stock quantity' })
  @IsNotEmpty()
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
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiProperty({ description: 'New reserved stock quantity', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedStock?: number;
}

export class ReserveStockDto {
  @ApiProperty({ description: 'Quantity to reserve' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class TransferInventoryDto {
  @ApiProperty({ description: 'Source shop ID' })
  @IsNotEmpty()
  @IsUUID()
  fromShopId: string;

  @ApiProperty({ description: 'Destination shop ID' })
  @IsNotEmpty()
  @IsUUID()
  toShopId: string;

  @ApiProperty({ description: 'Product ID to transfer' })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Batch ID (optional)', required: false })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiProperty({ description: 'Quantity to transfer' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  quantity: number;
}
