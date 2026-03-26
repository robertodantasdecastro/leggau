import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CareTeamMembership } from '../common/entities/care-team-membership.entity';
import { CareTeamController } from './care-team.controller';
import { CareTeamService } from './care-team.service';

@Module({
  imports: [
    AuthModule,
    AdminModule,
    AuditModule,
    TypeOrmModule.forFeature([CareTeamMembership]),
  ],
  controllers: [CareTeamController],
  providers: [CareTeamService],
  exports: [CareTeamService],
})
export class CareTeamModule {}
