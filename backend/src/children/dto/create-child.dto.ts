import { IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateChildDto {
  @IsEmail()
  parentEmail: string;

  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  @Max(17)
  age: number;

  @IsOptional()
  @IsString()
  avatar?: string;
}
