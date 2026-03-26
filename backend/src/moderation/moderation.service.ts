import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { ModerationCase } from '../common/entities/moderation-case.entity';
import { CreateModerationCaseDto } from './dto/create-moderation-case.dto';
import { UpdateModerationCaseDto } from './dto/update-moderation-case.dto';

@Injectable()
export class ModerationService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(ModerationCase)
    private readonly moderationCaseRepository: Repository<ModerationCase>,
  ) {}

  async listCases(filters: { status?: string; severity?: string; sourceType?: string } = {}) {
    return this.moderationCaseRepository.find({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.severity ? { severity: filters.severity } : {}),
        ...(filters.sourceType ? { sourceType: filters.sourceType } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async createCase(dto: CreateModerationCaseDto) {
    const saved = await this.moderationCaseRepository.save(
      this.moderationCaseRepository.create({
        sourceType: dto.sourceType,
        sourceId: dto.sourceId ?? null,
        status: 'open',
        severity: dto.severity ?? 'medium',
        policyCode: dto.policyCode ?? null,
        humanReviewRequired: dto.humanReviewRequired ?? true,
        aiDecision: (dto.aiDecision as Record<string, string | number | boolean | null>) ?? null,
      }),
    );

    await this.auditService.record('moderation_case.created', {
      actorRole: 'admin',
      resourceType: 'moderation_case',
      resourceId: saved.id,
      outcome: 'success',
      severity: saved.severity,
    });

    return saved;
  }

  async updateCase(id: string, dto: UpdateModerationCaseDto) {
    const moderationCase = await this.moderationCaseRepository.findOne({
      where: { id },
    });
    if (!moderationCase) {
      throw new NotFoundException('Moderation case not found');
    }

    moderationCase.status = dto.status ?? moderationCase.status;
    moderationCase.severity = dto.severity ?? moderationCase.severity;
    const saved = await this.moderationCaseRepository.save(moderationCase);

    await this.auditService.record('moderation_case.updated', {
      actorRole: 'admin',
      resourceType: 'moderation_case',
      resourceId: saved.id,
      outcome: 'success',
      severity: saved.severity,
    });

    return saved;
  }
}
