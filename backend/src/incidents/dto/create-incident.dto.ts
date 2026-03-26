import { IsOptional, IsString } from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  severity: string;

  @IsString()
  sourceType: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsString()
  summary: string;
}

