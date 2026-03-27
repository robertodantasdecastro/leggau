import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CareTeamMembership } from '../common/entities/care-team-membership.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { InteractionPolicy } from '../common/entities/interaction-policy.entity';
import { InteractionPoliciesController } from './interaction-policies.controller';
import { InteractionPoliciesService } from './interaction-policies.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    TypeOrmModule.forFeature([InteractionPolicy, GuardianLink, CareTeamMembership]),
  ],
  controllers: [InteractionPoliciesController],
  providers: [InteractionPoliciesService],
  exports: [InteractionPoliciesService],
})
export class InteractionPoliciesModule {}
