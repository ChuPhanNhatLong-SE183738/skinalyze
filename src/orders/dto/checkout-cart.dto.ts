import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export enum PaymentMethod {
  WALLET = 'wallet', // Thanh toán bằng balance
  COD = 'cod', // Cash on delivery
  BANK_TRANSFER = 'bank_transfer',
  MOMO = 'momo',
  ZALOPAY = 'zalopay',
  VNPAY = 'vnpay',
}

export class CheckoutCartDto {
  @ApiProperty({ example: '123 Nguyen Hue, District 1, HCMC' })
  @IsString()
  shippingAddress: string;

  @ApiProperty({
    example: 'wallet',
    enum: PaymentMethod,
    description:
      'Payment method: wallet (từ balance), cod, bank_transfer, momo, zalopay, vnpay',
    default: PaymentMethod.COD,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    example: false,
    description: 'If true, use wallet balance to pay for this order',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  useWallet?: boolean;

  @ApiProperty({ example: 'Please call before delivery', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
