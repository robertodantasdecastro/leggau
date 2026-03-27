import { IsOptional, IsString } from 'class-validator';

export class UpdateInviteDto {
  @IsOptional()
  @IsString()
  status?: string;
}
