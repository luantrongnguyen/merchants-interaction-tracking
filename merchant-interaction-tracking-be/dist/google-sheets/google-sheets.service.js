"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GoogleSheetsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const app_config_1 = require("../config/app.config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let GoogleSheetsService = GoogleSheetsService_1 = class GoogleSheetsService {
    logger = new common_1.Logger(GoogleSheetsService_1.name);
    sheets;
    auth;
    logFilePath;
    operationLock = Promise.resolve();
    constructor() {
        this.initializeAuth();
        this.initializeLogFile();
    }
    initializeLogFile() {
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
            new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
        this.logFilePath = path.join(logsDir, `call-logs-sync-${timestamp}.txt`);
        fs.appendFileSync(this.logFilePath, `=== Call Logs Sync Log - Started at ${new Date().toISOString()} ===\n\n`);
    }
    writeToLogFile(message) {
        try {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${message}\n`;
            fs.appendFileSync(this.logFilePath, logMessage);
        }
        catch (error) {
            this.logger.error('Error writing to log file:', error);
        }
    }
    logSync(message) {
        this.logger.log(message);
        this.writeToLogFile(message);
    }
    warnSync(message) {
        this.logger.warn(message);
        this.writeToLogFile(`[WARN] ${message}`);
    }
    errorSync(message, error) {
        this.logger.error(message, error);
        this.writeToLogFile(`[ERROR] ${message}${error ? ': ' + JSON.stringify(error, null, 2) : ''}`);
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
    async withLock(operation, operationName) {
        const currentLock = this.operationLock;
        let releaseLock;
        const newLock = new Promise((resolve) => {
            releaseLock = resolve;
        });
        this.operationLock = currentLock.then(async () => {
            this.logger.debug(`[Lock] Acquired lock for: ${operationName}`);
            try {
                await newLock;
            }
            finally {
                this.logger.debug(`[Lock] Released lock for: ${operationName}`);
            }
        });
        try {
            await currentLock;
            return await operation();
        }
        finally {
            releaseLock();
        }
    }
    async getMerchants() {
        return this.withLock(async () => {
            try {
                if (!this.sheets) {
                    throw new Error('Google Sheets service not initialized');
                }
                const spreadsheetId = app_config_1.appConfig.spreadsheetId;
                let lastError;
                const maxRetries = 3;
                for (let attempt = 0; attempt < maxRetries; attempt++) {
                    try {
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
                            if (row[11]) {
                                try {
                                    historyLogs = JSON.parse(row[11]);
                                }
                                catch (e) {
                                    this.logger.warn(`Invalid history_logs JSON at row ${index + 2}`);
                                }
                            }
                            let supportLogs = [];
                            if (row[12]) {
                                try {
                                    supportLogs = JSON.parse(row[12]);
                                }
                                catch (e) {
                                    this.logger.warn(`Invalid support_logs JSON at row ${index + 2}`);
                                }
                            }
                            let lastInteractionDate = '';
                            if (supportLogs && supportLogs.length > 0) {
                                const sortedLogs = [...supportLogs].sort((a, b) => {
                                    const parseDate = (dateStr) => {
                                        if (!dateStr)
                                            return null;
                                        if (dateStr.includes('/')) {
                                            const parts = dateStr.split('/');
                                            if (parts.length === 3) {
                                                return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                                            }
                                        }
                                        return new Date(dateStr);
                                    };
                                    const dateA = parseDate(a.date);
                                    const dateB = parseDate(b.date);
                                    if (!dateA && !dateB)
                                        return 0;
                                    if (!dateA)
                                        return 1;
                                    if (!dateB)
                                        return -1;
                                    const dateCompare = dateB.getTime() - dateA.getTime();
                                    if (dateCompare !== 0)
                                        return dateCompare;
                                    if (a.time && b.time)
                                        return b.time.localeCompare(a.time);
                                    return 0;
                                });
                                const latestLog = sortedLogs[0];
                                if (latestLog.date) {
                                    if (latestLog.date.includes('/')) {
                                        const parts = latestLog.date.split('/');
                                        if (parts.length === 3) {
                                            lastInteractionDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                                        }
                                        else {
                                            lastInteractionDate = latestLog.date;
                                        }
                                    }
                                    else {
                                        lastInteractionDate = latestLog.date;
                                    }
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
                                lastInteractionDate: lastInteractionDate || '',
                                platform: row[7] || '',
                                phone: row[8] || '',
                                lastModifiedAt: row[9] || '',
                                lastModifiedBy: row[10] || '',
                                historyLogs,
                                supportLogs,
                            };
                        });
                        return merchants;
                    }
                    catch (error) {
                        lastError = error;
                        const statusCode = error?.response?.status || error?.code;
                        const isRetryable = statusCode === 500 || statusCode === 503 || statusCode === 429 ||
                            error?.message?.includes('rate limit') ||
                            error?.message?.includes('quota exceeded');
                        if (isRetryable && attempt < maxRetries - 1) {
                            const delay = Math.pow(2, attempt) * 1000;
                            this.logger.warn(`[getMerchants] Retryable error (attempt ${attempt + 1}/${maxRetries}): ${error.message}. Retrying in ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                        throw error;
                    }
                }
                throw lastError;
            }
            catch (error) {
                this.logger.error('Error fetching merchants from Google Sheets:', error);
                throw error;
            }
        }, 'getMerchants');
    }
    async getMerchantsInternal() {
        if (!this.sheets) {
            throw new Error('Google Sheets service not initialized');
        }
        const spreadsheetId = app_config_1.appConfig.spreadsheetId;
        let lastError;
        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
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
                    if (row[11]) {
                        try {
                            historyLogs = JSON.parse(row[11]);
                        }
                        catch (e) {
                            this.logger.warn(`Invalid history_logs JSON at row ${index + 2}`);
                        }
                    }
                    let supportLogs = [];
                    if (row[12]) {
                        try {
                            supportLogs = JSON.parse(row[12]);
                        }
                        catch (e) {
                            this.logger.warn(`Invalid support_logs JSON at row ${index + 2}`);
                        }
                    }
                    let lastInteractionDate = '';
                    if (supportLogs && supportLogs.length > 0) {
                        const sortedLogs = [...supportLogs].sort((a, b) => {
                            const parseDate = (dateStr) => {
                                if (!dateStr)
                                    return null;
                                if (dateStr.includes('/')) {
                                    const parts = dateStr.split('/');
                                    if (parts.length === 3) {
                                        return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                                    }
                                }
                                return new Date(dateStr);
                            };
                            const dateA = parseDate(a.date);
                            const dateB = parseDate(b.date);
                            if (!dateA && !dateB)
                                return 0;
                            if (!dateA)
                                return 1;
                            if (!dateB)
                                return -1;
                            const dateCompare = dateB.getTime() - dateA.getTime();
                            if (dateCompare !== 0)
                                return dateCompare;
                            if (a.time && b.time)
                                return b.time.localeCompare(a.time);
                            return 0;
                        });
                        const latestLog = sortedLogs[0];
                        if (latestLog.date) {
                            if (latestLog.date.includes('/')) {
                                const parts = latestLog.date.split('/');
                                if (parts.length === 3) {
                                    lastInteractionDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                                }
                                else {
                                    lastInteractionDate = latestLog.date;
                                }
                            }
                            else {
                                lastInteractionDate = latestLog.date;
                            }
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
                        lastInteractionDate: lastInteractionDate || '',
                        platform: row[7] || '',
                        phone: row[8] || '',
                        lastModifiedAt: row[9] || '',
                        lastModifiedBy: row[10] || '',
                        historyLogs,
                        supportLogs,
                    };
                });
                return merchants;
            }
            catch (error) {
                lastError = error;
                const statusCode = error?.response?.status || error?.code;
                const isRetryable = statusCode === 500 || statusCode === 503 || statusCode === 429 ||
                    error?.message?.includes('rate limit') ||
                    error?.message?.includes('quota exceeded');
                if (isRetryable && attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 1000;
                    this.logger.warn(`[getMerchantsInternal] Retryable error (attempt ${attempt + 1}/${maxRetries}): ${error.message}. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
        throw lastError;
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
                    merchant.platform,
                    merchant.phone,
                    meta.at ?? new Date().toISOString().slice(0, 10),
                    meta.by,
                    JSON.stringify([]),
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
            this.logger.log(`[GoogleSheets] Updating merchant id=${id}, rowIndex=${rowIndex}, updatedBy=${meta.by}`);
            const current = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `Merchants!A${rowIndex}:M${rowIndex}`,
            });
            const row = current.data.values?.[0] || [];
            if (!row || row.length === 0) {
                this.logger.error(`[GoogleSheets] Row ${rowIndex} not found or empty`);
                throw new Error(`Row ${rowIndex} not found in Google Sheets`);
            }
            this.logger.log(`[GoogleSheets] Current row data: name=${row[0]}, platform=${row[7]}`);
            const previous = {
                name: row[0] || '',
                storeId: row[1] || '',
                address: row[2] || '',
                street: row[3] || '',
                area: row[4] || '',
                state: row[5] || '',
                zipcode: row[6] || '',
                platform: row[7] || '',
                phone: row[8] || '',
                lastModifiedAt: row[9] || '',
                lastModifiedBy: row[10] || '',
            };
            let historyLogs = [];
            if (row[11]) {
                try {
                    historyLogs = JSON.parse(row[11]);
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
                platform: values[0][7],
                lastModifiedAt: values[0][9],
                lastModifiedBy: values[0][10],
            });
            const updateResult = await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Merchants!A${rowIndex}:M${rowIndex}`,
                valueInputOption: 'RAW',
                resource: { values },
            });
            this.logger.log(`[GoogleSheets] Update successful! Updated cells:`, updateResult.data.updatedCells);
            this.logger.log(`Merchant ${id} updated in Google Sheets`);
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
    async getMerchantStoreIds() {
        try {
            const merchants = await this.getMerchants();
            return new Set(merchants.map(m => m.storeId).filter(Boolean));
        }
        catch (error) {
            this.logger.error('Error getting merchant store IDs:', error);
            return new Set();
        }
    }
    extractNumericId(id, logContext) {
        if (!id) {
            if (logContext) {
                this.logger.debug(`[extractNumericId] ${logContext}: Empty ID, returning empty string`);
            }
            return '';
        }
        const originalId = id.toString();
        const match = originalId.match(/\d+/);
        const numericId = match ? match[0] : '';
        if (logContext && numericId) {
            this.logger.debug(`[extractNumericId] ${logContext}: "${originalId}" -> "${numericId}"`);
        }
        else if (logContext && !numericId) {
            this.logger.warn(`[extractNumericId] ${logContext}: "${originalId}" -> No numeric part found`);
        }
        return numericId;
    }
    async getLastSheetName(spreadsheetId) {
        try {
            const metadata = await this.sheets.spreadsheets.get({
                spreadsheetId,
            });
            const sheets = metadata.data.sheets || [];
            if (sheets.length === 0) {
                throw new Error('No sheets found in Call Logs spreadsheet');
            }
            const lastSheet = sheets[sheets.length - 1];
            return lastSheet.properties.title;
        }
        catch (error) {
            this.logger.error('Error getting last sheet name:', error);
            throw error;
        }
    }
    async readCallLogs() {
        try {
            if (!this.sheets) {
                throw new Error('Google Sheets service not initialized');
            }
            const spreadsheetId = app_config_1.appConfig.callLogsSpreadsheetId;
            const lastSheetName = await this.getLastSheetName(spreadsheetId);
            this.logSync(`Reading call logs from sheet: ${lastSheetName}`);
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${lastSheetName}!A:M`,
            });
            const rows = response.data.values;
            if (!rows || rows.length <= 1) {
                this.logSync(`[Call Logs] No rows found in sheet ${lastSheetName} (only ${rows?.length || 0} rows)`);
                return [];
            }
            const totalRowsRead = rows.length - 1;
            this.logSync(`[Call Logs] 📊 Đã đọc được ${totalRowsRead} rows từ sheet ${lastSheetName} (có header row)`);
            let lastValidDate = '';
            const callLogsBeforeFilter = rows.slice(1)
                .map((row, index) => {
                const id = row[5] || '';
                const numericId = this.extractNumericId(id, `Call Log row ${index + 2}`);
                let date = row[1] || '';
                if (!date && lastValidDate) {
                    date = lastValidDate;
                }
                else if (date) {
                    lastValidDate = date;
                }
                return {
                    date: date,
                    time: row[2] || '',
                    id: id,
                    issue: row[7] || '',
                    category: row[8] || '',
                    supporter: row[12] || '',
                    numericId: numericId,
                    rawRow: row,
                    rowIndex: index + 2,
                    originalDate: row[1] || '',
                };
            });
            const rowsWithFilledDate = callLogsBeforeFilter.filter(log => !log.originalDate && log.date).length;
            if (rowsWithFilledDate > 0) {
                this.logSync(`[Call Logs] 📊 Forward Fill Date: Đã fill date cho ${rowsWithFilledDate} rows (lấy từ row phía trước gần nhất có date)`);
            }
            let filteredCount = 0;
            let missingIdCount = 0;
            let missingDateCount = 0;
            let missingTimeCount = 0;
            let missingNumericIdCount = 0;
            const filteredSamples = [];
            const callLogs = callLogsBeforeFilter.filter((log) => {
                const hasId = !!log.id;
                const hasDate = !!log.date;
                const hasTime = !!log.time;
                const hasNumericId = !!log.numericId;
                const isValid = hasId && hasDate && hasTime && hasNumericId;
                if (!isValid) {
                    filteredCount++;
                    const reasons = [];
                    if (!hasId) {
                        missingIdCount++;
                        reasons.push('thiếu ID (cột F)');
                    }
                    if (!hasDate) {
                        missingDateCount++;
                        reasons.push('thiếu Date (cột B)');
                    }
                    if (!hasTime) {
                        missingTimeCount++;
                        reasons.push('thiếu Time (cột C)');
                    }
                    if (!hasNumericId) {
                        missingNumericIdCount++;
                        reasons.push('không extract được numericId từ ID');
                    }
                    const reason = reasons.join(', ');
                    if (filteredSamples.length < 10) {
                        const dateInfo = log.originalDate ?
                            `"${log.originalDate}" (có sẵn)` :
                            (log.date ? `"${log.date}" (đã fill từ row trước)` : 'TRỐNG');
                        filteredSamples.push({
                            id: log.id || 'KHÔNG CÓ',
                            reason: reason,
                            rowData: {
                                rowIndex: log.rowIndex,
                                columnB_date: dateInfo,
                                columnB_date_original: log.originalDate || 'TRỐNG',
                                columnB_date_filled: log.date || 'TRỐNG',
                                columnC_time: log.time || 'TRỐNG',
                                columnF_id: log.id || 'TRỐNG',
                                columnH_issue: log.issue || 'TRỐNG',
                                columnI_category: log.category || 'TRỐNG',
                                columnM_supporter: log.supporter || 'TRỐNG',
                            }
                        });
                    }
                }
                return isValid;
            }).map((log) => {
                const { rawRow, rowIndex, originalDate, ...cleanLog } = log;
                return cleanLog;
            });
            this.logSync(`[Call Logs] 📊 PHÂN TÍCH LỌC DỮ LIỆU:`);
            this.logSync(`  - Tổng rows đọc được: ${totalRowsRead}`);
            this.logSync(`  - Rows hợp lệ (sau filter): ${callLogs.length}`);
            this.logSync(`  - Rows bị loại bỏ: ${filteredCount}`);
            const missingDateBeforeFill = callLogsBeforeFilter.filter(log => !log.originalDate).length;
            if (missingDateBeforeFill > 0) {
                this.logSync(`  - Rows thiếu Date (trước khi fill): ${missingDateBeforeFill} rows`);
                this.logSync(`  - Rows đã được fill Date: ${rowsWithFilledDate} rows`);
            }
            this.logSync(`[Call Logs] 📊 CHI TIẾT LÝ DO LOẠI BỎ:`);
            this.logSync(`  - Thiếu ID (cột F): ${missingIdCount} rows`);
            this.logSync(`  - Thiếu Date (sau khi forward fill vẫn thiếu): ${missingDateCount} rows`);
            this.logSync(`  - Thiếu Time (cột C): ${missingTimeCount} rows`);
            this.logSync(`  - Không extract được numericId từ ID: ${missingNumericIdCount} rows`);
            if (filteredSamples.length > 0) {
                this.logSync(`[Call Logs] Mẫu các rows bị loại bỏ (first ${filteredSamples.length}):`);
                filteredSamples.forEach((sample, idx) => {
                    this.logSync(`  [${idx + 1}] Row ${sample.rowData.rowIndex}:`);
                    if (sample.rowData.columnB_date_original === 'TRỐNG' && sample.rowData.columnB_date_filled !== 'TRỐNG') {
                        this.logSync(`      - Cột B (Date): "${sample.rowData.columnB_date_filled}" (đã fill từ row trước, gốc: TRỐNG)`);
                    }
                    else {
                        this.logSync(`      - Cột B (Date): ${sample.rowData.columnB_date}`);
                    }
                    this.logSync(`      - Cột C (Time): "${sample.rowData.columnC_time}"`);
                    this.logSync(`      - Cột F (ID): "${sample.rowData.columnF_id}"`);
                    this.logSync(`      - Cột H (Issue): "${sample.rowData.columnH_issue}"`);
                    this.logSync(`      - Cột M (Supporter): "${sample.rowData.columnM_supporter}"`);
                    this.logSync(`      - Lý do loại bỏ: ${sample.reason}`);
                });
                if (filteredCount > filteredSamples.length) {
                    this.logSync(`  ... và ${filteredCount - filteredSamples.length} rows khác bị loại bỏ`);
                }
            }
            this.logSync(`[Call Logs] 📊 SỐ CALL LOGS ĐÃ ĐỌC ĐƯỢC TỪ SHEET: ${callLogs.length} call logs (sau khi filter, ${filteredCount}/${totalRowsRead} rows đã bị loại bỏ do thiếu dữ liệu)`);
            if (callLogs.length > 0) {
                this.logSync(`Sample call logs (first 5):`);
                callLogs.slice(0, 5).forEach((log, index) => {
                    this.logSync(`  [${index + 1}] ID: ${log.id} (numeric: ${log.numericId}), Date: ${log.date}, Time: ${log.time}, Issue: ${log.issue || 'N/A'}, Category: ${log.category || 'N/A'}, Supporter: ${log.supporter || 'N/A'}`);
                });
                if (callLogs.length > 5) {
                    this.logSync(`  ... and ${callLogs.length - 5} more call logs`);
                }
            }
            return callLogs;
        }
        catch (error) {
            this.logger.error('Error reading call logs:', error);
            throw error;
        }
    }
    async syncCallLogsToMerchants(userEmail) {
        return this.withLock(async () => {
            try {
                if (!this.sheets) {
                    throw new Error('Google Sheets service not initialized');
                }
                this.logSync(`[Sync Call Logs] Bắt đầu đọc call logs từ sheet Call Logs...`);
                const callLogs = await this.readCallLogs();
                this.logSync(`[Sync Call Logs] 📊 TỔNG SỐ CALL LOGS ĐÃ ĐỌC ĐƯỢC: ${callLogs.length} call logs từ sheet Call Logs`);
                if (callLogs.length === 0) {
                    this.logSync(`[Sync Call Logs] Không có call logs nào để sync`);
                    return { matched: 0, updated: 0, errors: 0, totalCallLogsAdded: 0 };
                }
                const merchants = await this.getMerchantsInternal();
                this.logSync(`Total merchants found: ${merchants.length}`);
                const merchantMap = new Map();
                this.logSync(`[ID Matching] Building merchant map by numeric ID:`);
                merchants.forEach(merchant => {
                    if (merchant.storeId) {
                        const numericId = this.extractNumericId(merchant.storeId, `Merchant ${merchant.name}`);
                        this.logSync(`  - Merchant: ${merchant.name}, Store ID: ${merchant.storeId}, Extracted Numeric ID: ${numericId}`);
                        if (numericId) {
                            if (!merchantMap.has(numericId)) {
                                merchantMap.set(numericId, []);
                            }
                            merchantMap.get(numericId).push(merchant);
                            const merchantsWithSameId = merchantMap.get(numericId);
                            if (merchantsWithSameId.length > 1) {
                                this.logSync(`  ✅ Found ${merchantsWithSameId.length} merchants with same numeric ID ${numericId}: ${merchantsWithSameId.map(m => m.storeId).join(', ')}`);
                            }
                        }
                        else {
                            this.warnSync(`  ⚠️ Could not extract numeric ID from storeId "${merchant.storeId}" for merchant ${merchant.name}`);
                        }
                    }
                    else {
                        this.warnSync(`  ⚠️ Merchant ${merchant.name} (id=${merchant.id}) has no storeId`);
                    }
                });
                this.logSync(`Total unique numeric IDs in merchant map: ${merchantMap.size}`);
                const uniqueCallLogIds = new Set(callLogs.map(log => log.numericId));
                this.logSync(`[ID Matching] Unique numeric IDs from call logs (${uniqueCallLogIds.size}):`);
                Array.from(uniqueCallLogIds).slice(0, 20).forEach(id => {
                    const count = callLogs.filter(log => log.numericId === id).length;
                    this.logSync(`  - Numeric ID: ${id} (found in ${count} call logs)`);
                });
                if (uniqueCallLogIds.size > 20) {
                    this.logSync(`  ... and ${uniqueCallLogIds.size - 20} more unique IDs`);
                }
                this.logSync(`[ID Matching] Analyzing matches:`);
                this.logSync(`  - Total merchants in map: ${merchantMap.size} unique numeric IDs`);
                this.logSync(`  - Total unique numeric IDs from call logs: ${uniqueCallLogIds.size}`);
                const merchantNumericIds = Array.from(merchantMap.keys());
                this.logSync(`  - Sample merchant numeric IDs (first 10): ${merchantNumericIds.slice(0, 10).join(', ')}`);
                const callLogNumericIds = Array.from(uniqueCallLogIds);
                this.logSync(`  - Sample call log numeric IDs (first 10): ${callLogNumericIds.slice(0, 10).join(', ')}`);
                const matchedIds = new Set();
                const unmatchedIds = new Set();
                callLogs.forEach(log => {
                    if (merchantMap.has(log.numericId)) {
                        matchedIds.add(log.numericId);
                    }
                    else {
                        unmatchedIds.add(log.numericId);
                    }
                });
                this.logSync(`  - Matched IDs: ${matchedIds.size} (${Array.from(matchedIds).slice(0, 10).join(', ')}${matchedIds.size > 10 ? '...' : ''})`);
                this.logSync(`  - Unmatched IDs: ${unmatchedIds.size} (${Array.from(unmatchedIds).slice(0, 10).join(', ')}${unmatchedIds.size > 10 ? '...' : ''})`);
                let totalMerchantsMatched = 0;
                matchedIds.forEach(numericId => {
                    const merchants = merchantMap.get(numericId);
                    if (merchants) {
                        totalMerchantsMatched += merchants.length;
                    }
                });
                this.logSync(`[ID Matching] 📊 TỔNG SỐ MERCHANT MATCH VỚI CALL LOG: ${totalMerchantsMatched} merchants (từ ${matchedIds.size} unique numeric IDs, có ${uniqueCallLogIds.size} unique numeric IDs từ call logs, tổng ${merchants.length} merchants trong hệ thống)`);
                let matched = 0;
                let updated = 0;
                let errors = 0;
                let totalCallLogsAdded = 0;
                const logsByMerchant = new Map();
                callLogs.forEach(log => {
                    if (!logsByMerchant.has(log.numericId)) {
                        logsByMerchant.set(log.numericId, []);
                    }
                    logsByMerchant.get(log.numericId).push(log);
                });
                this.logSync(`[ID Matching] Grouped call logs into ${logsByMerchant.size} unique merchant IDs`);
                for (const [numericId, logs] of logsByMerchant.entries()) {
                    this.logSync(`[ID Matching] Processing numeric ID: ${numericId} with ${logs.length} call logs`);
                    const matchedMerchants = merchantMap.get(numericId);
                    if (!matchedMerchants || matchedMerchants.length === 0) {
                        this.warnSync(`  ❌ No merchant found for numeric ID: ${numericId}`);
                        this.warnSync(`  Available merchant numeric IDs: ${Array.from(merchantMap.keys()).slice(0, 20).join(', ')}${merchantMap.size > 20 ? '...' : ''}`);
                        continue;
                    }
                    this.logSync(`  ✅ Found ${matchedMerchants.length} matching merchant(s) with numeric ID ${numericId}:`);
                    matchedMerchants.forEach(m => {
                        this.logSync(`    - ${m.name} (Store ID: ${m.storeId})`);
                    });
                    this.logSync(`  - Call log IDs: ${logs.map(l => l.id).join(', ')}`);
                    this.logSync(`  - All extract to numeric ID: ${numericId}`);
                    matched += matchedMerchants.length;
                    for (const merchant of matchedMerchants) {
                        if (!merchant.id) {
                            this.warnSync(`  ⚠️ Skipping merchant ${merchant.name} (Store ID: ${merchant.storeId}) - no id field`);
                            continue;
                        }
                        try {
                            const actualRowIndex = merchant.id + 1;
                            this.logSync(`[Sync Call Logs] Processing merchant: ${merchant.name} (Store ID: ${merchant.storeId}, Numeric ID: ${numericId})`);
                            this.logSync(`  - merchant.id = ${merchant.id}, actualRowIndex in sheet = ${actualRowIndex}`);
                            this.logSync(`  - Found ${logs.length} call logs to process for this merchant`);
                            const current = await this.sheets.spreadsheets.values.get({
                                spreadsheetId: app_config_1.appConfig.spreadsheetId,
                                range: `Merchants!A${actualRowIndex}:M${actualRowIndex}`,
                            });
                            const row = current.data.values?.[0] || [];
                            if (row.length === 0) {
                                this.warnSync(`Row ${actualRowIndex} is empty, skipping...`);
                                continue;
                            }
                            this.logSync(`Row ${actualRowIndex} has ${row.length} columns`);
                            let existingLogs = [];
                            if (row[12]) {
                                try {
                                    existingLogs = JSON.parse(row[12]);
                                    this.logSync(`Found ${existingLogs.length} existing support logs for merchant ${merchant.storeId}`);
                                }
                                catch (e) {
                                    this.warnSync(`Invalid support_logs JSON at row ${actualRowIndex}: ${row[12]}`);
                                }
                            }
                            else {
                                this.logSync(`No existing support_logs found for merchant ${merchant.storeId}, will create new`);
                            }
                            const existingMap = new Map();
                            existingLogs.forEach(log => {
                                existingMap.set(`${log.date}|${log.time}`, log);
                            });
                            let updatedExisting = 0;
                            const additions = [];
                            logs.forEach(log => {
                                const key = `${log.date}|${log.time}`;
                                const existing = existingMap.get(key);
                                if (existing) {
                                    const hasExistingCategory = typeof existing.category === 'string' && existing.category.trim() !== '';
                                    const hasIncomingCategory = typeof log.category === 'string' && log.category.trim() !== '';
                                    if (!hasExistingCategory && hasIncomingCategory) {
                                        existing.category = log.category;
                                        updatedExisting++;
                                    }
                                }
                                else {
                                    additions.push({
                                        date: log.date,
                                        time: log.time,
                                        issue: log.issue || '',
                                        category: log.category || '',
                                        supporter: log.supporter || '',
                                    });
                                }
                            });
                            if (additions.length === 0 && updatedExisting === 0) {
                                this.logSync(`Merchant ${merchant.storeId} (ID: ${numericId}): No changes (no new logs, no category updates)`);
                                continue;
                            }
                            this.logSync(`[Call Log Sync] Merchant: ${merchant.storeId} (ID: ${numericId}), Merchant Name: ${merchant.name}`);
                            if (additions.length > 0) {
                                additions.forEach((log, index) => {
                                    this.logSync(`  [ADD ${index + 1}] Date: ${log.date}, Time: ${log.time}, Issue: ${log.issue || 'N/A'}, Category: ${log.category || 'N/A'}, Supporter: ${log.supporter || 'N/A'}`);
                                });
                            }
                            if (updatedExisting > 0) {
                                this.logSync(`  [UPDATE] Added missing Category for ${updatedExisting} existing logs (matched by Date+Time)`);
                            }
                            const allLogs = [...existingLogs, ...additions];
                            const supportLogsJson = JSON.stringify(allLogs);
                            this.logSync(`Preparing to update row ${actualRowIndex} with ${allLogs.length} total support logs (${additions.length} new, ${updatedExisting} updated)`);
                            this.logSync(`Support logs JSON length: ${supportLogsJson.length} characters`);
                            const valuesArray = [
                                row[0] || '',
                                row[1] || '',
                                row[2] || '',
                                row[3] || '',
                                row[4] || '',
                                row[5] || '',
                                row[6] || '',
                                row[7] || '',
                                row[8] || '',
                                row[9] || '',
                                row[10] || '',
                                row[11] || '[]',
                                supportLogsJson,
                            ];
                            while (valuesArray.length < 13) {
                                valuesArray.push('');
                            }
                            const values = [valuesArray];
                            this.logSync(`Updating row ${actualRowIndex} with range Merchants!A${actualRowIndex}:M${actualRowIndex}`);
                            const updateResult = await this.sheets.spreadsheets.values.update({
                                spreadsheetId: app_config_1.appConfig.spreadsheetId,
                                range: `Merchants!A${actualRowIndex}:M${actualRowIndex}`,
                                valueInputOption: 'RAW',
                                resource: { values },
                            });
                            if (updateResult.data) {
                                this.logSync(`Update response: updatedCells=${updateResult.data.updatedCells}, updatedRows=${updateResult.data.updatedRows}, updatedColumns=${updateResult.data.updatedColumns}`);
                            }
                            else {
                                this.warnSync(`Update response is empty, but no error thrown`);
                            }
                            updated++;
                            totalCallLogsAdded += additions.length;
                            this.logSync(`✅ Successfully updated support_logs for merchant ${merchant.storeId} (row ${actualRowIndex}): added ${additions.length} call logs, updated ${updatedExisting} existing, total ${allLogs.length} logs`);
                            const verifyResult = await this.sheets.spreadsheets.values.get({
                                spreadsheetId: app_config_1.appConfig.spreadsheetId,
                                range: `Merchants!M${actualRowIndex}:M${actualRowIndex}`,
                            });
                            const verifyRow = verifyResult.data.values?.[0]?.[0];
                            if (verifyRow) {
                                try {
                                    const verifyLogs = JSON.parse(verifyRow);
                                    this.logSync(`✅ Verification: Row ${actualRowIndex} column M now contains ${verifyLogs.length} support logs`);
                                }
                                catch (e) {
                                    this.warnSync(`⚠️ Verification failed: Column M content is not valid JSON: ${verifyRow}`);
                                }
                            }
                            else {
                                this.warnSync(`⚠️ Verification failed: Column M is empty after update`);
                            }
                        }
                        catch (error) {
                            errors++;
                            this.errorSync(`❌ Error updating support_logs for merchant ${merchant.name} (Store ID: ${merchant.storeId}, Numeric ID: ${numericId})`, error);
                        }
                    }
                }
                this.logSync(`[Call Log Sync Summary] 📊 TỔNG KẾT:`);
                this.logSync(`  - Tổng số merchant có call logs match: ${matched}/${totalMerchantsMatched}`);
                this.logSync(`  - Tổng số merchant đã update thành công: ${updated}`);
                this.logSync(`  - Tổng số merchant có lỗi: ${errors}`);
                this.logSync(`  - Tổng số call logs đã thêm mới: ${totalCallLogsAdded}`);
                this.logSync(`  - Tổng số merchant trong hệ thống: ${merchants.length}`);
                this.logSync(`  - Tổng số unique numeric IDs từ call logs: ${uniqueCallLogIds.size}`);
                this.logSync(`  - Tổng số call logs đã đọc: ${callLogs.length}`);
                this.writeToLogFile(`\n=== Call Logs Sync Completed at ${new Date().toISOString()} ===\n`);
                this.writeToLogFile(`Final Results: Matched=${matched}, Updated=${updated}, Errors=${errors}, TotalCallLogsAdded=${totalCallLogsAdded}\n`);
                return { matched, updated, errors, totalCallLogsAdded };
            }
            catch (error) {
                this.errorSync('Error syncing call logs to merchants', error);
                this.writeToLogFile(`\n=== Call Logs Sync Failed at ${new Date().toISOString()} ===\n`);
                throw error;
            }
        }, 'syncCallLogsToMerchants');
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