import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MerchantModule } from './merchant/merchant.module';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';
import { AuthModule } from './auth/auth.module';
import { ImsProxyModule } from './ims-proxy/ims-proxy.module';
import { AIModule } from './ai/ai.module';
import { NotesModule } from './notes/notes.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler/scheduler.service';
import { Note } from './notes/note.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Explicitly specify .env file path
      expandVariables: true, // Enable variable expansion
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      // Lưu database ở thư mục data/ bên ngoài dist/ để không bị mất khi deploy
      // Path sẽ được resolve trong main.ts trước khi app khởi động
      database: process.env.DATABASE_PATH || './data/notes.db',
      entities: [Note],
      synchronize: process.env.NODE_ENV !== 'production', // Chỉ auto-sync trong development, tắt trong production để tránh mất data
    }),
    GoogleSheetsModule,
    ScheduleModule.forRoot(),
    AuthModule,
    MerchantModule,
    ImsProxyModule,
    AIModule,
    NotesModule,
  ],
  controllers: [AppController],
  providers: [AppService, SchedulerService],
})
export class AppModule {}
