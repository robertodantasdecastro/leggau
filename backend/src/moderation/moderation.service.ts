import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { ModerationCase } from '../common/entities/moderation-case.entity';
import { UpdateModerationCaseDto } from './dto/update-moderation-case.dto';

@Injectable()
export class ModerationService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(ModerationCase)
    private readonly moderationCaseRepository: Repository<ModerationCase>,
  ) {}

  async listCases() {
    return this.moderationCaseRepository.find({
      order: { createdAt: 'DESC' },
    });
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

