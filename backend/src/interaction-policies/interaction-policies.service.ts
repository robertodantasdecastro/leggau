import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { CareTeamMembership } from '../common/entities/care-team-membership.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { InteractionPolicy } from '../common/entities/interaction-policy.entity';
import { UpdateInteractionPolicyDto } from './dto/update-interaction-policy.dto';

type ActorSession = {
  subjectId: string;
  actorRole: string;
};

@Injectable()
export class InteractionPoliciesService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(InteractionPolicy)
    private readonly interactionPolicyRepository: Repository<InteractionPolicy>,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepository: Repository<GuardianLink>,
    @InjectRepository(CareTeamMembership)
    private readonly careTeamRepository: Repository<CareTeamMembership>,
  ) {}

  async getByMinor(minorProfileId: string, actor: ActorSession) {
    const { policy, accessSource } = await this.resolveActorAccess(minorProfileId, actor, 'read');

    await this.auditService.record('interaction_policy.viewed', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'interaction_policy',
      resourceId: policy.id,
      outcome: 'success',
      severity: 'low',
      metadata: {
        accessSource,
        minorProfileId,
      },
    });

    return {
      ...policy,
      accessSource,
      blockedBy: [],
    };
  }

  async getByMinorForAdmin(minorProfileId: string, actor: ActorSession) {
    const policy = await this.findPolicy(minorProfileId);

    await this.auditService.record('interaction_policy.viewed', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'interaction_policy',
      resourceId: policy.id,
      outcome: 'success',
      severity: 'low',
      metadata: {
        accessSource: 'admin',
        minorProfileId,
      },
    });

    return {
      ...policy,
      accessSource: 'admin',
      blockedBy: [],
    };
  }

  async updateByMinor(
    minorProfileId: string,
    dto: UpdateInteractionPolicyDto,
    actor: ActorSession,
  ) {
    const { policy } = await this.resolveActorAccess(minorProfileId, actor, 'write');

    return this.persistPolicyUpdate(policy, dto, actor, 'guardian');
  }

  async updateByMinorForAdmin(
    minorProfileId: string,
    dto: UpdateInteractionPolicyDto,
    actor: ActorSession,
  ) {
    const policy = await this.findPolicy(minorProfileId);

    return this.persistPolicyUpdate(policy, dto, actor, 'admin_override');
  }

  private async persistPolicyUpdate(
    policy: InteractionPolicy,
    dto: UpdateInteractionPolicyDto,
    actor: ActorSession,
    source: 'guardian' | 'admin_override',
  ) {
    policy.roomsEnabled = dto.roomsEnabled ?? policy.roomsEnabled;
    policy.presenceEnabled = dto.presenceEnabled ?? policy.presenceEnabled;
    policy.messagingMode = dto.messagingMode ?? policy.messagingMode;
    policy.therapistParticipationAllowed =
      dto.therapistParticipationAllowed ?? policy.therapistParticipationAllowed;
    policy.guardianOverride = {
      ...(policy.guardianOverride ?? {}),
      updatedBy: actor.subjectId,
      updatedByActorRole: actor.actorRole,
      source,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.interactionPolicyRepository.save(policy);

    await this.auditService.record('interaction_policy.updated', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'interaction_policy',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'medium',
      metadata: {
        source,
        minorProfileId: saved.minorProfileId,
      },
    });

    return {
      ...saved,
      accessSource: source === 'admin_override' ? 'admin' : 'guardian_link',
      blockedBy: [],
    };
  }

  private async resolveActorAccess(
    minorProfileId: string,
    actor: ActorSession,
    mode: 'read' | 'write',
  ) {
    const policy = await this.findPolicy(minorProfileId);

    if (actor.actorRole === 'parent_guardian') {
      const guardianLink = await this.guardianLinkRepository.findOne({
        where: {
          parentUserId: actor.subjectId,
          minorProfileId,
          status: 'active',
        },
        order: { createdAt: 'DESC' },
      });

      if (!guardianLink) {
        await this.recordBlockedUpdate(policy, actor, 'guardian_link_required', mode);
        throw new ForbiddenException('Active guardian link required to access this interaction policy');
      }

      return {
        policy,
        accessSource: 'guardian_link',
      };
    }

    if (actor.actorRole === 'therapist') {
      if (mode === 'write') {
        await this.recordBlockedUpdate(policy, actor, 'therapist_read_only', mode);
        throw new ForbiddenException('Therapists cannot edit interaction policies');
      }

      const membership = await this.careTeamRepository.findOne({
        where: {
          therapistUserId: actor.subjectId,
          minorProfileId,
          status: 'active',
          parentApprovalStatus: 'approved',
          adminApprovalStatus: 'approved',
        },
        order: { createdAt: 'DESC' },
      });

      if (!membership) {
        await this.recordBlockedUpdate(policy, actor, 'care_team_required', mode);
        throw new ForbiddenException(
          'Active, approved care-team membership required to view this interaction policy',
        );
      }

      return {
        policy,
        accessSource: 'care_team',
      };
    }

    await this.recordBlockedUpdate(policy, actor, 'actor_not_allowed', mode);
    throw new ForbiddenException('Actor role is not allowed to access interaction policies');
  }

  private async recordBlockedUpdate(
    policy: InteractionPolicy,
    actor: ActorSession,
    blockedBy: string,
    mode: 'read' | 'write',
  ) {
    if (mode !== 'write') {
      return;
    }

    await this.auditService.record('interaction_policy.update_blocked', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'interaction_policy',
      resourceId: policy.id,
      outcome: 'blocked',
      severity: 'medium',
      metadata: {
        blockedBy,
        minorProfileId: policy.minorProfileId,
      },
    });
  }

  private async findPolicy(minorProfileId: string) {
    const policy = await this.interactionPolicyRepository.findOne({
      where: { minorProfileId },
      order: { createdAt: 'DESC' },
    });

    if (!policy) {
      throw new NotFoundException('Interaction policy not found');
    }

    return policy;
  }
}
