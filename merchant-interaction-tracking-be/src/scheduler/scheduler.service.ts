import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly sheetsService: GoogleSheetsService) {}

  // Chạy mỗi 5 phút
  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoSyncCallLogs() {
    try {
      // Tính giờ hiện tại theo múi giờ Việt Nam (UTC+7)
      const nowUtc = new Date();
      const vnNow = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
      const hourVN = vnNow.getUTCHours(); // sau offset, dùng getUTCHours như giờ địa phương VN

      // Chỉ chạy trong khung 20:00 -> 23:59 và 00:00 -> 10:59 (tức hour >= 20 hoặc hour < 11)
      const isWithinWindow = hourVN >= 20 || hourVN < 11;
      if (!isWithinWindow) {
        this.logger.log(`[AutoSync] Bỏ qua (ngoài khung giờ VN): ${hourVN}:xx`);
        return;
      }

      this.logger.log(`[AutoSync] Bắt đầu auto sync call logs (VN ${hourVN}:xx)`);
      const result = await this.sheetsService.syncCallLogsToMerchants('system@mangoforsalon.com');
      this.logger.log(
        `[AutoSync] Hoàn tất: matched=${result.matched}, updated=${result.updated}, errors=${result.errors}, totalCallLogsAdded=${result.totalCallLogsAdded}`,
      );
    } catch (error) {
      this.logger.error('[AutoSync] Lỗi khi auto sync call logs', error);
    }
  }
}


