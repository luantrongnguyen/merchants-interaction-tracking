import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  createdBy: string; // Email của supporter tạo note

  @Column({ nullable: true })
  createdByName: string; // Tên của supporter

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'text', nullable: true })
  readBy: string | null; // JSON string của danh sách email users đã đọc

  @Column({ type: 'date', nullable: true })
  noteDate: string | null; // Ngày của note (có thể khác với createdAt)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

