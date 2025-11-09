import { Injectable } from '@nestjs/common';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class MerchantService {
  constructor(
    private googleSheetsService: GoogleSheetsService,
  ) {}

  async create(createMerchantDto: CreateMerchantDto, userEmail: string): Promise<any> {
    await this.googleSheetsService.addMerchant(createMerchantDto, { by: userEmail });
    return createMerchantDto;
  }

  async findAll(): Promise<any[]> {
    return await this.googleSheetsService.getMerchants();
  }

  async findOne(id: number): Promise<any> {
    const merchants = await this.googleSheetsService.getMerchants();
    return merchants.find(merchant => merchant.id === id);
  }

  async update(id: number, updateMerchantDto: UpdateMerchantDto, userEmail: string): Promise<any> {
    await this.googleSheetsService.updateMerchant(id, updateMerchantDto, { by: userEmail });
    return updateMerchantDto;
  }

  async addSupportNote(id: number, noteContent: string, userName: string, userEmail: string): Promise<any> {
    // Get current merchant data
    const merchants = await this.googleSheetsService.getMerchants();
    const merchant = merchants.find(m => m.id === id);
    
    if (!merchant) {
      throw new Error(`Merchant with id ${id} not found`);
    }
    
    // Get existing support notes or initialize empty array
    const existingNotes = merchant.supportNotes || [];
    
    // Create new note object
    const newNote = {
      content: noteContent,
      createdBy: userName || userEmail.split('@')[0] || 'Unknown',
      createdAt: new Date().toISOString(),
    };
    
    // Add new note to the beginning of the array (newest first)
    const updatedNotes = [newNote, ...existingNotes];
    
    // Update merchant with new support notes
    await this.googleSheetsService.updateMerchant(id, { ...merchant, supportNotes: updatedNotes }, { by: userEmail });
    return { ...merchant, supportNotes: updatedNotes };
  }

  async remove(id: number): Promise<void> {
    await this.googleSheetsService.deleteMerchant(id);
  }

  async syncMerchantsFromExternal(userEmail: string): Promise<{ added: number; skipped: number; errors: number }> {
    const API_URL = 'https://imsnext-portal.enrichco.us/api/Customer/ListMerchants';
    const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiSmFtZXMgRGllcCIsIklkIjoiMDAxNTU2IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoidXNlciIsIkF2YXRhciI6IiIsIkdNVCI6Ii01IiwiUGVybWlzc2lvbiI6WyJhY2Nlc3NfcmVhZCIsImFjY2Vzc19yZWFkIiwiaW52b2ljZV9mdWxsIiwiaW52b2ljZV9yZWFkIiwiaW52b2ljZV9yZWFkIiwiaW52b2ljZV9yZWFkb3RoZXJzIiwiaW52b2ljZV91cGRhdGUiLCJpbnZvaWNlX3VwZGF0ZW90aGVycyIsIm1lcmNoYW50X2Z1bGwiLCJtZXJjaGFudF9yZWFkIiwibWVyY2hhbnRfcmVhZCIsIm1lcmNoYW50X3VwZGF0ZSIsIm1lcmNoYW50X3VwZGF0ZW90aGVycyIsInBhcnRuZXJfcmVhZCIsInBhcnRuZXJfcmVhZCIsInBhcnRuZXJfdXBkYXRlIiwicmVjdXJyaW5ndHJhbnNfcmVhZCIsInJlY3VycmluZ3RyYW5zX3JlYWQiLCJzdWJzY3JpcHRpb25fcmVhZCIsInN1YnNjcmlwdGlvbl9yZWFkIiwic3Vic2NyaXB0aW9uX3VwZGF0ZSJdLCJleHAiOjE3NjczMjQ0OTgsImlzcyI6Imh0dHBzOi8vaW1zLWF1dGgiLCJhdWQiOiJpbXMtYXV0aCJ9.xNDSj3sBK2IiWgmXP3r93f9IJyvQLPKvNNA5IJex9Gc';

    try {
      // Get existing store IDs
      const existingStoreIds = await this.googleSheetsService.getMerchantStoreIds();
      
      // Fetch from external API
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

        // Skip if already exists
        if (existingStoreIds.has(customerCode)) {
          skipped++;
          continue;
        }

        // Extract state from businessName (format: "Name_StoreID_City_State")
        let state = '-';
        const nameParts = (item.businessName || '').split('_');
        if (nameParts.length >= 4) {
          state = nameParts[nameParts.length - 1];
        }

        // Create merchant data (lastInteractionDate will be computed from call logs)
        const merchantData = {
          name: item.businessName || '-',
          storeId: customerCode,
          address: item.address || '-',
          street: '-',
          area: '-',
          state: state,
          zipcode: '-',
          // lastInteractionDate is optional - will be computed from call logs
          platform: '-',
          phone: item.businessPhone || '-',
        };

        try {
          await this.googleSheetsService.addMerchant(merchantData, { by: userEmail });
          existingStoreIds.add(customerCode); // Track added
          added++;
        } catch (error) {
          errors++;
        }
      }

      return { added, skipped, errors };
    } catch (error) {
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  async syncCallLogs(userEmail: string): Promise<{ matched: number; updated: number; errors: number }> {
    return await this.googleSheetsService.syncCallLogsToMerchants(userEmail);
  }

  async syncAllCallLogs(userEmail: string): Promise<{ matched: number; updated: number; errors: number; totalCallLogsAdded: number }> {
    return await this.googleSheetsService.syncAllCallLogsToMerchants(userEmail);
  }
}
