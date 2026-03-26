import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ParentApproval } from '../common/entities/parent-approval.entity';
import { ParentApprovalsController } from './parent-approvals.controller';
import { ParentApprovalsService } from './parent-approvals.service';

@Module({
  imports: [AuthModule, AuditModule, TypeOrmModule.forFeature([ParentApproval])],
  controllers: [ParentApprovalsController],
  providers: [ParentApprovalsService],
  exports: [ParentApprovalsService],
})
export class ParentApprovalsModule {}

