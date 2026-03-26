import { IsOptional, IsString } from 'class-validator';

export class UpdateModerationCaseDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  severity?: string;
}

