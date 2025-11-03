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
    async syncMerchantsFromExternal(userEmail) {
        const API_URL = 'https://imsnext-portal.enrichco.us/api/Customer/ListMerchants';
        const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiSmFtZXMgRGllcCIsIklkIjoiMDAxNTU2IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoidXNlciIsIkF2YXRhciI6IiIsIkdNVCI6Ii01IiwiUGVybWlzc2lvbiI6WyJhY2Nlc3NfcmVhZCIsImFjY2Vzc19yZWFkIiwiaW52b2ljZV9mdWxsIiwiaW52b2ljZV9yZWFkIiwiaW52b2ljZV9yZWFkIiwiaW52b2ljZV9yZWFkb3RoZXJzIiwiaW52b2ljZV91cGRhdGUiLCJpbnZvaWNlX3VwZGF0ZW90aGVycyIsIm1lcmNoYW50X2Z1bGwiLCJtZXJjaGFudF9yZWFkIiwibWVyY2hhbnRfcmVhZCIsIm1lcmNoYW50X3VwZGF0ZSIsIm1lcmNoYW50X3VwZGF0ZW90aGVycyIsInBhcnRuZXJfcmVhZCIsInBhcnRuZXJfcmVhZCIsInBhcnRuZXJfdXBkYXRlIiwicmVjdXJyaW5ndHJhbnNfcmVhZCIsInJlY3VycmluZ3RyYW5zX3JlYWQiLCJzdWJzY3JpcHRpb25fcmVhZCIsInN1YnNjcmlwdGlvbl9yZWFkIiwic3Vic2NyaXB0aW9uX3VwZGF0ZSJdLCJleHAiOjE3NjczMjQ0OTgsImlzcyI6Imh0dHBzOi8vaW1zLWF1dGgiLCJhdWQiOiJpbXMtYXV0aCJ9.xNDSj3sBK2IiWgmXP3r93f9IJyvQLPKvNNA5IJex9Gc';
        try {
            const existingStoreIds = await this.googleSheetsService.getMerchantStoreIds();
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'accept': '*/*',
                    'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                    'authorization': `Bearer ${TOKEN}`,
                    'content-type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    partnerCode: null,
                    accountManager: null,
                    license: null,
                    tabType: 'All',
                    status: null,
                    search: null,
                    from: null,
                    to: null,
                    page: 1,
                    pageSize: 1000,
                    sortBy: 'CreateAt',
                    sortOrder: 'desc',
                }),
            });
            if (!response.ok) {
                throw new Error(`External API returned ${response.status}`);
            }
            const data = await response.json();
            if (!data.return || !data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid response from external API');
            }
            let added = 0;
            let skipped = 0;
            let errors = 0;
            for (const item of data.data) {
                const customerCode = item.customerCode || item.storeCode;
                if (!customerCode) {
                    errors++;
                    continue;
                }
                if (existingStoreIds.has(customerCode)) {
                    skipped++;
                    continue;
                }
                let state = '-';
                const nameParts = (item.businessName || '').split('_');
                if (nameParts.length >= 4) {
                    state = nameParts[nameParts.length - 1];
                }
                const merchantData = {
                    name: item.businessName || '-',
                    storeId: customerCode,
                    address: item.address || '-',
                    street: '-',
                    area: '-',
                    state: state,
                    zipcode: '-',
                    platform: '-',
                    phone: item.businessPhone || '-',
                };
                try {
                    await this.googleSheetsService.addMerchant(merchantData, { by: userEmail });
                    existingStoreIds.add(customerCode);
                    added++;
                }
                catch (error) {
                    errors++;
                }
            }
            return { added, skipped, errors };
        }
        catch (error) {
            throw new Error(`Sync failed: ${error.message}`);
        }
    }
    async syncCallLogs(userEmail) {
        return await this.googleSheetsService.syncCallLogsToMerchants(userEmail);
    }
};
exports.MerchantService = MerchantService;
exports.MerchantService = MerchantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [google_sheets_service_1.GoogleSheetsService])
], MerchantService);
//# sourceMappingURL=merchant.service.js.map