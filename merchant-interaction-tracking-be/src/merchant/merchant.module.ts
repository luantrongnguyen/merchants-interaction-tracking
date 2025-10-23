import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';

@Module({
  imports: [GoogleSheetsModule],
  controllers: [MerchantController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
