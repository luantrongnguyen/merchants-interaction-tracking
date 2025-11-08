export interface Note {
  id: number;
  title: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  isRead: boolean;
  readBy: string[];
  noteDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
}

