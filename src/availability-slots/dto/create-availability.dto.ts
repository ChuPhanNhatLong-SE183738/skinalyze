import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SlotBlockDto {
  @ApiProperty({
    example: '2025-11-03T09:00:00.000Z',
    description: 'ISO 8601 start time of the availability block',
  })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty({
    example: '2025-11-03T12:00:00.000Z',
    description: 'ISO 8601 end time of the availability block',
  })
  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @ApiProperty({
    example: 30,
    description: 'Duration for each slot generated within the block (minutes)',
    minimum: 5,
  })
  @IsNumber()
  @Min(5)
  slotDurationInMinutes: number;
}

export class CreateAvailabilityDto {
  @ApiProperty({
    type: [SlotBlockDto],
    description: 'Collection of availability blocks to generate slots from',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotBlockDto)
  blocks: SlotBlockDto[];
}
