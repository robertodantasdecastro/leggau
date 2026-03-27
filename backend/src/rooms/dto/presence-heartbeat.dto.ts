import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PresenceHeartbeatDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  minorProfileId: string;

  @IsOptional()
  @IsString()
  @IsIn(['child', 'adolescent'])
  activeShell?: string;
}
