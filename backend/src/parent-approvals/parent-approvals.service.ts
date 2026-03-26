import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { ParentApproval } from '../common/entities/parent-approval.entity';
import { CreateParentApprovalDto } from './dto/create-parent-approval.dto';
import { UpdateParentApprovalDto } from './dto/update-parent-approval.dto';

@Injectable()
export class ParentApprovalsService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(ParentApproval)
    private readonly parentApprovalRepository: Repository<ParentApproval>,
  ) {}

  async create(dto: CreateParentApprovalDto, actor: { subjectId: string; actorRole: string }) {
    const saved = await this.parentApprovalRepository.save(
      this.parentApprovalRepository.create({
        parentUserId: actor.subjectId,
        approvalType: dto.approvalType,
        targetId: dto.targetId,
        decision: 'granted',
        status: 'active',
        decidedAt: new Date(),
        metadata: (dto.metadata as Record<string, string | number | boolean | null>) ?? null,
      }),
    );

    await this.auditService.record('parent_approval.granted', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'parent_approval',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'low',
    });

    return saved;
  }

  async update(id: string, dto: UpdateParentApprovalDto, actor: { subjectId: string; actorRole: string }) {
    const approval = await this.parentApprovalRepository.findOne({ where: { id } });
    if (!approval) {
      throw new NotFoundException('Parent approval not found');
    }

    approval.decision = dto.decision ?? approval.decision;
    approval.status = dto.status ?? approval.status;
    approval.decidedAt = new Date();
    const saved = await this.parentApprovalRepository.save(approval);

    await this.auditService.record(
      saved.status === 'revoked' ? 'parent_approval.revoked' : 'parent_approval.granted',
      {
        actorRole: actor.actorRole,
        actorUserId: actor.subjectId,
        resourceType: 'parent_approval',
        resourceId: saved.id,
        outcome: 'success',
        severity: 'low',
      },
    );

    return saved;
  }
}

