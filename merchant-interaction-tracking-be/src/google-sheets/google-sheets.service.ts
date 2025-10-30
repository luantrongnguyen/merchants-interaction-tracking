import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { appConfig } from '../config/app.config';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets: any;
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      this.auth = new google.auth.GoogleAuth({
        keyFile: appConfig.googleCredentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.logger.log('Google Sheets authentication initialized');
    } catch (error) {
      this.logger.error('Error initializing Google Sheets auth:', error);
    }
  }

  private getMockMerchants(): any[] {
    // Return mock data for dev mode
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

  async getMerchants(): Promise<any[]> {
    try {
      // Check if sheets is initialized
      if (!this.sheets) {
        throw new Error('Google Sheets service not initialized');
      }

      const spreadsheetId = appConfig.spreadsheetId;
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Merchants!A:L',
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        return [];
      }

      // Skip header row
      const merchants = rows.slice(1).map((row: any[], index: number) => {
        let historyLogs: any[] = [];
        if (row[11]) {
          try {
            historyLogs = JSON.parse(row[11]);
          } catch (e) {
            this.logger.warn(`Invalid history_logs JSON at row ${index + 2}`);
          }
        }
        return {
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
        lastModifiedAt: row[9] || '',
        lastModifiedBy: row[10] || '',
        historyLogs,
      };});

      return merchants;
    } catch (error) {
      this.logger.error('Error fetching merchants from Google Sheets:', error);
      throw error;
    }
  }

  async addMerchant(merchant: any, meta: { by: string; at?: string }): Promise<void> {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets service not initialized');
      }

      const spreadsheetId = appConfig.spreadsheetId;
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
          meta.at ?? new Date().toISOString().slice(0, 10),
          meta.by,
          JSON.stringify([]),
        ],
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Merchants!A:L',
        valueInputOption: 'RAW',
        resource: { values },
      });

      this.logger.log('Merchant added to Google Sheets');
    } catch (error) {
      this.logger.error('Error adding merchant to Google Sheets:', error);
      throw error;
    }
  }

  async updateMerchant(id: number, merchant: any, meta: { by: string; at?: string }): Promise<void> {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets service not initialized');
      }

      const spreadsheetId = appConfig.spreadsheetId;
      const rowIndex = id + 1;

      // Fetch current row including history_logs
      const current = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `Merchants!A${rowIndex}:L${rowIndex}`,
      });
      const row = current.data.values?.[0] || [];

      // Build previous snapshot
      const previous = {
        name: row[0] || '',
        address: row[1] || '',
        street: row[2] || '',
        area: row[3] || '',
        state: row[4] || '',
        zipcode: row[5] || '',
        lastInteractionDate: row[6] || '',
        platform: row[7] || '',
        phone: row[8] || '',
        lastModifiedAt: row[9] || '',
        lastModifiedBy: row[10] || '',
      };

      // Parse existing history logs
      let historyLogs: any[] = [];
      if (row[11]) {
        try { historyLogs = JSON.parse(row[11]); } catch {}
      }
      historyLogs.push({ at: previous.lastModifiedAt || new Date().toISOString(), by: previous.lastModifiedBy || meta.by, data: previous });

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
          meta.at ?? new Date().toISOString().slice(0, 10),
          meta.by,
          JSON.stringify(historyLogs),
        ],
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Merchants!A${rowIndex}:L${rowIndex}`,
        valueInputOption: 'RAW',
        resource: { values },
      });

      this.logger.log(`Merchant ${id} updated in Google Sheets`);
    } catch (error) {
      this.logger.error('Error updating merchant in Google Sheets:', error);
      throw error;
    }
  }

  async deleteMerchant(id: number): Promise<void> {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets service not initialized');
      }

      const spreadsheetId = appConfig.spreadsheetId;
      const rowIndex = id + 1; // +1 because sheets are 1-indexed

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
    } catch (error) {
      this.logger.error('Error deleting merchant from Google Sheets:', error);
      throw error;
    }
  }

  async getAuthorizedEmails(): Promise<string[]> {
    try {
      const spreadsheetId = appConfig.spreadsheetId;
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'AuthorizedEmails!A:A', // Assuming authorized emails are in column A
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        this.logger.warn('No authorized emails found in Google Sheets');
        return [];
      }

      // Extract emails and convert to lowercase for case-insensitive comparison
      const emails = rows
        .map((row: any[]) => row[0]?.toString().toLowerCase().trim())
        .filter((email: string) => email && email.includes('@'));

      this.logger.log(`Found ${emails.length} authorized emails`);
      return emails;
    } catch (error) {
      this.logger.error('Error fetching authorized emails from Google Sheets:', error);
      // Return empty array on error to prevent blocking access
      return [];
    }
  }
}