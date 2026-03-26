import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { CreateGuardianLinkDto } from './dto/create-guardian-link.dto';
import { UpdateGuardianLinkDto } from './dto/update-guardian-link.dto';

@Injectable()
export class GuardianshipService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepository: Repository<GuardianLink>,
  ) {}

  async create(dto: CreateGuardianLinkDto, actor: { subjectId: string; actorRole: string }) {
    const saved = await this.guardianLinkRepository.save(
      this.guardianLinkRepository.create({
        parentProfileId: dto.parentProfileId,
        parentUserId: dto.parentUserId,
        minorProfileId: dto.minorProfileId,
        minorRole: dto.minorRole,
        status: dto.statusIntent ?? 'pending',
        approvedAt: dto.statusIntent === 'active' ? new Date() : null,
        createdBy: actor.subjectId,
        auditContext: {
          actorRole: actor.actorRole,
          source: 'guardianship.create',
        },
      }),
    );

    await this.auditService.record('guardianship.created', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'guardian_link',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'low',
    });

    return saved;
  }

  async list(parentUserId?: string, minorProfileId?: string) {
    return this.guardianLinkRepository.find({
      where: {
        ...(parentUserId ? { parentUserId } : {}),
        ...(minorProfileId ? { minorProfileId } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateGuardianLinkDto, actor: { subjectId: string; actorRole: string }) {
    const link = await this.guardianLinkRepository.findOne({ where: { id } });
    if (!link) {
      throw new NotFoundException('Guardian link not found');
    }

    if (dto.status) {
      link.status = dto.status;
      link.approvedAt = dto.status === 'active' ? new Date() : link.approvedAt;
      link.revokedAt = dto.status === 'revoked' ? new Date() : null;
    }

    const saved = await this.guardianLinkRepository.save(link);

    await this.auditService.record(
      dto.status === 'revoked' ? 'guardianship.revoked' : 'guardianship.updated',
      {
        actorRole: actor.actorRole,
        actorUserId: actor.subjectId,
        resourceType: 'guardian_link',
        resourceId: saved.id,
        outcome: 'success',
        severity: 'low',
      },
    );

    return saved;
  }
}

