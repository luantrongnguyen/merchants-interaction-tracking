import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { SyncCallLogsManualDto } from './dto/sync-call-logs-manual.dto';
export declare class MerchantController {
    private readonly merchantService;
    constructor(merchantService: MerchantService);
    create(createMerchantDto: CreateMerchantDto, req: any): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: number): Promise<any>;
    update(id: number, updateMerchantDto: UpdateMerchantDto, req: any): Promise<any>;
    remove(id: number): Promise<void>;
    syncMerchants(req: any): Promise<{
        added: number;
        skipped: number;
        errors: number;
    }>;
    syncCallLogs(req: any): Promise<{
        matched: number;
        updated: number;
        errors: number;
    }>;
    syncCallLogsManual(dto: SyncCallLogsManualDto, req: any): Promise<{
        matched: number;
        updated: number;
        errors: number;
        totalCallLogsAdded: number;
    }>;
}
