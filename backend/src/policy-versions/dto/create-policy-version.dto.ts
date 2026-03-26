import { IsString } from 'class-validator';

export class CreatePolicyVersionDto {
  @IsString()
  policyKey: string;

  @IsString()
  version: string;

  @IsString()
  title: string;

  @IsString()
  audience: string;

  @IsString()
  contentMarkdown: string;
}

