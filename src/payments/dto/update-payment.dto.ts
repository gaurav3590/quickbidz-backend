import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsObject()
  @IsOptional()
  gatewayResponse?: Record<string, any>;

  @IsString()
  @IsOptional()
  notes?: string;
}
