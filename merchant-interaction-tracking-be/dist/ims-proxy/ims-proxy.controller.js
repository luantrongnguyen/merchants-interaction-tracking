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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImsProxyController = void 0;
const common_1 = require("@nestjs/common");
const ims_proxy_service_1 = require("./ims-proxy.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ImsProxyController = class ImsProxyController {
    imsProxyService;
    constructor(imsProxyService) {
        this.imsProxyService = imsProxyService;
    }
    async getTransactionByStoreCode(storeId) {
        try {
            const result = await this.imsProxyService.getTransactionByStoreCode(storeId);
            return result;
        }
        catch (error) {
            throw error;
        }
    }
};
exports.ImsProxyController = ImsProxyController;
__decorate([
    (0, common_1.Get)('transactions/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ImsProxyController.prototype, "getTransactionByStoreCode", null);
exports.ImsProxyController = ImsProxyController = __decorate([
    (0, common_1.Controller)('api/ims'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ims_proxy_service_1.ImsProxyService])
], ImsProxyController);
//# sourceMappingURL=ims-proxy.controller.js.map