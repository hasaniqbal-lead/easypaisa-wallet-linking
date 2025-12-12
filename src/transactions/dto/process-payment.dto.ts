import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty()
  walletLinkId: string;

  @IsString()
  @IsNotEmpty()
  merchantOrderId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}
