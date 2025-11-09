import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content?: string;
}

