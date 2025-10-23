"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMerchantDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_merchant_dto_1 = require("./create-merchant.dto");
class UpdateMerchantDto extends (0, mapped_types_1.PartialType)(create_merchant_dto_1.CreateMerchantDto) {
}
exports.UpdateMerchantDto = UpdateMerchantDto;
//# sourceMappingURL=update-merchant.dto.js.map