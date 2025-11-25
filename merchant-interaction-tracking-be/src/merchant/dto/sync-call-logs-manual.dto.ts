import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class SyncCallLogsManualDto {
  @IsString()
  @IsNotEmpty()
  passcode: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedSheets?: string[];
}

