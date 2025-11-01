import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateMerchantDto } from './create-merchant.dto';

export class UpdateMerchantDto extends PartialType(CreateMerchantDto) {
  @IsOptional()
  @IsString()
  updatedBy?: string; // Cho phép override updatedBy (ví dụ: "system" hoặc "updated by system")
}
