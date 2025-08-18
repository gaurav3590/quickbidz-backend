import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  IsUUID,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @IsEnum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])
  @IsOptional()
  status?: string;

  @IsEnum(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CRYPTO'])
  @IsNotEmpty()
  paymentMethod: string;

  @IsUUID()
  @IsNotEmpty()
  auctionId: string;

  @IsUUID()
  @IsOptional()
  bidId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string; // Will be set from the authenticated user

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
