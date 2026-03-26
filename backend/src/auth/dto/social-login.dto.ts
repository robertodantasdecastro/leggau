import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SocialLoginDto {
  @IsString()
  @IsIn(['google', 'apple'])
  provider: string;

  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  mockSubject?: string;

  @IsOptional()
  @IsString()
  @IsIn(['parent_guardian', 'therapist'])
  role?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsObject()
  profileDraft?: Record<string, string | number | boolean | null>;
}
