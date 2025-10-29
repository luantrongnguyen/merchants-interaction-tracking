import { Injectable } from '@nestjs/common';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class MerchantService {
  constructor(
    private googleSheetsService: GoogleSheetsService,
  ) {}

  async create(createMerchantDto: CreateMerchantDto, userEmail: string): Promise<any> {
    await this.googleSheetsService.addMerchant(createMerchantDto, { by: userEmail });
    return createMerchantDto;
  }

  async findAll(): Promise<any[]> {
    return await this.googleSheetsService.getMerchants();
  }

  async findOne(id: number): Promise<any> {
    const merchants = await this.googleSheetsService.getMerchants();
    return merchants.find(merchant => merchant.id === id);
  }

  async update(id: number, updateMerchantDto: UpdateMerchantDto, userEmail: string): Promise<any> {
    await this.googleSheetsService.updateMerchant(id, updateMerchantDto, { by: userEmail });
    return updateMerchantDto;
  }

  async remove(id: number): Promise<void> {
    await this.googleSheetsService.deleteMerchant(id);
  }
}
