import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertBillingProviderDto {
  @IsString()
  code: string;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  apiBaseUrl?: string;

  @IsOptional()
  @IsString()
  dashboardUrl?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, string | number | boolean>;
}
