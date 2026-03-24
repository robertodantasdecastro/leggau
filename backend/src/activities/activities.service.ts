import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../common/entities/activity.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ActivitiesService {
  private readonly cacheKey = 'activities:list';

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    private readonly redisService: RedisService,
  ) {}

  async list() {
    const cached = await this.redisService.getJson<Activity[]>(this.cacheKey);
    if (cached) {
      return {
        source: 'cache',
        items: cached,
      };
    }

    const items = await this.activityRepository.find({
      where: { active: true },
      order: { title: 'ASC' },
    });

    await this.redisService.cacheJson(this.cacheKey, items, 120);

    return {
      source: 'database',
      items,
    };
  }
}
