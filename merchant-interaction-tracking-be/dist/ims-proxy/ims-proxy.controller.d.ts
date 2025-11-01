import { ImsProxyService } from './ims-proxy.service';
export declare class ImsProxyController {
    private readonly imsProxyService;
    constructor(imsProxyService: ImsProxyService);
    getTransactionByStoreCode(storeId: string): Promise<any>;
}
