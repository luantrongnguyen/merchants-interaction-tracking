import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MerchantModule } from './merchant/merchant.module';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';
import { AuthModule } from './auth/auth.module';
import { ImsProxyModule } from './ims-proxy/ims-proxy.module';
import { AIModule } from './ai/ai.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler/scheduler.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Explicitly specify .env file path
      expandVariables: true, // Enable variable expansion
    }),
    GoogleSheetsModule,
    ScheduleModule.forRoot(),
    AuthModule,
    MerchantModule,
    ImsProxyModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService, SchedulerService],
})
export class AppModule {}
