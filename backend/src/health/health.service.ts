import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../common/entities/activity.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ProgressEntry } from '../common/entities/progress-entry.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ChildProfile)
    private readonly childRepository: Repository<ChildProfile>,
    @InjectRepository(ProgressEntry)
    private readonly progressRepository: Repository<ProgressEntry>,
  ) {}

  async getStatus() {
    const redis = await this.redisService.ping();
    const [activities, children, progressEntries] = await Promise.all([
      this.activityRepository.count(),
      this.childRepository.count(),
      this.progressRepository.count(),
    ]);

    return {
      service: 'leggau-api',
      status: 'ok',
      dependencies: {
        database: 'ok',
        redis,
      },
      stats: {
        activities,
        children,
        progressEntries,
      },
    };
  }
}
