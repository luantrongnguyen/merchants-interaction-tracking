import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Patch, HttpException, HttpStatus, Put } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async create(@Body() createNoteDto: CreateNoteDto, @Request() req) {
    const userEmail = req.user?.email || req.user?.sub;
    if (!userEmail) {
      throw new HttpException('User email not found', HttpStatus.UNAUTHORIZED);
    }
    
    // Lấy name từ user object, nếu không có thì dùng phần trước @ của email
    const userName = req.user?.name || 
                     req.user?.given_name || 
                     req.user?.givenName ||
                     req.user?.fullName ||
                     req.user?.displayName ||
                     (userEmail.includes('@') ? userEmail.split('@')[0] : userEmail);
    
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
    try {
      const userEmail = req.user?.email || req.user?.sub;
      if (!userEmail) {
        throw new HttpException('User email not found', HttpStatus.UNAUTHORIZED);
      }
      const noteId = parseInt(id, 10);
      if (isNaN(noteId)) {
        throw new HttpException('Invalid note ID', HttpStatus.BAD_REQUEST);
      }
      return await this.notesService.markAsRead(noteId, userEmail);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error marking note as read:', error);
      throw new HttpException(
        error.message || 'Failed to mark note as read',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto, @Request() req) {
    try {
      const userEmail = req.user?.email || req.user?.sub;
      if (!userEmail) {
        throw new HttpException('User email not found', HttpStatus.UNAUTHORIZED);
      }
      const noteId = parseInt(id, 10);
      if (isNaN(noteId)) {
        throw new HttpException('Invalid note ID', HttpStatus.BAD_REQUEST);
      }
      return await this.notesService.update(noteId, updateNoteDto, userEmail);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error updating note:', error);
      throw new HttpException(
        error.message || 'Failed to update note',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    try {
      const userEmail = req.user?.email || req.user?.sub;
      if (!userEmail) {
        throw new HttpException('User email not found', HttpStatus.UNAUTHORIZED);
      }
      const noteId = parseInt(id, 10);
      if (isNaN(noteId)) {
        throw new HttpException('Invalid note ID', HttpStatus.BAD_REQUEST);
      }
      // Verify ownership trước khi delete
      await this.notesService.verifyOwnership(noteId, userEmail);
      await this.notesService.remove(noteId);
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error deleting note:', error);
      throw new HttpException(
        error.message || 'Failed to delete note',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

