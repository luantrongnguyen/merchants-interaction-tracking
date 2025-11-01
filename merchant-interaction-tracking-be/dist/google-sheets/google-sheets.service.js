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
    getMockMerchants() {
        return [
            {
                id: 1,
                name: 'Test Merchant 1',
                address: '123 Test Street',
                street: '123 Test Street',
                area: 'Test Area',
                state: 'Test State',
                zipcode: '12345',
                lastInteractionDate: '2025-01-15',
                platform: 'Crisp',
                phone: '1234567890',
            },
            {
                id: 2,
                name: 'Test Merchant 2',
                address: '456 Sample Ave',
                street: '456 Sample Ave',
                area: 'Sample Area',
                state: 'Sample State',
                zipcode: '54321',
                lastInteractionDate: '2025-01-20',
                platform: 'Vonage',
                phone: '0987654321',
            },
        ];
    }
    async getMerchants() {
        try {
            if (!this.sheets) {
                throw new Error('Google Sheets service not initialized');
            }
            const spreadsheetId = app_config_1.appConfig.spreadsheetId;
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Merchants!A:M',
            });
            const rows = response.data.values;
            if (!rows || rows.length <= 1) {
                return [];
            }
            const merchants = rows.slice(1).map((row, index) => {
                let historyLogs = [];
                if (row[12]) {
                    try {
                        historyLogs = JSON.parse(row[12]);
                    }
                    catch (e) {
                        this.logger.warn(`Invalid history_logs JSON at row ${index + 2}`);
                    }
                }
                return {
                    id: index + 1,
                    name: row[0] || '',
                    storeId: row[1] || '',
                    address: row[2] || '',
                    street: row[3] || '',
                    area: row[4] || '',
                    state: row[5] || '',
                    zipcode: row[6] || '',
                    lastInteractionDate: row[7] || '',
                    platform: row[8] || '',
                    phone: row[9] || '',
                    lastModifiedAt: row[10] || '',
                    lastModifiedBy: row[11] || '',
                    historyLogs,
                };
            });
            return merchants;
        }
        catch (error) {
            this.logger.error('Error fetching merchants from Google Sheets:', error);
            throw error;
        }
    }
    async addMerchant(merchant, meta) {
        try {
            if (!this.sheets) {
                throw new Error('Google Sheets service not initialized');
            }
            const spreadsheetId = app_config_1.appConfig.spreadsheetId;
            const values = [
                [
                    merchant.name,
                    merchant.storeId || '',
                    merchant.address,
                    merchant.street,
                    merchant.area,
                    merchant.state,
                    merchant.zipcode,
                    merchant.lastInteractionDate,
                    merchant.platform,
                    merchant.phone,
                    meta.at ?? new Date().toISOString().slice(0, 10),
                    meta.by,
                    JSON.stringify([]),
                ],
            ];
            await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Merchants!A:M',
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
    async updateMerchant(id, merchant, meta) {
        try {
            if (!this.sheets) {
                throw new Error('Google Sheets service not initialized');
            }
            const spreadsheetId = app_config_1.appConfig.spreadsheetId;
            const rowIndex = id + 1;
            this.logger.log(`[GoogleSheets] Updating merchant id=${id}, rowIndex=${rowIndex}, lastInteractionDate=${merchant.lastInteractionDate}, updatedBy=${meta.by}`);
            const current = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `Merchants!A${rowIndex}:M${rowIndex}`,
            });
            const row = current.data.values?.[0] || [];
            if (!row || row.length === 0) {
                this.logger.error(`[GoogleSheets] Row ${rowIndex} not found or empty`);
                throw new Error(`Row ${rowIndex} not found in Google Sheets`);
            }
            this.logger.log(`[GoogleSheets] Current row data: name=${row[0]}, currentLastInteractionDate=${row[7]}`);
            const previous = {
                name: row[0] || '',
                storeId: row[1] || '',
                address: row[2] || '',
                street: row[3] || '',
                area: row[4] || '',
                state: row[5] || '',
                zipcode: row[6] || '',
                lastInteractionDate: row[7] || '',
                platform: row[8] || '',
                phone: row[9] || '',
                lastModifiedAt: row[10] || '',
                lastModifiedBy: row[11] || '',
            };
            let historyLogs = [];
            if (row[12]) {
                try {
                    historyLogs = JSON.parse(row[12]);
                    this.logger.log(`[GoogleSheets] Existing history logs: ${historyLogs.length} entries`);
                }
                catch (e) {
                    this.logger.warn(`[GoogleSheets] Failed to parse history logs:`, e);
                }
            }
            historyLogs.push({
                at: previous.lastModifiedAt || new Date().toISOString(),
                by: previous.lastModifiedBy || meta.by,
                data: previous
            });
            this.logger.log(`[GoogleSheets] Adding history log. Total logs: ${historyLogs.length}`);
            const values = [
                [
                    merchant.name,
                    merchant.storeId || '',
                    merchant.address,
                    merchant.street,
                    merchant.area,
                    merchant.state,
                    merchant.zipcode,
                    merchant.lastInteractionDate,
                    merchant.platform,
                    merchant.phone,
                    meta.at ?? new Date().toISOString().slice(0, 10),
                    meta.by,
                    JSON.stringify(historyLogs),
                ],
            ];
            this.logger.log(`[GoogleSheets] Updating row ${rowIndex} with values:`, {
                name: values[0][0],
                storeId: values[0][1],
                lastInteractionDate: values[0][7],
                lastModifiedAt: values[0][10],
                lastModifiedBy: values[0][11],
            });
            const updateResult = await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Merchants!A${rowIndex}:M${rowIndex}`,
                valueInputOption: 'RAW',
                resource: { values },
            });
            this.logger.log(`[GoogleSheets] Update successful! Updated cells:`, updateResult.data.updatedCells);
            this.logger.log(`Merchant ${id} updated in Google Sheets - lastInteractionDate: ${merchant.lastInteractionDate}`);
        }
        catch (error) {
            this.logger.error(`[GoogleSheets] Error updating merchant ${id}:`, error);
            throw error;
        }
    }
    async deleteMerchant(id) {
        try {
            if (!this.sheets) {
                throw new Error('Google Sheets service not initialized');
            }
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
    async getAuthorizedEmails() {
        try {
            const spreadsheetId = app_config_1.appConfig.spreadsheetId;
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'AuthorizedEmails!A:A',
            });
            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                this.logger.warn('No authorized emails found in Google Sheets');
                return [];
            }
            const emails = rows
                .map((row) => row[0]?.toString().toLowerCase().trim())
                .filter((email) => email && email.includes('@'));
            this.logger.log(`Found ${emails.length} authorized emails`);
            return emails;
        }
        catch (error) {
            this.logger.error('Error fetching authorized emails from Google Sheets:', error);
            return [];
        }
    }
};
exports.GoogleSheetsService = GoogleSheetsService;
exports.GoogleSheetsService = GoogleSheetsService = GoogleSheetsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GoogleSheetsService);
//# sourceMappingURL=google-sheets.service.js.map