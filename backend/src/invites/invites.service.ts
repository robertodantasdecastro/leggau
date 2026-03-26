import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Invite } from '../common/entities/invite.entity';
import { CreateInviteDto } from './dto/create-invite.dto';

type InviteActor = {
  subjectId: string;
  actorRole: string;
  email: string;
};

@Injectable()
export class InvitesService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
  ) {}

  async list(actor: InviteActor, minorProfileId?: string) {
    const query = this.inviteRepository
      .createQueryBuilder('invite')
      .where(
        new Brackets((builder) => {
          builder
            .where('invite.creatorUserId = :subjectId', { subjectId: actor.subjectId })
            .orWhere(
              `invite.targetEmail = :targetEmail
              AND (invite.targetActorRole IS NULL OR invite.targetActorRole = :actorRole)`,
              {
                targetEmail: actor.email.toLowerCase(),
                actorRole: actor.actorRole,
              },
            );
        }),
      )
      .orderBy('invite.createdAt', 'DESC');

    if (minorProfileId) {
      query.andWhere('invite.minorProfileId = :minorProfileId', { minorProfileId });
    }

    return query.getMany();
  }

  async create(dto: CreateInviteDto, actor: InviteActor) {
    if (!['parent_guardian', 'therapist'].includes(actor.actorRole)) {
      throw new ForbiddenException('This actor cannot create invites');
    }

    const saved = await this.inviteRepository.save(
      this.inviteRepository.create({
        creatorUserId: actor.subjectId,
        creatorActorRole: actor.actorRole,
        inviteType: dto.inviteType,
        targetEmail: dto.targetEmail.toLowerCase(),
        targetActorRole: dto.targetActorRole ?? null,
        minorProfileId: dto.minorProfileId ?? null,
        metadata: (dto.metadata as Record<string, string | number | boolean | null>) ?? null,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      }),
    );

    await this.auditService.record('invite.created', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'invite',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'low',
    });

    return saved;
  }

  async accept(id: string, actor: InviteActor) {
    const invite = await this.inviteRepository.findOne({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (
      invite.targetEmail !== actor.email.toLowerCase() ||
      (invite.targetActorRole && invite.targetActorRole !== actor.actorRole)
    ) {
      throw new ForbiddenException('Invite is not available for this actor');
    }

    invite.status = 'accepted';
    invite.acceptedByUserId = actor.subjectId;
    invite.acceptedAt = new Date();
    const saved = await this.inviteRepository.save(invite);

    await this.auditService.record('invite.accepted', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'invite',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'low',
    });

    return saved;
  }
}
