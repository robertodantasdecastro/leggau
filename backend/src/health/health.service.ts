import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../common/entities/activity.entity';
import { AdminUser } from '../common/entities/admin-user.entity';
import { AppUser } from '../common/entities/app-user.entity';
import { BillingProvider } from '../common/entities/billing-provider.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { LegalDocument } from '../common/entities/legal-document.entity';
import { ProgressEntry } from '../common/entities/progress-entry.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(ChildProfile)
    private readonly childRepository: Repository<ChildProfile>,
    @InjectRepository(ProgressEntry)
    private readonly progressRepository: Repository<ProgressEntry>,
    @InjectRepository(LegalDocument)
    private readonly legalDocumentRepository: Repository<LegalDocument>,
    @InjectRepository(BillingProvider)
    private readonly billingProviderRepository: Repository<BillingProvider>,
  ) {}

  async getStatus() {
    const redis = await this.redisService.ping();
    const [
      activities,
      appUsers,
      adminUsers,
      children,
      progressEntries,
      legalDocuments,
      billingProviders,
    ] = await Promise.all([
      this.activityRepository.count(),
      this.appUserRepository.count(),
      this.adminUserRepository.count(),
      this.childRepository.count(),
      this.progressRepository.count(),
      this.legalDocumentRepository.count(),
      this.billingProviderRepository.count(),
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
        appUsers,
        adminUsers,
        children,
        progressEntries,
        legalDocuments,
        billingProviders,
      },
    };
  }
}
