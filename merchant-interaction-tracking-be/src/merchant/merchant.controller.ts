import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req, UnauthorizedException, HttpException, HttpStatus, Put, Header } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { UpdateSupportNoteDto } from './dto/update-support-note.dto';
import { SyncCallLogsManualDto } from './dto/sync-call-logs-manual.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { appConfig } from '../config/app.config';

@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createMerchantDto: CreateMerchantDto, @Req() req: any) {
    const email = req?.user?.email || 'unknown@mangoforsalon.com';
    return this.merchantService.create(createMerchantDto, email);
  }

  @Get()
  findAll() {
    return this.merchantService.findAll();
  }

  @Get('call-logs-sheets')
  @UseGuards(JwtAuthGuard)
  async getCallLogsSheets() {
    try {
      const sheets = await this.merchantService.getCallLogsSheets();
      return { sheets };
    } catch (error: any) {
      console.error('[MerchantController] Error getting call logs sheets:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Internal server error',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.merchantService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMerchantDto: UpdateMerchantDto, @Req() req: any) {
    // Nếu có updatedBy trong body thì dùng nó, nếu không thì dùng email từ user
    const { updatedBy, ...merchantData } = updateMerchantDto;
    const by = updatedBy || req?.user?.email || 'unknown@mangoforsalon.com';
    
    console.log(`[MerchantController] Update request:`, {
      id,
      updatedBy: by,
      data: merchantData,
      lastInteractionDate: merchantData.lastInteractionDate,
      isMiUpdated: merchantData.isMiUpdated,
      isMiUpdatedType: typeof merchantData.isMiUpdated
    });
    
    return this.merchantService.update(id, merchantData, by);
  }

  @Patch(':id/support-note')
  @UseGuards(JwtAuthGuard)
  async addSupportNote(@Param('id', ParseIntPipe) id: number, @Body() updateSupportNoteDto: UpdateSupportNoteDto, @Req() req: any) {
    try {
      const userEmail = req?.user?.email || 'unknown@mangoforsalon.com';
      const userName = req?.user?.name || 
                      req?.user?.given_name || 
                      req?.user?.givenName ||
                      req?.user?.fullName ||
                      req?.user?.displayName ||
                      (userEmail.includes('@') ? userEmail.split('@')[0] : userEmail);
      
      // Use provided content, createdBy, createdAt, or defaults
      const noteContent = updateSupportNoteDto.content;
      const createdBy = updateSupportNoteDto.createdBy || userName;
      const createdAt = updateSupportNoteDto.createdAt || new Date().toISOString();
      
      return await this.merchantService.addSupportNote(id, noteContent, createdBy, userEmail);
    } catch (error: any) {
      console.error('[MerchantController] Error adding support note:', error);
      throw new HttpException(
        error.message || 'Failed to add support note',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.merchantService.remove(id);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncMerchants(@Req() req: any) {
    const email = req?.user?.email || 'unknown@mangoforsalon.com';
    return this.merchantService.syncMerchantsFromExternal(email);
  }

  @Post('sync-call-logs')
  @UseGuards(JwtAuthGuard)
  async syncCallLogs(@Req() req: any) {
    const email = req?.user?.email || 'unknown@mangoforsalon.com';
    return this.merchantService.syncCallLogs(email);
  }

  @Post('webhook/sync-call-logs')
  async webhookSyncCallLogs(@Body() body: { secret?: string; sheetName?: string }, @Req() req: any) {
    try {
      // Validate webhook secret (optional but recommended for security)
      const expectedSecret = process.env.WEBHOOK_SECRET || appConfig.passcode;
      if (body.secret && body.secret !== expectedSecret) {
        throw new UnauthorizedException('Invalid webhook secret');
      }

      const userEmail = 'system@mangoforsalon.com';
      const sheetName = body.sheetName; // Optional: specific sheet name (for logging)
      
      console.log(`[Webhook] Received real-time sync request${sheetName ? ` for sheet: ${sheetName}` : ' (latest sheet)'}`);
      
      // Sync from latest sheet (real-time sync always syncs from the latest sheet)
      // The sheetName parameter is just for logging purposes
      const result = await this.merchantService.syncCallLogs(userEmail);
      
      console.log(`[Webhook] Real-time sync completed:`, result);
      return {
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[Webhook] Error in real-time sync:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Internal server error',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync-call-logs-manual')
  @UseGuards(JwtAuthGuard)
  async syncCallLogsManual(@Body() dto: SyncCallLogsManualDto, @Req() req: any) {
    try {
      // Validate passcode
      if (!dto || !dto.passcode) {
        throw new UnauthorizedException('Passcode is required');
      }
      
      if (dto.passcode !== appConfig.passcode) {
        throw new UnauthorizedException('Invalid passcode');
      }
      
      const email = req?.user?.email || 'unknown@mangoforsalon.com';
      console.log(`[MerchantController] Starting manual sync for user: ${email}`, dto.selectedSheets ? `with selected sheets: ${dto.selectedSheets.join(', ')}` : 'with all sheets');
      const result = await this.merchantService.syncAllCallLogs(email, dto.selectedSheets);
      console.log(`[MerchantController] Manual sync completed:`, result);
      return result;
    } catch (error: any) {
      console.error('[MerchantController] Error in syncCallLogsManual:', error);
      console.error('[MerchantController] Error stack:', error?.stack);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Convert other errors to HttpException
      const errorMessage = error?.message || 'Internal server error';
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('migrate-mi-version')
  @UseGuards(JwtAuthGuard)
  async migrateMiVersion(@Body() body: { passcode?: string; defaultVersion?: string }, @Req() req: any) {
    try {
      // Validate passcode
      if (!body || !body.passcode) {
        throw new UnauthorizedException('Passcode is required');
      }
      
      if (body.passcode !== appConfig.passcode) {
        throw new UnauthorizedException('Invalid passcode');
      }
      
      const defaultVersion = body.defaultVersion || '11042025';
      const email = req?.user?.email || 'unknown@mangoforsalon.com';
      
      console.log(`[MerchantController] Starting MI version migration for user: ${email}, default version: ${defaultVersion}`);
      const result = await this.merchantService.migrateMiVersionToJson(defaultVersion);
      console.log(`[MerchantController] MI version migration completed:`, result);
      return result;
    } catch (error: any) {
      console.error('[MerchantController] Error in migrateMiVersion:', error);
      console.error('[MerchantController] Error stack:', error?.stack);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Convert other errors to HttpException
      const errorMessage = error?.message || 'Internal server error';
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
