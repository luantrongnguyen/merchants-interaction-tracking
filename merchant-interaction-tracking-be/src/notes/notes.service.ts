import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
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
    
    const note = this.notesRepository.create({
      title: createNoteDto.title,
      content: createNoteDto.content,
      createdBy: userEmail,
      createdByName: userName || userEmail,
      isRead: false,
      readBy: JSON.stringify([]),
      noteDate: noteDate,
    });

    const savedNote = await this.notesRepository.save(note);
    return this.mapToResponseDto(savedNote);
  }

  private mapToResponseDto(note: Note): NoteResponseDto {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      createdBy: note.createdBy,
      createdByName: note.createdByName || undefined,
      isRead: note.isRead,
      readBy: note.readBy ? JSON.parse(note.readBy) : [],
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
    const note = await this.notesRepository.findOne({ where: { id: noteId } });

    if (!note) {
      throw new Error('Note not found');
    }

    // Parse readBy từ JSON string
    let readBy: string[] = note.readBy ? JSON.parse(note.readBy) : [];

    // Thêm userEmail vào readBy nếu chưa có
    if (!readBy.includes(userEmail)) {
      readBy.push(userEmail);
      note.readBy = JSON.stringify(readBy);
      note.isRead = readBy.length > 0;
      await this.notesRepository.save(note);
    }

    // Return với parsed arrays
    return this.mapToResponseDto(note);
  }

  async markAllAsRead(userEmail: string): Promise<void> {
    const allNotes = await this.notesRepository.find({
      order: { createdAt: 'DESC' },
    });
    
    for (const note of allNotes) {
      // Parse readBy từ JSON string
      let readBy: string[] = note.readBy ? JSON.parse(note.readBy) : [];
      
      if (!readBy.includes(userEmail)) {
        readBy.push(userEmail);
        note.readBy = JSON.stringify(readBy);
        note.isRead = readBy.length > 0;
        await this.notesRepository.save(note);
      }
    }
  }

  async remove(id: number): Promise<void> {
    await this.notesRepository.delete(id);
  }
}

