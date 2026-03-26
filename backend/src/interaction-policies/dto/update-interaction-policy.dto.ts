import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateInteractionPolicyDto {
  @IsOptional()
  @IsBoolean()
  roomsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  presenceEnabled?: boolean;

  @IsOptional()
  @IsString()
  messagingMode?: string;

  @IsOptional()
  @IsBoolean()
  therapistParticipationAllowed?: boolean;
}

