import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateInviteDto {
  @IsString()
  inviteType: string;

  @IsEmail()
  targetEmail: string;

  @IsOptional()
  @IsString()
  targetActorRole?: string;

  @IsOptional()
  @IsString()
  minorProfileId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
