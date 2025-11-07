import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ImsProxyService } from './ims-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/ims')
@UseGuards(JwtAuthGuard)
export class ImsProxyController {
  constructor(private readonly imsProxyService: ImsProxyService) {}

  @Get('transactions/:storeId')
  async getTransactionByStoreCode(@Param('storeId') storeId: string) {
    try {
      const result = await this.imsProxyService.getTransactionByStoreCode(storeId);
      return result;
    } catch (error) {
      throw error;
    }
  }
}



