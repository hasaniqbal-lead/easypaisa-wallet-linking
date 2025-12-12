import { IsString, IsNotEmpty, Length, IsNumber, Min, IsOptional } from 'class-validator';

export class InitiateLinkDto {
  @IsString()
  @IsNotEmpty()
  walletLinkId: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'OTP must be between 4 and 6 characters' })
  otp: string;

  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1 PKR' })
  amount: number;

  @IsString()
  @IsOptional()
  merchantOrderId?: string;
}
