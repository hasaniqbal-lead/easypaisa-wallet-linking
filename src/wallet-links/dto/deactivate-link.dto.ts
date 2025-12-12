import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class DeactivateLinkDto {
  @IsString()
  @IsNotEmpty()
  walletLinkId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
