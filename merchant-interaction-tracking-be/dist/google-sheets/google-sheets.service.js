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
var GoogleSheetsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const app_config_1 = require("../config/app.config");
let GoogleSheetsService = GoogleSheetsService_1 = class GoogleSheetsService {
    logger = new common_1.Logger(GoogleSheetsService_1.name);
    sheets;
    auth;
    constructor() {
        this.initializeAuth();
    }
    async initializeAuth() {
        try {
            this.auth = new googleapis_1.google.auth.GoogleAuth({
                keyFile: app_config_1.appConfig.googleCredentialsPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            this.sheets = googleapis_1.google.sheets({ version: 'v4', auth: this.auth });
            this.logger.log('Google Sheets authentication initialized');
        }
        catch (error) {
            this.logger.error('Error initializing Google Sheets auth:', error);
        }
    }
    async getMerchants() {
        try {
            const spreadsheetId = app_config_1.appConfig.spreadsheetId;
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Merchants!A:I',
            });
            const rows = response.data.values;
            if (!rows || rows.length <= 1) {
                return [];
            }
            const merchants = rows.slice(1).map((row, index) => ({
                id: index + 1,
                name: row[0] || '',
                address: row[1] || '',
                street: row[2] || '',
                area: row[3] || '',
                state: row[4] || '',
                zipcode: row[5] || '',
                lastInteractionDate: row[6] || '',
                platform: row[7] || '',
                phone: row[8] || '',
            }));
            return merchants;
        }
        catch (error) {
            this.logger.error('Error fetching merchants from Google Sheets:', error);
            throw error;
        }
    }
    async addMerchant(merchant) {
        try {
            const spreadsheetId = app_config_1.appConfig.spreadsheetId;
            const values = [
                [
                    merchant.name,
                    merchant.address,
                    merchant.street,
                    merchant.area,
                    merchant.state,
                    merchant.zipcode,
                    merchant.lastInteractionDate,
                    merchant.platform,
                    merchant.phone,
                ],
            ];
            await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Merchants!A:I',
                valueInputOption: 'RAW',
                resource: { values },
            });
            this.logger.log('Merchant added to Google Sheets');
        }
        catch (error) {
            this.logger.error('Error adding merchant to Google Sheets:', error);
            throw error;
        }
    }
    async updateMerchant(id, merchant) {
        try {
            const spreadsheetId = app_config_1.appConfig.spreadsheetId;
            const values = [
                [
                    merchant.name,
                    merchant.address,
                    merchant.street,
                    merchant.area,
                    merchant.state,
                    merchant.zipcode,
                    merchant.lastInteractionDate,
                    merchant.platform,
                    merchant.phone,
                ],
            ];
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Merchants!A${id + 1}:I${id + 1}`,
                valueInputOption: 'RAW',
                resource: { values },
            });
            this.logger.log(`Merchant ${id} updated in Google Sheets`);
        }
        catch (error) {
            this.logger.error('Error updating merchant in Google Sheets:', error);
            throw error;
        }
    }
    async deleteMerchant(id) {
        try {
            const spreadsheetId = app_config_1.appConfig.spreadsheetId;
            const rowIndex = id + 1;
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [
                        {
                            deleteDimension: {
                                range: {
                                    sheetId: 0,
                                    dimension: 'ROWS',
                                    startIndex: rowIndex - 1,
                                    endIndex: rowIndex,
                                },
                            },
                        },
                    ],
                },
            });
            this.logger.log(`Merchant ${id} deleted from Google Sheets`);
        }
        catch (error) {
            this.logger.error('Error deleting merchant from Google Sheets:', error);
            throw error;
        }
    }
};
exports.GoogleSheetsService = GoogleSheetsService;
exports.GoogleSheetsService = GoogleSheetsService = GoogleSheetsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GoogleSheetsService);
//# sourceMappingURL=google-sheets.service.js.map