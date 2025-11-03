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
  @IsOptional()
  lastInteractionDate?: string; // Optional - will be computed from call logs if not provided

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
