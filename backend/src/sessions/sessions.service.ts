import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { DeviceSession } from '../common/entities/device-session.entity';
import { SessionStoreService } from '../common/session-store.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly sessionStoreService: SessionStoreService,
    @InjectRepository(DeviceSession)
    private readonly deviceSessionRepository: Repository<DeviceSession>,
  ) {}

  async listSessions(subjectId: string) {
    return this.deviceSessionRepository.find({
      where: {
        subjectId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeSession(id: string, actorUserId: string, actorRole: string) {
    const revoked = await this.sessionStoreService.revokeSessionById(id);
    await this.auditService.record('session.revoked', {
      actorRole,
      actorUserId,
      resourceType: 'device_session',
      resourceId: id,
      outcome: revoked ? 'success' : 'not_found',
      severity: 'low',
    });

    return { revoked };
  }
}

