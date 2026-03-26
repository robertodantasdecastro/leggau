import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivitiesModule } from './activities/activities.module';
import { AdminModule } from './admin/admin.module';
import { AssetsCatalogModule } from './assets-catalog/assets-catalog.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { Activity } from './common/entities/activity.entity';
import { AdminUser } from './common/entities/admin-user.entity';
import { AdolescentProfile } from './common/entities/adolescent-profile.entity';
import { AppUser } from './common/entities/app-user.entity';
import { AuditEvent } from './common/entities/audit-event.entity';
import { AuthProviderConfig } from './common/entities/auth-provider-config.entity';
import { ChildProfile } from './common/entities/child-profile.entity';
import { BillingPlan } from './common/entities/billing-plan.entity';
import { BillingProvider } from './common/entities/billing-provider.entity';
import { BillingTransaction } from './common/entities/billing-transaction.entity';
import { CareTeamMembership } from './common/entities/care-team-membership.entity';
import { ConsentRecord } from './common/entities/consent-record.entity';
import { DeviceSession } from './common/entities/device-session.entity';
import { ExternalIdentity } from './common/entities/external-identity.entity';
import { GuardianLink } from './common/entities/guardian-link.entity';
import { Incident } from './common/entities/incident.entity';
import { InteractionPolicy } from './common/entities/interaction-policy.entity';
import { Invite } from './common/entities/invite.entity';
import { LegalDocument } from './common/entities/legal-document.entity';
import { ModerationCase } from './common/entities/moderation-case.entity';
import { MediaVerificationJob } from './common/entities/media-verification-job.entity';
import { ParentApproval } from './common/entities/parent-approval.entity';
import { ParentProfile } from './common/entities/parent-profile.entity';
import { PasswordResetToken } from './common/entities/password-reset-token.entity';
import { PolicyVersion } from './common/entities/policy-version.entity';
import { ProgressEntry } from './common/entities/progress-entry.entity';
import { Reward } from './common/entities/reward.entity';
import { TherapistProfile } from './common/entities/therapist-profile.entity';
import { AppSeedService } from './config/app-seed.service';
import { BillingModule } from './billing/billing.module';
import { CareTeamModule } from './care-team/care-team.module';
import { ChildrenModule } from './children/children.module';
import { DATABASE_MIGRATIONS } from './database/migrations';
import { DevicesModule } from './devices/devices.module';
import { FamiliesModule } from './families/families.module';
import { GuardianshipModule } from './guardianship/guardianship.module';
import { HealthModule } from './health/health.module';
import { IdentityProvidersModule } from './identity-providers/identity-providers.module';
import { IncidentsModule } from './incidents/incidents.module';
import { InteractionPoliciesModule } from './interaction-policies/interaction-policies.module';
import { InvitesModule } from './invites/invites.module';
import { LegalModule } from './legal/legal.module';
import { MediaVerificationModule } from './media-verification/media-verification.module';
import { ParentApprovalsModule } from './parent-approvals/parent-approvals.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { PolicyVersionsModule } from './policy-versions/policy-versions.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ProgressModule } from './progress/progress.module';
import { RedisModule } from './redis/redis.module';
import { RewardsModule } from './rewards/rewards.module';
import { SessionsModule } from './sessions/sessions.module';
import { ModerationModule } from './moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST');
        const port = Number(configService.get<string>('DB_PORT') ?? '5432');

        if (host) {
          return {
            type: 'postgres' as const,
            host,
            port,
            username: configService.get<string>('DB_USER'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_NAME'),
            autoLoadEntities: true,
            synchronize: false,
            migrations: DATABASE_MIGRATIONS,
            migrationsRun: true,
          };
        }

        return {
          type: 'sqljs' as const,
          autoLoadEntities: true,
          synchronize: true,
          autoSave: false,
          location: 'leggau-dev',
        };
      },
    }),
    TypeOrmModule.forFeature([
      ParentProfile,
      ChildProfile,
      AdolescentProfile,
      Activity,
      Reward,
      ProgressEntry,
      AppUser,
      AdminUser,
      LegalDocument,
      ConsentRecord,
      AuthProviderConfig,
      GuardianLink,
      CareTeamMembership,
      DeviceSession,
      ExternalIdentity,
      PasswordResetToken,
      AuditEvent,
      InteractionPolicy,
      PolicyVersion,
      ModerationCase,
      Incident,
      MediaVerificationJob,
      Invite,
      ParentApproval,
      TherapistProfile,
      BillingProvider,
      BillingPlan,
      BillingTransaction,
    ]),
    RedisModule,
    HealthModule,
    AuthModule,
    AuditModule,
    LegalModule,
    BillingModule,
    ChildrenModule,
    AdminModule,
    ProfilesModule,
    FamiliesModule,
    ActivitiesModule,
    RewardsModule,
    ProgressModule,
    AssetsCatalogModule,
    SessionsModule,
    DevicesModule,
    IdentityProvidersModule,
    PasswordResetModule,
    GuardianshipModule,
    CareTeamModule,
    InvitesModule,
    ParentApprovalsModule,
    PolicyVersionsModule,
    InteractionPoliciesModule,
    ModerationModule,
    IncidentsModule,
    MediaVerificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppSeedService],
})
export class AppModule {}
