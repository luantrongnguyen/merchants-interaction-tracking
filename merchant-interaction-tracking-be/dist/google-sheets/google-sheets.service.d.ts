export declare class GoogleSheetsService {
    private readonly logger;
    private sheets;
    private auth;
    private logFilePath;
    private readLock;
    private writeLock;
    private activeReads;
    private isWriting;
    private lastSyncSheetName;
    private lastSyncRowIndex;
    constructor();
    private initializeLogFile;
    private writeToLogFile;
    private logSync;
    private warnSync;
    private errorSync;
    private initializeAuth;
    private getMockMerchants;
    private withReadLock;
    private withWriteLock;
    getMerchants(): Promise<any[]>;
    private getMerchantsInternal;
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
    private getAllSheetNames;
    private readCallLogsFromSheet;
    readCallLogs(startFromIndex?: number): Promise<Array<{
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
    syncAllCallLogsToMerchants(userEmail: string): Promise<{
        matched: number;
        updated: number;
        errors: number;
        totalCallLogsAdded: number;
    }>;
    getAuthorizedEmails(): Promise<string[]>;
}
