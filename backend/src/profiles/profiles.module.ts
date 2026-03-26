import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUser } from '../common/entities/app-user.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { TherapistProfile } from '../common/entities/therapist-profile.entity';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppUser, ParentProfile, TherapistProfile])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
