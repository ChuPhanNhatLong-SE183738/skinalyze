import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType } from '../entities/stock-movement.entity';

export class StockMovementItemDto {
  @ApiProperty({ example: 'product-uuid', description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'batch-uuid', description: 'Batch ID' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({ example: 100, description: 'Quantity to move' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateStockMovementDto {
  @ApiProperty({ enum: MovementType, example: MovementType.IMPORT })
  @IsEnum(MovementType)
  movementType: MovementType;

  @ApiProperty({
    example: 'SHOP001',
    description:
      'Source shop ID (required for TRANSFER/EXPORT, null for IMPORT)',
    required: false,
  })
  @IsOptional()
  @IsString()
  fromShopId?: string;

  @ApiProperty({
    example: 'SHOP002',
    description:
      'Destination shop ID (required for IMPORT/TRANSFER, null for EXPORT)',
    required: false,
  })
  @IsOptional()
  @IsString()
  toShopId?: string;

  @ApiProperty({
    example: '123 Nguyen Hue, Quan 1, Ho Chi Minh',
    description: 'Shop address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: 'Restocking main store',
    description: 'Reason for movement',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    type: [StockMovementItemDto],
    description: 'List of products and batches to move',
    example: [
      { productId: 'prod-1', batchId: 'batch-1', quantity: 50 },
      { productId: 'prod-2', batchId: 'batch-2', quantity: 30 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockMovementItemDto)
  items: StockMovementItemDto[];
}

export class BulkStockMovementDto {
  @ApiProperty({ type: [CreateStockMovementDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStockMovementDto)
  movements: CreateStockMovementDto[];
}
