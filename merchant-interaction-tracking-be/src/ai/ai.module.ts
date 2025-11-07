import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';
import { MerchantModule } from '../merchant/merchant.module';

@Module({
  imports: [
    ConfigModule, // Ensure ConfigModule is imported
    GoogleSheetsModule, 
    MerchantModule
  ],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}

