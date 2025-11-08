import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDateString()
  @IsOptional()
  noteDate?: string; // Optional date, if not provided, use today
}

