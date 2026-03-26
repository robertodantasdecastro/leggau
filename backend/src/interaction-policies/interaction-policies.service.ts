import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { InteractionPolicy } from '../common/entities/interaction-policy.entity';
import { UpdateInteractionPolicyDto } from './dto/update-interaction-policy.dto';

@Injectable()
export class InteractionPoliciesService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(InteractionPolicy)
    private readonly interactionPolicyRepository: Repository<InteractionPolicy>,
  ) {}

  async getByMinor(minorProfileId: string) {
    const policy = await this.interactionPolicyRepository.findOne({
      where: { minorProfileId },
      order: { createdAt: 'DESC' },
    });

    if (!policy) {
      throw new NotFoundException('Interaction policy not found');
    }

    return policy;
  }

  async updateByMinor(
    minorProfileId: string,
    dto: UpdateInteractionPolicyDto,
    actor: { subjectId: string; actorRole: string },
  ) {
    const policy = await this.interactionPolicyRepository.findOne({
      where: { minorProfileId },
      order: { createdAt: 'DESC' },
    });

    if (!policy) {
      throw new NotFoundException('Interaction policy not found');
    }

    policy.roomsEnabled = dto.roomsEnabled ?? policy.roomsEnabled;
    policy.presenceEnabled = dto.presenceEnabled ?? policy.presenceEnabled;
    policy.messagingMode = dto.messagingMode ?? policy.messagingMode;
    policy.therapistParticipationAllowed =
      dto.therapistParticipationAllowed ?? policy.therapistParticipationAllowed;
    policy.guardianOverride = {
      ...(policy.guardianOverride ?? {}),
      updatedBy: actor.subjectId,
    };

    const saved = await this.interactionPolicyRepository.save(policy);

    await this.auditService.record('interaction_policy.updated', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'interaction_policy',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'medium',
    });

    return saved;
  }
}

