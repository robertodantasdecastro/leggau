import { IsOptional, IsString } from 'class-validator';

export class CreateParentApprovalDto {
  @IsString()
  approvalType: string;

  @IsString()
  targetId: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

