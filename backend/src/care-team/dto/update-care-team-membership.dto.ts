import { IsOptional, IsString } from 'class-validator';

export class UpdateCareTeamMembershipDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  adminApprovalStatus?: string;

  @IsOptional()
  @IsString()
  parentApprovalStatus?: string;
}

