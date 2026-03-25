import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../common/entities/activity.entity';
import { AdminUser } from '../common/entities/admin-user.entity';
import { AppUser } from '../common/entities/app-user.entity';
import { BillingProvider } from '../common/entities/billing-provider.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { LegalDocument } from '../common/entities/legal-document.entity';
import { ProgressEntry } from '../common/entities/progress-entry.entity';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      AppUser,
      AdminUser,
      BillingProvider,
      ChildProfile,
      LegalDocument,
      ProgressEntry,
    ]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
