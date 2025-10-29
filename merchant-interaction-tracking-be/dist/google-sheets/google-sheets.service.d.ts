export declare class GoogleSheetsService {
    private readonly logger;
    private sheets;
    private auth;
    constructor();
    private initializeAuth;
    private getMockMerchants;
    getMerchants(): Promise<any[]>;
    addMerchant(merchant: any, meta: {
        by: string;
        at?: string;
    }): Promise<void>;
    updateMerchant(id: number, merchant: any, meta: {
        by: string;
        at?: string;
    }): Promise<void>;
    deleteMerchant(id: number): Promise<void>;
    getAuthorizedEmails(): Promise<string[]>;
}
