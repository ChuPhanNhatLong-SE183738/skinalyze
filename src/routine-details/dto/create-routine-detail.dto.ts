import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsUUID } from 'class-validator';

export class CreateRoutineDetailDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  routineId: string;

  @ApiProperty({ example: 'Giai đoạn 1: Làm sạch và cân bằng da' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example:
      'Sử dụng sữa rửa mặt nhẹ nhàng 2 lần/ngày, sau đó thoa kem dưỡng ẩm. Tránh xa các sản phẩm chứa cồn.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    description: 'Array of product UUIDs',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  productIds: string[];
}
