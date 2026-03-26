import { IsOptional, IsString } from 'class-validator';

export class CreateGuardianLinkDto {
  @IsString()
  parentProfileId: string;

  @IsString()
  parentUserId: string;

  @IsString()
  minorProfileId: string;

  @IsString()
  minorRole: string;

  @IsOptional()
  @IsString()
  statusIntent?: string;
}

