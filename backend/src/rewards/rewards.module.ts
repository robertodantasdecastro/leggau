import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressEntry } from '../common/entities/progress-entry.entity';
import { Reward } from '../common/entities/reward.entity';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reward, ProgressEntry])],
  controllers: [RewardsController],
  providers: [RewardsService],
})
export class RewardsModule {}
