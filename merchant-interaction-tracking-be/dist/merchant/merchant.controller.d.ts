import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
export declare class MerchantController {
    private readonly merchantService;
    constructor(merchantService: MerchantService);
    create(createMerchantDto: CreateMerchantDto): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: number): Promise<any>;
    update(id: number, updateMerchantDto: UpdateMerchantDto): Promise<any>;
    remove(id: number): Promise<void>;
}
