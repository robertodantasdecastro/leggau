import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdolescentProfile } from '../common/entities/adolescent-profile.entity';
import { AppUser } from '../common/entities/app-user.entity';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { ChildProfile } from '../common/entities/child-profile.entity';
import { ConsentRecord } from '../common/entities/consent-record.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { InteractionPolicy } from '../common/entities/interaction-policy.entity';
import { ParentProfile } from '../common/entities/parent-profile.entity';
import { PolicyVersion } from '../common/entities/policy-version.entity';
import { ChildrenController } from './children.controller';
import { ChildrenService } from './children.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParentProfile,
      AppUser,
      ChildProfile,
      AdolescentProfile,
      GuardianLink,
      InteractionPolicy,
      AuditEvent,
      PolicyVersion,
      ConsentRecord,
    ]),
  ],
  controllers: [ChildrenController],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}
