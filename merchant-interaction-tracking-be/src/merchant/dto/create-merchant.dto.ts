import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateMerchantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsOptional()
  zipcode?: string;

  @IsDateString()
  @IsNotEmpty()
  lastInteractionDate: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
