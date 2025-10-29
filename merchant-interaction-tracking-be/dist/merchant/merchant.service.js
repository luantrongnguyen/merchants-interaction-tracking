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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantService = void 0;
const common_1 = require("@nestjs/common");
const google_sheets_service_1 = require("../google-sheets/google-sheets.service");
let MerchantService = class MerchantService {
    googleSheetsService;
    constructor(googleSheetsService) {
        this.googleSheetsService = googleSheetsService;
    }
    async create(createMerchantDto, userEmail) {
        await this.googleSheetsService.addMerchant(createMerchantDto, { by: userEmail });
        return createMerchantDto;
    }
    async findAll() {
        return await this.googleSheetsService.getMerchants();
    }
    async findOne(id) {
        const merchants = await this.googleSheetsService.getMerchants();
        return merchants.find(merchant => merchant.id === id);
    }
    async update(id, updateMerchantDto, userEmail) {
        await this.googleSheetsService.updateMerchant(id, updateMerchantDto, { by: userEmail });
        return updateMerchantDto;
    }
    async remove(id) {
        await this.googleSheetsService.deleteMerchant(id);
    }
};
exports.MerchantService = MerchantService;
exports.MerchantService = MerchantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [google_sheets_service_1.GoogleSheetsService])
], MerchantService);
//# sourceMappingURL=merchant.service.js.map