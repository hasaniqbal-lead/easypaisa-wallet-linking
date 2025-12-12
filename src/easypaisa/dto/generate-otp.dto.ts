import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateOtpDto {
  @ApiProperty({ example: '03001234567', description: 'Easypaisa mobile number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^03\d{9}$/, { message: 'Mobile number must be in format 03XXXXXXXXX' })
  mobileAccountNo: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email address (optional)' })
  @IsString()
  @IsOptional()
  emailAddress?: string;
}

export class GenerateOtpRequest {
  username: string;
  password: string;
  storeId: string;
  orderId: string;
  mobileAccountNo: string;
  emailAddress?: string;
}

export interface GenerateOtpResponse {
  responseCode: string;
  responseMessage: string;
  orderId?: string;
  otpReference?: string;
}
