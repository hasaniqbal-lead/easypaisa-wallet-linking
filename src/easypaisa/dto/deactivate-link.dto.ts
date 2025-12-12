import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeactivateLinkDto {
  @ApiProperty({ example: '03001234567', description: 'Easypaisa mobile number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^03\d{9}$/, { message: 'Mobile number must be in format 03XXXXXXXXX' })
  mobileAccountNo: string;

  @ApiProperty({ example: 'TOKEN123', description: 'Token to deactivate' })
  @IsString()
  @IsNotEmpty()
  tokenNumber: string;
}

export class DeactivateLinkRequest {
  username: string;
  password: string;
  storeId: string;
  orderId: string;
  mobileAccountNo: string;
  tokenNumber: string;
}

export interface DeactivateLinkResponse {
  responseCode: string;
  responseMessage: string;
  orderId?: string;
}
