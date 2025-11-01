"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ImsProxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImsProxyService = void 0;
const common_1 = require("@nestjs/common");
const https = __importStar(require("https"));
const querystring = __importStar(require("querystring"));
let ImsProxyService = ImsProxyService_1 = class ImsProxyService {
    logger = new common_1.Logger(ImsProxyService_1.name);
    IMS_COOKIE = process.env.IMS_COOKIE || '.ASPXAUTH=0B858CD69512242CEB9A9D606964F3BC673F2BF3AFCB9B187503AC1C4D981898DF3CFFDB2FFDA3632964848E6A57F8F4A22B75B2772FA0069DC9664FD44FC29BDE290598274DF1871AC9F92319E86DEBC8F4AD9DFD6FDCDFA8AA688E121287FFD32F774E8199EF7B3D6EE06FBB40914414F27973A90ACF54677C7AB87528BDCEF8727C78D684949ECC7DFA758E40160B; stageDeploymentId=all; projectDeploymentId=0cfad872b90443b99444de319a586875; versionDeploymentId=716dd8dcc46b4e46bb71771998eacf48; projectSupportId=b5baeffae81e4a72ae9c834ce6cf4a0c; stageSupportId=all; versionSupportId=9f9008958ff24facb830a10f5ab93fe0; ASP.NET_SessionId=r2snylypvswsvhnup2yyq5fj; TicketPage=19120003';
    convertStoreIdToCustomerCode(storeId) {
        if (!storeId)
            return '';
        if (storeId.startsWith('S')) {
            return 'A' + storeId.substring(1);
        }
        return storeId;
    }
    async getTransactionByStoreCode(storeId) {
        if (!storeId) {
            throw new Error('Store ID is required');
        }
        const customerCode = this.convertStoreIdToCustomerCode(storeId);
        const formData = {
            'draw': '1',
            'columns[0][data]': '0',
            'columns[0][name]': 'Date',
            'columns[0][searchable]': 'true',
            'columns[0][orderable]': 'true',
            'columns[0][search][value]': '',
            'columns[0][search][regex]': 'false',
            'columns[1][data]': '1',
            'columns[1][name]': 'Order',
            'columns[1][searchable]': 'true',
            'columns[1][orderable]': 'true',
            'columns[1][search][value]': '',
            'columns[1][search][regex]': 'false',
            'columns[2][data]': '2',
            'columns[2][name]': 'Type',
            'columns[2][searchable]': 'true',
            'columns[2][orderable]': 'true',
            'columns[2][search][value]': '',
            'columns[2][search][regex]': 'false',
            'columns[3][data]': '3',
            'columns[3][name]': 'Amount',
            'columns[3][searchable]': 'true',
            'columns[3][orderable]': 'true',
            'columns[3][search][value]': '',
            'columns[3][search][regex]': 'false',
            'columns[4][data]': '4',
            'columns[4][name]': 'BankName',
            'columns[4][searchable]': 'true',
            'columns[4][orderable]': 'true',
            'columns[4][search][value]': '',
            'columns[4][search][regex]': 'false',
            'columns[5][data]': '5',
            'columns[5][name]': 'CardNumber',
            'columns[5][searchable]': 'true',
            'columns[5][orderable]': 'true',
            'columns[5][search][value]': '',
            'columns[5][search][regex]': 'false',
            'columns[6][data]': '6',
            'columns[6][name]': 'Status',
            'columns[6][searchable]': 'true',
            'columns[6][orderable]': 'true',
            'columns[6][search][value]': '',
            'columns[6][search][regex]': 'false',
            'columns[7][data]': '7',
            'columns[7][name]': 'ResponeText',
            'columns[7][searchable]': 'true',
            'columns[7][orderable]': 'true',
            'columns[7][search][value]': '',
            'columns[7][search][regex]': 'false',
            'order[0][column]': '1',
            'order[0][dir]': 'desc',
            'start': '0',
            'length': '10',
            'search[value]': '',
            'search[regex]': 'false',
            'FilterCard': '',
            'SearchText': '',
            'CustomerCode': customerCode,
        };
        const postData = querystring.stringify(formData);
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'ims.enrichcous.com',
                port: 443,
                path: '/MerchantMan/GetTransactionByStoreCode',
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'content-length': Buffer.byteLength(postData),
                    'origin': 'https://ims.enrichcous.com',
                    'priority': 'u=1, i',
                    'referer': 'https://ims.enrichcous.com/merchantman/detail/240828045129146',
                    'sec-ch-ua': '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
                    'x-requested-with': 'XMLHttpRequest',
                    'Cookie': this.IMS_COOKIE,
                },
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    }
                    catch (error) {
                        this.logger.error('Error parsing response:', error);
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });
            req.on('error', (error) => {
                this.logger.error('Request error:', error);
                reject(error);
            });
            req.write(postData);
            req.end();
        });
    }
};
exports.ImsProxyService = ImsProxyService;
exports.ImsProxyService = ImsProxyService = ImsProxyService_1 = __decorate([
    (0, common_1.Injectable)()
], ImsProxyService);
//# sourceMappingURL=ims-proxy.service.js.map