import { IsEmail, IsISO8601, IsObject, IsOptional, IsString } from 'class-validator';

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

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
