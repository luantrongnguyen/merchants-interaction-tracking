"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const google_sheets_service_1 = require("../google-sheets/google-sheets.service");
let SchedulerService = SchedulerService_1 = class SchedulerService {
    sheetsService;
    logger = new common_1.Logger(SchedulerService_1.name);
    constructor(sheetsService) {
        this.sheetsService = sheetsService;
    }
    async autoSyncCallLogs() {
        try {
            const nowUtc = new Date();
            const vnNow = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
            const hourVN = vnNow.getUTCHours();
            const isWithinWindow = hourVN >= 20 || hourVN < 11;
            if (!isWithinWindow) {
                this.logger.log(`[AutoSync] Bỏ qua (ngoài khung giờ VN): ${hourVN}:xx`);
                return;
            }
            this.logger.log(`[AutoSync] Bắt đầu auto sync call logs (VN ${hourVN}:xx)`);
            const result = await this.sheetsService.syncCallLogsToMerchants('system@mangoforsalon.com');
            this.logger.log(`[AutoSync] Hoàn tất: matched=${result.matched}, updated=${result.updated}, errors=${result.errors}, totalCallLogsAdded=${result.totalCallLogsAdded}`);
        }
        catch (error) {
            this.logger.error('[AutoSync] Lỗi khi auto sync call logs', error);
        }
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)('0 */30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "autoSyncCallLogs", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [google_sheets_service_1.GoogleSheetsService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map