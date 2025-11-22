import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { CreateMerchantDto } from './create-merchant.dto';

export class UpdateMerchantDto extends PartialType(CreateMerchantDto) {
  @IsOptional()
  @IsString()
  updatedBy?: string; // Cho phép override updatedBy (ví dụ: "system" hoặc "updated by system")

  @IsOptional()
  @IsBoolean()
  isMiUpdated?: boolean; // is_mi_updated flag

  @IsOptional()
  @IsString()
  miVersion?: string; // MI version (JSON string: "11042025", "11112025", "11212025")
}
