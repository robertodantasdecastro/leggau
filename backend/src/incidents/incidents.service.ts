import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Incident } from '../common/entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async list(filters: { status?: string; severity?: string; sourceType?: string } = {}) {
    return this.incidentRepository.find({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.severity ? { severity: filters.severity } : {}),
        ...(filters.sourceType ? { sourceType: filters.sourceType } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateIncidentDto) {
    const saved = await this.incidentRepository.save(
      this.incidentRepository.create({
        severity: dto.severity,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId ?? null,
        summary: dto.summary,
        status: 'open',
        createdByRole: 'admin',
      }),
    );

    await this.auditService.record('incident.created', {
      actorRole: 'admin',
      resourceType: 'incident',
      resourceId: saved.id,
      outcome: 'success',
      severity: saved.severity,
    });

    return saved;
  }

  async update(id: string, dto: UpdateIncidentDto) {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    incident.severity = dto.severity ?? incident.severity;
    incident.status = dto.status ?? incident.status;
    incident.reviewedAt = new Date();
    const saved = await this.incidentRepository.save(incident);

    await this.auditService.record('incident.updated', {
      actorRole: 'admin',
      resourceType: 'incident',
      resourceId: saved.id,
      outcome: 'success',
      severity: saved.severity,
    });

    return saved;
  }
}
