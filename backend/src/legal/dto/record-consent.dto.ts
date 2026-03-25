import { IsEmail, IsString } from 'class-validator';

export class RecordConsentDto {
  @IsEmail()
  userEmail: string;

  @IsString()
  documentKey: string;
}
