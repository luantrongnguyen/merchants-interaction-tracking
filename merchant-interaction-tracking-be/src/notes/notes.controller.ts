import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async create(@Body() createNoteDto: CreateNoteDto, @Request() req) {
    const userEmail = req.user?.email || req.user?.sub || 'unknown';
    const userName = req.user?.name || req.user?.given_name || undefined;
    return await this.notesService.create(createNoteDto, userEmail, userName);
  }

  @Get()
  async findAll(@Request() req) {
    const userEmail = req.user?.email || req.user?.sub || undefined;
    return await this.notesService.findAll(userEmail);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userEmail = req.user?.email || req.user?.sub;
    if (!userEmail) {
      return { count: 0 };
    }
    const count = await this.notesService.findUnreadCount(userEmail);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const userEmail = req.user?.email || req.user?.sub;
    if (!userEmail) {
      throw new Error('User email not found');
    }
    return await this.notesService.markAsRead(+id, userEmail);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Request() req) {
    const userEmail = req.user?.email || req.user?.sub;
    if (!userEmail) {
      throw new Error('User email not found');
    }
    await this.notesService.markAllAsRead(userEmail);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.notesService.remove(+id);
    return { success: true };
  }
}

