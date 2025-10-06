import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBatchItemDto {
  @ApiProperty({ example: 'product-uuid', description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 100, description: 'Quantity imported' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 25.5, description: 'Import price per unit' })
  @IsNumber()
  @Min(0)
  importPrice: number;

  @ApiProperty({ example: 'BATCH-001', description: 'Batch number' })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({ example: '2025-12-31', description: 'Expiry date' })
  @IsDateString()
  expiryDate: string;
}

export class CreateBatchDto {
  @ApiProperty({
    example: 'import',
    description: 'Batch action (import/export/adjustment)',
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    example: 'New stock arrival',
    description: 'Reason for batch operation',
  })
  @IsString()
  reason: string;

  @ApiProperty({ type: [CreateBatchItemDto], description: 'Batch items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBatchItemDto)
  batchItems: CreateBatchItemDto[];
}

export class ImportProductDto {
  @ApiProperty({ example: 'product-uuid', description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 100, description: 'Quantity to import' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 25.5, description: 'Import price per unit' })
  @IsNumber()
  @Min(0)
  importPrice: number;

  @ApiProperty({ example: 'BATCH-001', description: 'Batch number' })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({ example: '2025-12-31', description: 'Expiry date' })
  @IsDateString()
  expiryDate: string;
}

export class ExportProductDto {
  @ApiProperty({ example: 'product-uuid', description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 50, description: 'Quantity to export' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Damaged goods', description: 'Reason for export' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
