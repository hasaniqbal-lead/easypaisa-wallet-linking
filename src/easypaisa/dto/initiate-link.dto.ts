import { IsString, IsNotEmpty, IsNumber, IsOptional, Matches, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiateLinkDto {
  @ApiProperty({ example: '03001234567', description: 'Easypaisa mobile number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^03\d{9}$/, { message: 'Mobile number must be in format 03XXXXXXXXX' })
  mobileAccountNo: string;

  @ApiProperty({ example: '123456', description: 'OTP received by user' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 1.0, description: 'Transaction amount' })
  @IsNumber()
  @Min(1)
  transactionAmount: number;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email address (optional)' })
  @IsString()
  @IsOptional()
  emailAddress?: string;
}

export class InitiateLinkRequest {
  username: string;
  password: string;
  storeId: string;
  orderId: string;
  transactionAmount: string;
  transactionType: string;
  mobileAccountNo: string;
  emailAddress?: string;
  otp: string;
}

export interface InitiateLinkResponse {
  responseCode: string;
  responseMessage: string;
  orderId?: string;
  tokenNumber?: string;
  transactionId?: string;
}
