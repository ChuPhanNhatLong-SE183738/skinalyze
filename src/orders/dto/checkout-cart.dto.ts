import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CheckoutCartDto {
  @ApiProperty({ example: '123 Nguyen Hue, District 1, HCMC' })
  @IsString()
  shippingAddress: string;

  @ApiProperty({ example: 'Please call before delivery', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
