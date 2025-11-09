import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
  ) {}

  async create(createNoteDto: CreateNoteDto, userEmail: string, userName?: string): Promise<NoteResponseDto> {
    // Sử dụng noteDate từ DTO nếu có, nếu không thì lấy ngày hiện tại
    const noteDate = createNoteDto.noteDate || new Date().toISOString().split('T')[0];
    
    // Validate: không cho phép tạo note cho ngày quá khứ
    const selectedDate = new Date(noteDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      throw new HttpException(
        'Cannot create notes for past dates. Please select today or a future date.',
        HttpStatus.BAD_REQUEST
      );
    }
    
    // Đảm bảo có userName, nếu không thì dùng phần trước @ của email, hoặc email
    const finalUserName = userName || 
                         (userEmail.includes('@') ? userEmail.split('@')[0] : userEmail) ||
                         'Unknown User';
    
    const note = this.notesRepository.create({
      title: createNoteDto.title,
      content: createNoteDto.content,
      createdBy: userEmail,
      createdByName: finalUserName,
      isRead: false,
      readBy: JSON.stringify([]),
      noteDate: noteDate,
    });

    const savedNote = await this.notesRepository.save(note);
    return this.mapToResponseDto(savedNote);
  }

  private mapToResponseDto(note: Note): NoteResponseDto {
    // Parse readBy với error handling
    let readBy: string[] = [];
    if (note.readBy) {
      try {
        readBy = JSON.parse(note.readBy);
        if (!Array.isArray(readBy)) {
          readBy = [];
        }
      } catch (parseError) {
        console.error('Error parsing readBy in mapToResponseDto:', parseError);
        readBy = [];
      }
    }

    return {
      id: note.id,
      title: note.title,
      content: note.content,
      createdBy: note.createdBy,
      createdByName: note.createdByName || undefined,
      isRead: note.isRead,
      readBy: readBy,
      noteDate: note.noteDate || undefined,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  async findAll(userEmail?: string): Promise<NoteResponseDto[]> {
    const notes = await this.notesRepository.find({
      order: { createdAt: 'DESC' },
    });

    // Parse JSON strings và map to response DTOs
    return notes.map(note => this.mapToResponseDto(note));
  }

  async findUnreadCount(userEmail: string): Promise<number> {
    const allNotes = await this.findAll(userEmail);
    
    // Đếm số notes chưa đọc (readBy không chứa userEmail)
    return allNotes.filter(note => {
      if (!note.readBy || note.readBy.length === 0) {
        return true; // Chưa có ai đọc
      }
      return !note.readBy.includes(userEmail);
    }).length;
  }

  async markAsRead(noteId: number, userEmail: string): Promise<NoteResponseDto> {
    try {
      const note = await this.notesRepository.findOne({ where: { id: noteId } });

      if (!note) {
        throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
      }

      // Parse readBy từ JSON string với error handling
      let readBy: string[] = [];
      if (note.readBy) {
        try {
          readBy = JSON.parse(note.readBy);
          // Đảm bảo readBy là array
          if (!Array.isArray(readBy)) {
            readBy = [];
          }
        } catch (parseError) {
          console.error('Error parsing readBy JSON:', parseError);
          // Nếu parse fail, reset về empty array
          readBy = [];
        }
      }

      // Thêm userEmail vào readBy nếu chưa có
      if (!readBy.includes(userEmail)) {
        readBy.push(userEmail);
        note.readBy = JSON.stringify(readBy);
        note.isRead = readBy.length > 0;
        await this.notesRepository.save(note);
      }

      // Return với parsed arrays
      return this.mapToResponseDto(note);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error in markAsRead:', error);
      throw new HttpException(
        error.message || 'Failed to mark note as read',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async markAllAsRead(userEmail: string): Promise<void> {
    try {
      const allNotes = await this.notesRepository.find({
        order: { createdAt: 'DESC' },
      });
      
      for (const note of allNotes) {
        // Parse readBy từ JSON string với error handling
        let readBy: string[] = [];
        if (note.readBy) {
          try {
            readBy = JSON.parse(note.readBy);
            if (!Array.isArray(readBy)) {
              readBy = [];
            }
          } catch (parseError) {
            console.error('Error parsing readBy in markAllAsRead:', parseError);
            readBy = [];
          }
        }
        
        if (!readBy.includes(userEmail)) {
          readBy.push(userEmail);
          note.readBy = JSON.stringify(readBy);
          note.isRead = readBy.length > 0;
          await this.notesRepository.save(note);
        }
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      throw new HttpException(
        error.message || 'Failed to mark all notes as read',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async verifyOwnership(noteId: number, userEmail: string): Promise<void> {
    const note = await this.notesRepository.findOne({ where: { id: noteId } });
    if (!note) {
      throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
    }
    if (note.createdBy !== userEmail) {
      throw new HttpException('You do not have permission to modify this note', HttpStatus.FORBIDDEN);
    }
  }

  async update(noteId: number, updateNoteDto: UpdateNoteDto, userEmail: string): Promise<NoteResponseDto> {
    try {
      // Verify ownership
      await this.verifyOwnership(noteId, userEmail);

      const note = await this.notesRepository.findOne({ where: { id: noteId } });
      if (!note) {
        throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
      }

      // Update fields
      if (updateNoteDto.title !== undefined) {
        note.title = updateNoteDto.title;
      }
      if (updateNoteDto.content !== undefined) {
        note.content = updateNoteDto.content;
      }

      const savedNote = await this.notesRepository.save(note);
      return this.mapToResponseDto(savedNote);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error in update:', error);
      throw new HttpException(
        error.message || 'Failed to update note',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async remove(id: number): Promise<void> {
    await this.notesRepository.delete(id);
  }
}

