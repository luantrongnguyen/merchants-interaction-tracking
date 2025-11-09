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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantController = void 0;
const common_1 = require("@nestjs/common");
const merchant_service_1 = require("./merchant.service");
const create_merchant_dto_1 = require("./dto/create-merchant.dto");
const update_merchant_dto_1 = require("./dto/update-merchant.dto");
const update_support_note_dto_1 = require("./dto/update-support-note.dto");
const sync_call_logs_manual_dto_1 = require("./dto/sync-call-logs-manual.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const app_config_1 = require("../config/app.config");
let MerchantController = class MerchantController {
    merchantService;
    constructor(merchantService) {
        this.merchantService = merchantService;
    }
    create(createMerchantDto, req) {
        const email = req?.user?.email || 'unknown@mangoforsalon.com';
        return this.merchantService.create(createMerchantDto, email);
    }
    findAll() {
        return this.merchantService.findAll();
    }
    findOne(id) {
        return this.merchantService.findOne(id);
    }
    update(id, updateMerchantDto, req) {
        const { updatedBy, ...merchantData } = updateMerchantDto;
        const by = updatedBy || req?.user?.email || 'unknown@mangoforsalon.com';
        console.log(`[MerchantController] Update request:`, {
            id,
            updatedBy: by,
            data: merchantData,
            lastInteractionDate: merchantData.lastInteractionDate
        });
        return this.merchantService.update(id, merchantData, by);
    }
    async addSupportNote(id, updateSupportNoteDto, req) {
        try {
            const userEmail = req?.user?.email || 'unknown@mangoforsalon.com';
            const userName = req?.user?.name ||
                req?.user?.given_name ||
                req?.user?.givenName ||
                req?.user?.fullName ||
                req?.user?.displayName ||
                (userEmail.includes('@') ? userEmail.split('@')[0] : userEmail);
            const noteContent = updateSupportNoteDto.content;
            const createdBy = updateSupportNoteDto.createdBy || userName;
            const createdAt = updateSupportNoteDto.createdAt || new Date().toISOString();
            return await this.merchantService.addSupportNote(id, noteContent, createdBy, userEmail);
        }
        catch (error) {
            console.error('[MerchantController] Error adding support note:', error);
            throw new common_1.HttpException(error.message || 'Failed to add support note', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    remove(id) {
        return this.merchantService.remove(id);
    }
    async syncMerchants(req) {
        const email = req?.user?.email || 'unknown@mangoforsalon.com';
        return this.merchantService.syncMerchantsFromExternal(email);
    }
    async syncCallLogs(req) {
        const email = req?.user?.email || 'unknown@mangoforsalon.com';
        return this.merchantService.syncCallLogs(email);
    }
    async syncCallLogsManual(dto, req) {
        try {
            if (!dto || !dto.passcode) {
                throw new common_1.UnauthorizedException('Passcode is required');
            }
            if (dto.passcode !== app_config_1.appConfig.passcode) {
                throw new common_1.UnauthorizedException('Invalid passcode');
            }
            const email = req?.user?.email || 'unknown@mangoforsalon.com';
            console.log(`[MerchantController] Starting manual sync for user: ${email}`);
            const result = await this.merchantService.syncAllCallLogs(email);
            console.log(`[MerchantController] Manual sync completed:`, result);
            return result;
        }
        catch (error) {
            console.error('[MerchantController] Error in syncCallLogsManual:', error);
            console.error('[MerchantController] Error stack:', error?.stack);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            const errorMessage = error?.message || 'Internal server error';
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: errorMessage,
                error: 'Internal Server Error',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.MerchantController = MerchantController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_merchant_dto_1.CreateMerchantDto, Object]),
    __metadata("design:returntype", void 0)
], MerchantController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MerchantController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MerchantController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_merchant_dto_1.UpdateMerchantDto, Object]),
    __metadata("design:returntype", void 0)
], MerchantController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/support-note'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_support_note_dto_1.UpdateSupportNoteDto, Object]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "addSupportNote", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MerchantController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "syncMerchants", null);
__decorate([
    (0, common_1.Post)('sync-call-logs'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "syncCallLogs", null);
__decorate([
    (0, common_1.Post)('sync-call-logs-manual'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sync_call_logs_manual_dto_1.SyncCallLogsManualDto, Object]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "syncCallLogsManual", null);
exports.MerchantController = MerchantController = __decorate([
    (0, common_1.Controller)('merchants'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [merchant_service_1.MerchantService])
], MerchantController);
//# sourceMappingURL=merchant.controller.js.map