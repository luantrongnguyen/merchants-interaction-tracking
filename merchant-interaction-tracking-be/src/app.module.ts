import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MerchantModule } from './merchant/merchant.module';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';
import { AuthModule } from './auth/auth.module';
import { ImsProxyModule } from './ims-proxy/ims-proxy.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler/scheduler.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GoogleSheetsModule,
    ScheduleModule.forRoot(),
    AuthModule,
    MerchantModule,
    ImsProxyModule,
  ],
  controllers: [AppController],
  providers: [AppService, SchedulerService],
})
export class AppModule {}
