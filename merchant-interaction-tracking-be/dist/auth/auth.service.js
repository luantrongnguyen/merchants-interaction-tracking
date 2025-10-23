"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const google_sheets_service_1 = require("../google-sheets/google-sheets.service");
let AuthService = class AuthService {
    jwtService;
    googleSheetsService;
    constructor(jwtService, googleSheetsService) {
        this.jwtService = jwtService;
        this.googleSheetsService = googleSheetsService;
    }
    async validateUser(user) {
        try {
            const isMangoDomain = user.email.toLowerCase().endsWith('@mangoforsalon.com');
            if (!isMangoDomain) {
                console.log(`Unauthorized access attempt from: ${user.email} - Not a Mango domain`);
                return false;
            }
            console.log(`Authorized access from: ${user.email} - Mango domain confirmed`);
            return true;
        }
        catch (error) {
            console.error('Error validating user:', error);
            return false;
        }
    }
    async login(user) {
        const isValid = await this.validateUser(user);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Chỉ email có domain @mangoforsalon.com mới được truy cập hệ thống');
        }
        const payload = {
            email: user.email,
            sub: user.sub,
            name: user.name,
            picture: user.picture
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                email: user.email,
                name: user.name,
                picture: user.picture,
                sub: user.sub
            }
        };
    }
    async validateToken(payload) {
        return {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            sub: payload.sub
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        google_sheets_service_1.GoogleSheetsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map