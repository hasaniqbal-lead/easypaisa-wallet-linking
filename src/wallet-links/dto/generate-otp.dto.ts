import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class GenerateOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^03[0-9]{9}$/, { message: 'Mobile number must be in format 03XXXXXXXXX' })
  mobileNumber: string;
}
