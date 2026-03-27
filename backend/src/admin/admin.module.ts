import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingModule } from '../billing/billing.module';
import { AppUser } from '../common/entities/app-user.entity';
import { AdminUser } from '../common/entities/admin-user.entity';
import { AdolescentProfile } from '../common/entities/adolescent-profile.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ExternalIdentity } from '../common/entities/external-identity.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { TherapistProfile } from '../common/entities/therapist-profile.entity';
import { FamiliesModule } from '../families/families.module';
import { HealthModule } from '../health/health.module';
import { IdentityProvidersModule } from '../identity-providers/identity-providers.module';
import { InteractionPoliciesModule } from '../interaction-policies/interaction-policies.module';
import { InvitesModule } from '../invites/invites.module';
import { LegalModule } from '../legal/legal.module';
import { MediaVerificationModule } from '../media-verification/media-verification.module';
import { RoomsModule } from '../rooms/rooms.module';
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
    IdentityProvidersModule,
    InteractionPoliciesModule,
    InvitesModule,
    LegalModule,
    MediaVerificationModule,
    RoomsModule,
    TypeOrmModule.forFeature([
      AppUser,
      AdminUser,
      ParentProfile,
      ChildProfile,
      AdolescentProfile,
      TherapistProfile,
      ExternalIdentity,
    ]),
  ],
  controllers: [AdminAuthController, AdminController],
  providers: [AdminAuthService, AdminService, AdminTokenGuard],
  exports: [AdminAuthService, AdminTokenGuard],
})
export class AdminModule {}
