import { IsString, IsNotEmpty } from 'class-validator';

export class SyncCallLogsManualDto {
  @IsString()
  @IsNotEmpty()
  passcode: string;
}

