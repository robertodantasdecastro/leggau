import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { GuardianshipController } from './guardianship.controller';
import { GuardianshipService } from './guardianship.service';

@Module({
  imports: [AuthModule, AuditModule, TypeOrmModule.forFeature([GuardianLink])],
  controllers: [GuardianshipController],
  providers: [GuardianshipService],
  exports: [GuardianshipService],
})
export class GuardianshipModule {}

