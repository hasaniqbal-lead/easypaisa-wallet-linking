import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateMerchantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
