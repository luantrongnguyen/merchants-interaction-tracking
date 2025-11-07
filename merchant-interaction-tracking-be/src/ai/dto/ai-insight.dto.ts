import { IsString } from 'class-validator';

export class AIInsightDto {
  @IsString()
  question: string;
}

