import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
export declare class MerchantService {
    private googleSheetsService;
    constructor(googleSheetsService: GoogleSheetsService);
    create(createMerchantDto: CreateMerchantDto): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: number): Promise<any>;
    update(id: number, updateMerchantDto: UpdateMerchantDto): Promise<any>;
    remove(id: number): Promise<void>;
}
