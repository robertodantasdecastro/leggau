import { IsOptional, IsString } from 'class-validator';

export class CreateCareTeamMembershipDto {
  @IsString()
  therapistUserId: string;

  @IsOptional()
  @IsString()
  therapistProfileId?: string;

  @IsString()
  parentUserId: string;

  @IsString()
  parentProfileId: string;

  @IsString()
  minorProfileId: string;

  @IsString()
  minorRole: string;

  @IsOptional()
  scope?: Record<string, unknown>;
}

