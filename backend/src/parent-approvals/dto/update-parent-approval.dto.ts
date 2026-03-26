import { IsOptional, IsString } from 'class-validator';

export class UpdateParentApprovalDto {
  @IsOptional()
  @IsString()
  decision?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

