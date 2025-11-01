"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImsProxyModule = void 0;
const common_1 = require("@nestjs/common");
const ims_proxy_controller_1 = require("./ims-proxy.controller");
const ims_proxy_service_1 = require("./ims-proxy.service");
let ImsProxyModule = class ImsProxyModule {
};
exports.ImsProxyModule = ImsProxyModule;
exports.ImsProxyModule = ImsProxyModule = __decorate([
    (0, common_1.Module)({
        controllers: [ims_proxy_controller_1.ImsProxyController],
        providers: [ims_proxy_service_1.ImsProxyService],
        exports: [ims_proxy_service_1.ImsProxyService],
    })
], ImsProxyModule);
//# sourceMappingURL=ims-proxy.module.js.map