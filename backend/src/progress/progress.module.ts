import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../common/entities/activity.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ProgressEntry } from '../common/entities/progress-entry.entity';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProgressEntry, ChildProfile, Activity])],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
