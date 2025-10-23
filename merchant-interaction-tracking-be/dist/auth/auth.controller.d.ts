import { AuthService } from './auth.service';
interface LoginDto {
    user: {
        email: string;
        name: string;
        picture: string;
        sub: string;
    };
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            email: string;
            name: string;
            picture: string;
            sub: string;
        };
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    logout(): Promise<{
        success: boolean;
        message: string;
    }>;
    checkAuth(req: any): Promise<{
        success: boolean;
        isAuthenticated: boolean;
        user: any;
    }>;
}
export {};
