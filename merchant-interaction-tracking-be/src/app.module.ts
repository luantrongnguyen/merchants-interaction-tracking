import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MerchantModule } from './merchant/merchant.module';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GoogleSheetsModule,
    AuthModule,
    MerchantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
