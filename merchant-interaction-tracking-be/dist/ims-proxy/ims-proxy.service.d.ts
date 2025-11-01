export declare class ImsProxyService {
    private readonly logger;
    private readonly IMS_COOKIE;
    private convertStoreIdToCustomerCode;
    getTransactionByStoreCode(storeId: string): Promise<any>;
}
