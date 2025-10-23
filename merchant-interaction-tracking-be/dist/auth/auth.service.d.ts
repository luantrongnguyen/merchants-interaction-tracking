import { JwtService } from '@nestjs/jwt';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
export interface User {
    email: string;
    name: string;
    picture: string;
    sub: string;
}
export declare class AuthService {
    private jwtService;
    private googleSheetsService;
    constructor(jwtService: JwtService, googleSheetsService: GoogleSheetsService);
    validateUser(user: User): Promise<boolean>;
    login(user: User): Promise<{
        access_token: string;
        user: {
            email: string;
            name: string;
            picture: string;
            sub: string;
        };
    }>;
    validateToken(payload: any): Promise<User>;
}
