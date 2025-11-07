import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { SyncCallLogsManualDto } from './dto/sync-call-logs-manual.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { appConfig } from '../config/app.config';

@Controller('merchants')
@UseGuards(JwtAuthGuard)
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post()
  create(@Body() createMerchantDto: CreateMerchantDto, @Req() req: any) {
    const email = req?.user?.email || 'unknown@mangoforsalon.com';
    return this.merchantService.create(createMerchantDto, email);
  }

  @Get()
  findAll() {
    return this.merchantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.merchantService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMerchantDto: UpdateMerchantDto, @Req() req: any) {
    // Nếu có updatedBy trong body thì dùng nó, nếu không thì dùng email từ user
    const { updatedBy, ...merchantData } = updateMerchantDto;
    const by = updatedBy || req?.user?.email || 'unknown@mangoforsalon.com';
    
    console.log(`[MerchantController] Update request:`, {
      id,
      updatedBy: by,
      data: merchantData,
      lastInteractionDate: merchantData.lastInteractionDate
    });
    
    return this.merchantService.update(id, merchantData, by);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.merchantService.remove(id);
  }

  @Post('sync')
  async syncMerchants(@Req() req: any) {
    const email = req?.user?.email || 'unknown@mangoforsalon.com';
    return this.merchantService.syncMerchantsFromExternal(email);
  }

  @Post('sync-call-logs')
  async syncCallLogs(@Req() req: any) {
    const email = req?.user?.email || 'unknown@mangoforsalon.com';
    return this.merchantService.syncCallLogs(email);
  }

  @Post('sync-call-logs-manual')
  async syncCallLogsManual(@Body() dto: SyncCallLogsManualDto, @Req() req: any) {
    // Validate passcode
    if (dto.passcode !== appConfig.passcode) {
      throw new UnauthorizedException('Invalid passcode');
    }
    
    const email = req?.user?.email || 'unknown@mangoforsalon.com';
    return this.merchantService.syncAllCallLogs(email);
  }
}
