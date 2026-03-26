import { IsOptional, IsString } from 'class-validator';

export class UpdateGuardianLinkDto {
  @IsOptional()
  @IsString()
  status?: string;
}

