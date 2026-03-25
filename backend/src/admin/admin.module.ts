import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingModule } from '../billing/billing.module';
import { AppUser } from '../common/entities/app-user.entity';
import { AdminUser } from '../common/entities/admin-user.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { FamiliesModule } from '../families/families.module';
import { HealthModule } from '../health/health.module';
import { LegalModule } from '../legal/legal.module';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminTokenGuard } from './admin-token.guard';

@Module({
  imports: [
    AuthModule,
    BillingModule,
    FamiliesModule,
    HealthModule,
    LegalModule,
    TypeOrmModule.forFeature([AppUser, AdminUser, ParentProfile, ChildProfile]),
  ],
  controllers: [AdminAuthController, AdminController],
  providers: [AdminAuthService, AdminService, AdminTokenGuard],
  exports: [AdminAuthService],
})
export class AdminModule {}
