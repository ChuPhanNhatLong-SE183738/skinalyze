import { IsNumber, IsEnum, IsOptional, Min, IsString } from 'class-validator';
import { PaymentMethod, PaymentType } from '../entities/payment.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ 
    description: 'Order ID (required for order payment)',
    example: 'uuid-string',
    required: false 
  })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ 
    description: 'User ID (required for topup)',
    example: 'uuid-string',
    required: false 
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ 
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.ORDER 
  })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ 
    description: 'Amount to pay (VND)',
    example: 500000,
    minimum: 1000 
  })
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiProperty({ 
    description: 'Payment method',
    enum: PaymentMethod,
    default: PaymentMethod.BANKING 
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod = PaymentMethod.BANKING;
}
