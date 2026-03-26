import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../common/entities/activity.entity';
import { AdolescentProfile } from '../common/entities/adolescent-profile.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ProgressEntry } from '../common/entities/progress-entry.entity';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ProgressEntry)
    private readonly progressRepository: Repository<ProgressEntry>,
    @InjectRepository(ChildProfile)
    private readonly childRepository: Repository<ChildProfile>,
    @InjectRepository(AdolescentProfile)
    private readonly adolescentRepository: Repository<AdolescentProfile>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async getSummary(childId: string) {
    const child = await this.resolveMinor(childId);

    const entries = await this.progressRepository.find({
      where: { childId },
      relations: ['activity'],
      order: { performedAt: 'DESC' },
      take: 20,
    });

    return {
      child,
      minor: child,
      totalPoints: entries.reduce((sum, entry) => sum + entry.pointsEarned, 0),
      completedActivities: entries.length,
      latestEntries: entries,
    };
  }

  async createCheckin(dto: CreateCheckinDto) {
    const child = await this.resolveMinor(dto.childId);

    const activity = await this.activityRepository.findOne({
      where: { id: dto.activityId },
    });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const entry = await this.progressRepository.save(
      this.progressRepository.create({
        childId: child.id,
        activityId: activity.id,
        notes: dto.notes,
        pointsEarned: activity.points,
      }),
    );

    const total = await this.progressRepository
      .createQueryBuilder('progress')
      .select('COALESCE(SUM(progress.pointsEarned), 0)', 'total')
      .where('progress.childId = :childId', { childId: child.id })
      .getRawOne<{ total: string }>();

    return {
      entry,
      child,
      minor: child,
      activity,
      totalPoints: Number(total?.total ?? 0),
    };
  }

  private async resolveMinor(childId: string) {
    const child = await this.childRepository.findOne({ where: { id: childId } });
    if (child) {
      return {
        ...child,
        role: 'child',
      };
    }

    const adolescent = await this.adolescentRepository.findOne({ where: { id: childId } });
    if (adolescent) {
      return {
        ...adolescent,
        role: 'adolescent',
      };
    }

    throw new NotFoundException('Minor profile not found');
  }
}
