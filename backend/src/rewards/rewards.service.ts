import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressEntry } from '../common/entities/progress-entry.entity';
import { Reward } from '../common/entities/reward.entity';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(ProgressEntry)
    private readonly progressRepository: Repository<ProgressEntry>,
  ) {}

  async list(childId?: string) {
    const rewards = await this.rewardRepository.find({
      order: { cost: 'ASC' },
    });

    let totalPoints = '0';

    if (childId) {
      const aggregate = await this.progressRepository
        .createQueryBuilder('progress')
        .select('COALESCE(SUM(progress.pointsEarned), 0)', 'total')
        .where('progress.childId = :childId', { childId })
        .getRawOne<{ total: string }>();

      totalPoints = aggregate?.total ?? '0';
    }

    const availablePoints = Number(totalPoints);

    return {
      availablePoints,
      items: rewards.map((reward) => ({
        ...reward,
        unlocked: availablePoints >= reward.cost,
      })),
    };
  }
}
