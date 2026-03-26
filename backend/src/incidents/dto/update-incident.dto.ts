import { IsOptional, IsString } from 'class-validator';

export class UpdateIncidentDto {
  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

