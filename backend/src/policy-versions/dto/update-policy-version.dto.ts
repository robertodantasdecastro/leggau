import { IsOptional, IsString } from 'class-validator';

export class UpdatePolicyVersionDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  supersededBy?: string;
}

