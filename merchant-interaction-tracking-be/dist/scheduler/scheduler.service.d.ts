import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
export declare class SchedulerService {
    private readonly sheetsService;
    private readonly logger;
    constructor(sheetsService: GoogleSheetsService);
    autoSyncCallLogs(): Promise<void>;
}
