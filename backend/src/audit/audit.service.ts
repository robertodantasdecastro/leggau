import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from '../common/entities/audit-event.entity';

type AuditPayload = {
  actorRole: string;
  actorUserId?: string | null;
  resourceType: string;
  resourceId?: string | null;
  outcome: string;
  severity?: string;
  metadata?: Record<string, string | number | boolean | null> | null;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
  ) {}

  async record(eventType: string, payload: AuditPayload) {
    return this.auditEventRepository.save(
      this.auditEventRepository.create({
        eventType,
        actorRole: payload.actorRole,
        actorUserId: payload.actorUserId ?? null,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId ?? null,
        outcome: payload.outcome,
        severity: payload.severity ?? 'low',
        metadata: payload.metadata ?? null,
      }),
    );
  }

  async listEvents(filters: {
    eventType?: string;
    actorRole?: string;
    resourceType?: string;
  } = {}) {
    return this.auditEventRepository.find({
      where: {
        ...(filters.eventType ? { eventType: filters.eventType } : {}),
        ...(filters.actorRole ? { actorRole: filters.actorRole } : {}),
        ...(filters.resourceType ? { resourceType: filters.resourceType } : {}),
      },
      order: { occurredAt: 'DESC' },
      take: 200,
    });
  }
}
