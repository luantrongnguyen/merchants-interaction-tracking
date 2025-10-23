export declare class GoogleSheetsService {
    private readonly logger;
    private sheets;
    private auth;
    constructor();
    private initializeAuth;
    getMerchants(): Promise<any[]>;
    addMerchant(merchant: any): Promise<void>;
    updateMerchant(id: number, merchant: any): Promise<void>;
    deleteMerchant(id: number): Promise<void>;
    getAuthorizedEmails(): Promise<string[]>;
}
