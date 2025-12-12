import { IsBoolean, IsOptional, IsNumber, IsObject, Min } from 'class-validator';

export class UpdateMerchantStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class UpdateMerchantRateLimitDto {
  @IsNumber()
  @Min(1)
  rateLimit: number;
}

export class UpdateMerchantMetadataDto {
  @IsObject()
  metadata: Record<string, any>;
}
