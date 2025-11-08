export class NoteResponseDto {
  id: number;
  title: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  isRead: boolean;
  readBy: string[];
  noteDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

