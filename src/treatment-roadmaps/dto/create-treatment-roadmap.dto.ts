import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTreatmentRoadmapDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  dermatologistId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;
}
