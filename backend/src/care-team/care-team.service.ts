import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { CareTeamMembership } from '../common/entities/care-team-membership.entity';
import { CreateCareTeamMembershipDto } from './dto/create-care-team-membership.dto';
import { UpdateCareTeamMembershipDto } from './dto/update-care-team-membership.dto';

type CareTeamFilters = {
  minorProfileId?: string;
  status?: string;
  parentApprovalStatus?: string;
  adminApprovalStatus?: string;
  minorRole?: string;
};

@Injectable()
export class CareTeamService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(CareTeamMembership)
    private readonly careTeamRepository: Repository<CareTeamMembership>,
  ) {}

  async create(dto: CreateCareTeamMembershipDto, actor: { subjectId: string; actorRole: string }) {
    const saved = await this.careTeamRepository.save(
      this.careTeamRepository.create({
        therapistUserId: dto.therapistUserId,
        therapistProfileId: dto.therapistProfileId ?? null,
        parentUserId: dto.parentUserId,
        parentProfileId: dto.parentProfileId,
        minorProfileId: dto.minorProfileId,
        minorRole: dto.minorRole,
        scope: (dto.scope as Record<string, string | number | boolean | null>) ?? null,
        status: 'pending',
        adminApprovalStatus: 'pending',
        parentApprovalStatus: 'pending',
      }),
    );

    await this.auditService.record('care_team.requested', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'care_team_membership',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'medium',
    });

    return saved;
  }

  async list(filters: CareTeamFilters = {}) {
    return this.careTeamRepository.find({
      where: {
        ...(filters.minorProfileId ? { minorProfileId: filters.minorProfileId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.parentApprovalStatus
          ? { parentApprovalStatus: filters.parentApprovalStatus }
          : {}),
        ...(filters.adminApprovalStatus
          ? { adminApprovalStatus: filters.adminApprovalStatus }
          : {}),
        ...(filters.minorRole ? { minorRole: filters.minorRole } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    dto: UpdateCareTeamMembershipDto,
    actor: { subjectId: string; actorRole: string },
    options: { allowAdminApproval: boolean },
  ) {
    const membership = await this.careTeamRepository.findOne({ where: { id } });
    if (!membership) {
      throw new NotFoundException('Care-team membership not found');
    }

    const nextStatus = dto.status ?? membership.status;

    if (options.allowAdminApproval) {
      membership.adminApprovalStatus =
        dto.adminApprovalStatus ?? membership.adminApprovalStatus;

      if (nextStatus === 'revoked') {
        membership.status = 'revoked';
        membership.revokedAt = new Date();
      }
    } else {
      membership.parentApprovalStatus =
        dto.parentApprovalStatus ?? membership.parentApprovalStatus;

      if (nextStatus === 'revoked') {
        membership.status = 'revoked';
        membership.revokedAt = new Date();
      }
    }

    if (
      membership.adminApprovalStatus === 'approved' &&
      membership.parentApprovalStatus === 'approved'
    ) {
      membership.status = 'active';
      membership.approvedAt = new Date();
    }

    const saved = await this.careTeamRepository.save(membership);

    const eventType =
      saved.status === 'active' && options.allowAdminApproval
        ? 'care_team.approved_by_admin'
        : saved.status === 'revoked'
          ? 'care_team.revoked'
          : 'care_team.updated';

    await this.auditService.record(eventType, {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'care_team_membership',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'medium',
    });

    return saved;
  }
}
