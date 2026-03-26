import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUser } from '../common/entities/app-user.entity';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { ConsentRecord } from '../common/entities/consent-record.entity';
import { LegalDocument } from '../common/entities/legal-document.entity';
import { PolicyVersion } from '../common/entities/policy-version.entity';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppUser,
      LegalDocument,
      ConsentRecord,
      PolicyVersion,
      AuditEvent,
    ]),
  ],
  controllers: [LegalController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
