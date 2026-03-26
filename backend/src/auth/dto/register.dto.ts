import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

type RegisterRole = 'parent_guardian' | 'therapist';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsIn(['parent_guardian', 'therapist'])
  role?: RegisterRole;

  @IsOptional()
  @IsObject()
  profileDraft?: Record<string, string | number | boolean | null>;
}
