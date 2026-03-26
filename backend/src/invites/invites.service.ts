import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Invite } from '../common/entities/invite.entity';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
  ) {}

  async list() {
    return this.inviteRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateInviteDto, actor: { subjectId: string; actorRole: string }) {
    const saved = await this.inviteRepository.save(
      this.inviteRepository.create({
        inviteType: dto.inviteType,
        targetEmail: dto.targetEmail.toLowerCase(),
        minorProfileId: dto.minorProfileId ?? null,
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

  async accept(id: string) {
    const invite = await this.inviteRepository.findOne({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    const saved = await this.inviteRepository.save(invite);

    await this.auditService.record('invite.accepted', {
      actorRole: 'system',
      resourceType: 'invite',
      resourceId: saved.id,
      outcome: 'success',
      severity: 'low',
    });

    return saved;
  }
}

