import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateModerationCaseDto {
  @IsString()
  sourceType: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  policyCode?: string;

  @IsOptional()
  @IsBoolean()
  humanReviewRequired?: boolean;

  @IsOptional()
  @IsObject()
  aiDecision?: Record<string, unknown>;
}
