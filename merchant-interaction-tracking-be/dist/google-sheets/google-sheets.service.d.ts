export declare class GoogleSheetsService {
    private readonly logger;
    private sheets;
    private auth;
    private logFilePath;
    constructor();
    private initializeLogFile;
    private writeToLogFile;
    private logSync;
    private warnSync;
    private errorSync;
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
    getMerchantStoreIds(): Promise<Set<string>>;
    private extractNumericId;
    private getLastSheetName;
    readCallLogs(): Promise<Array<{
        id: string;
        numericId: string;
        date: string;
        time: string;
        issue: string;
        category?: string;
        supporter: string;
    }>>;
    syncCallLogsToMerchants(userEmail: string): Promise<{
        matched: number;
        updated: number;
        errors: number;
        totalCallLogsAdded: number;
    }>;
    getAuthorizedEmails(): Promise<string[]>;
}
