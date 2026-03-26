import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateInviteDto {
  @IsString()
  inviteType: string;

  @IsEmail()
  targetEmail: string;

  @IsOptional()
  @IsString()
  minorProfileId?: string;
}

