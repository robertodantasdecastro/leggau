import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Activity } from './common/entities/activity.entity';
import { AdminUser } from './common/entities/admin-user.entity';
import { AdolescentProfile } from './common/entities/adolescent-profile.entity';
import { AppUser } from './common/entities/app-user.entity';
import { AuditEvent } from './common/entities/audit-event.entity';
import { BillingPlan } from './common/entities/billing-plan.entity';
import { BillingProvider } from './common/entities/billing-provider.entity';
import { BillingTransaction } from './common/entities/billing-transaction.entity';
import { CareTeamMembership } from './common/entities/care-team-membership.entity';
import { ChildProfile } from './common/entities/child-profile.entity';
import { ConsentRecord } from './common/entities/consent-record.entity';
import { DeviceSession } from './common/entities/device-session.entity';
import { GuardianLink } from './common/entities/guardian-link.entity';
import { Incident } from './common/entities/incident.entity';
import { InteractionPolicy } from './common/entities/interaction-policy.entity';
import { Invite } from './common/entities/invite.entity';
import { LegalDocument } from './common/entities/legal-document.entity';
import { ModerationCase } from './common/entities/moderation-case.entity';
import { ParentApproval } from './common/entities/parent-approval.entity';
import { ParentProfile } from './common/entities/parent-profile.entity';
import { PasswordResetToken } from './common/entities/password-reset-token.entity';
import { PolicyVersion } from './common/entities/policy-version.entity';
import { ProgressEntry } from './common/entities/progress-entry.entity';
import { Reward } from './common/entities/reward.entity';
import { TherapistProfile } from './common/entities/therapist-profile.entity';
import { DATABASE_MIGRATIONS } from './database/migrations';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER ?? 'leggau',
  password: process.env.DB_PASSWORD ?? 'leggau',
  database: process.env.DB_NAME ?? 'leggau',
  entities: [
    Activity,
    AdminUser,
    AdolescentProfile,
    AppUser,
    AuditEvent,
    BillingPlan,
    BillingProvider,
    BillingTransaction,
    CareTeamMembership,
    ChildProfile,
    ConsentRecord,
    DeviceSession,
    GuardianLink,
    Incident,
    InteractionPolicy,
    Invite,
    LegalDocument,
    ModerationCase,
    ParentApproval,
    ParentProfile,
    PasswordResetToken,
    PolicyVersion,
    ProgressEntry,
    Reward,
    TherapistProfile,
  ],
  migrations: DATABASE_MIGRATIONS,
});

