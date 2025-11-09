import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
export declare class MerchantService {
    private googleSheetsService;
    constructor(googleSheetsService: GoogleSheetsService);
    create(createMerchantDto: CreateMerchantDto, userEmail: string): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: number): Promise<any>;
    update(id: number, updateMerchantDto: UpdateMerchantDto, userEmail: string): Promise<any>;
    addSupportNote(id: number, noteContent: string, userName: string, userEmail: string): Promise<any>;
    remove(id: number): Promise<void>;
    syncMerchantsFromExternal(userEmail: string): Promise<{
        added: number;
        skipped: number;
        errors: number;
    }>;
    syncCallLogs(userEmail: string): Promise<{
        matched: number;
        updated: number;
        errors: number;
    }>;
    syncAllCallLogs(userEmail: string): Promise<{
        matched: number;
        updated: number;
        errors: number;
        totalCallLogsAdded: number;
    }>;
}
