import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RoomActionDto {
  @IsString()
  @IsNotEmpty()
  minorProfileId: string;

  @IsOptional()
  @IsString()
  @IsIn(['child', 'adolescent'])
  activeShell?: string;
}
