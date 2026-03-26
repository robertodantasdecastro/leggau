import {
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertAuthProviderConfigDto {
  @IsString()
  @IsIn(['google', 'apple'])
  provider: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['mock', 'live'])
  verificationMode?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  privateKey?: string;

  @IsOptional()
  @IsString()
  issuer?: string;

  @IsOptional()
  @IsString()
  jwksUrl?: string;

  @IsOptional()
  @IsArray()
  allowedAudiences?: string[];

  @IsOptional()
  @IsArray()
  scopes?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
