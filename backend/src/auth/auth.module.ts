import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityProvidersModule } from '../identity-providers/identity-providers.module';
import { AppUser } from '../common/entities/app-user.entity';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { CareTeamMembership } from '../common/entities/care-team-membership.entity';
import { ConsentRecord } from '../common/entities/consent-record.entity';
import { DeviceSession } from '../common/entities/device-session.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { PasswordResetToken } from '../common/entities/password-reset-token.entity';
import { PolicyVersion } from '../common/entities/policy-version.entity';
import { TherapistProfile } from '../common/entities/therapist-profile.entity';
import { SessionStoreService } from '../common/session-store.service';
import { AppTokenGuard } from './app-token.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    IdentityProvidersModule,
    TypeOrmModule.forFeature([
      AppUser,
      ParentProfile,
      TherapistProfile,
      DeviceSession,
      PasswordResetToken,
      AuditEvent,
      PolicyVersion,
      ConsentRecord,
      GuardianLink,
      CareTeamMembership,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionStoreService, AppTokenGuard],
  exports: [AuthService, SessionStoreService, AppTokenGuard],
})
export class AuthModule {}
