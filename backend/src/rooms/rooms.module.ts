import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CareTeamMembership } from '../common/entities/care-team-membership.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { InteractionPolicy } from '../common/entities/interaction-policy.entity';
import { ParentApproval } from '../common/entities/parent-approval.entity';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    TypeOrmModule.forFeature([
      GuardianLink,
      CareTeamMembership,
      InteractionPolicy,
      ParentApproval,
    ]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
