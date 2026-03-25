import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpsertBillingPlanDto {
  @IsString()
  code: string;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsInt()
  @Min(0)
  amountCents: number;

  @IsOptional()
  @IsString()
  interval?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
