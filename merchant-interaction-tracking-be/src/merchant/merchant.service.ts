import { Injectable } from '@nestjs/common';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class MerchantService {
  constructor(
    private googleSheetsService: GoogleSheetsService,
  ) {}

  async create(createMerchantDto: CreateMerchantDto): Promise<any> {
    await this.googleSheetsService.addMerchant(createMerchantDto);
    return createMerchantDto;
  }

  async findAll(): Promise<any[]> {
    return await this.googleSheetsService.getMerchants();
  }

  async findOne(id: number): Promise<any> {
    const merchants = await this.googleSheetsService.getMerchants();
    return merchants.find(merchant => merchant.id === id);
  }

  async update(id: number, updateMerchantDto: UpdateMerchantDto): Promise<any> {
    await this.googleSheetsService.updateMerchant(id, updateMerchantDto);
    return updateMerchantDto;
  }

  async remove(id: number): Promise<void> {
    await this.googleSheetsService.deleteMerchant(id);
  }
}
