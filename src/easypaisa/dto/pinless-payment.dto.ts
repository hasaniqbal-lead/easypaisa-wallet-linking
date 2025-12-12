import { IsString, IsNotEmpty, IsNumber, IsOptional, Matches, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PinlessPaymentDto {
  @ApiProperty({ example: '03001234567', description: 'Easypaisa mobile number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^03\d{9}$/, { message: 'Mobile number must be in format 03XXXXXXXXX' })
  mobileAccountNo: string;

  @ApiProperty({ example: 'TOKEN123', description: 'Token from wallet link' })
  @IsString()
  @IsNotEmpty()
  tokenNumber: string;

  @ApiProperty({ example: 100.50, description: 'Transaction amount' })
  @IsNumber()
  @Min(1)
  transactionAmount: number;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email address (optional)' })
  @IsString()
  @IsOptional()
  emailAddress?: string;
}

export class PinlessPaymentRequest {
  username: string;
  password: string;
  storeId: string;
  orderId: string;
  transactionAmount: string;
  transactionType: string;
  mobileAccountNo: string;
  emailAddress?: string;
  tokenNumber: string;
}

export interface PinlessPaymentResponse {
  responseCode: string;
  responseMessage: string;
  orderId?: string;
  transactionId?: string;
  transactionDateTime?: string;
}
