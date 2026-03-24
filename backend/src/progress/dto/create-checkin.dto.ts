import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCheckinDto {
  @IsUUID()
  childId: string;

  @IsUUID()
  activityId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
