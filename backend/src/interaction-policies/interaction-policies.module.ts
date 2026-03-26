import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { InteractionPolicy } from '../common/entities/interaction-policy.entity';
import { InteractionPoliciesController } from './interaction-policies.controller';
import { InteractionPoliciesService } from './interaction-policies.service';

@Module({
  imports: [AuthModule, AuditModule, TypeOrmModule.forFeature([InteractionPolicy])],
  controllers: [InteractionPoliciesController],
  providers: [InteractionPoliciesService],
  exports: [InteractionPoliciesService],
})
export class InteractionPoliciesModule {}

