import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateSupportNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string; // Content of the note
  
  @IsString()
  @IsOptional()
  createdBy?: string; // Name of the person creating the note
  
  @IsString()
  @IsOptional()
  createdAt?: string; // ISO timestamp, defaults to now
}

