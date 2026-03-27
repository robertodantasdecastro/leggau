import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Invite } from '../common/entities/invite.entity';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';

type InviteActor = {
  subjectId: string;
  actorRole: string;
  email: string;
};

type InviteFilters = {
  minorProfileId?: string;
  inviteType?: string;
  status?: string;
  roomId?: string;
};

@Injectable()
export class InvitesService {
  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
  ) {}

  async list(actor: InviteActor, filters: InviteFilters = {}) {
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
            )
            .orWhere('invite.acceptedByUserId = :subjectId', { subjectId: actor.subjectId });
        }),
      )
      .orderBy('invite.createdAt', 'DESC');

    if (filters.minorProfileId) {
      query.andWhere('invite.minorProfileId = :minorProfileId', {
        minorProfileId: filters.minorProfileId,
      });
    }

    if (filters.inviteType) {
      query.andWhere('invite.inviteType = :inviteType', {
        inviteType: filters.inviteType,
      });
    }

    const items = await query.getMany();
    const normalized = await this.normalizeInviteStatuses(items);

    return normalized.filter((invite) => {
      if (filters.status && invite.status !== filters.status) {
        return false;
      }

      if (filters.roomId && this.resolveRoomId(invite) !== filters.roomId) {
        return false;
      }

      return true;
    });
  }

  async listAsAdmin(filters: InviteFilters = {}) {
    const items = await this.inviteRepository.find({
      where: {
        ...(filters.minorProfileId ? { minorProfileId: filters.minorProfileId } : {}),
        ...(filters.inviteType ? { inviteType: filters.inviteType } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    const normalized = await this.normalizeInviteStatuses(items);

    return normalized.filter((invite) => {
      if (filters.status && invite.status !== filters.status) {
        return false;
      }

      if (filters.roomId && this.resolveRoomId(invite) !== filters.roomId) {
        return false;
      }

      return true;
    });
  }

  async create(dto: CreateInviteDto, actor: InviteActor) {
    if (!['parent_guardian', 'therapist'].includes(actor.actorRole)) {
      throw new ForbiddenException('This actor cannot create invites');
    }

    const metadata = this.normalizeMetadata(dto.metadata);
    const expiresAt = this.resolveExpiresAt(dto);
    const targetActorRole = this.resolveTargetActorRole(dto);

    if (dto.inviteType === 'monitored_room') {
      if (actor.actorRole !== 'parent_guardian') {
        throw new ForbiddenException('Only the responsible actor can create monitored room invites');
      }

      if (!dto.minorProfileId) {
        throw new BadRequestException('Minor profile is required for monitored room invites');
      }

      const roomId = this.resolveMetadataString(metadata, 'roomId');
      const roomTitle = this.resolveMetadataString(metadata, 'roomTitle');
      if (!roomId || !roomTitle) {
        throw new BadRequestException('Monitored room invites require roomId and roomTitle in metadata');
      }
    }

    const saved = await this.inviteRepository.save(
      this.inviteRepository.create({
        creatorUserId: actor.subjectId,
        creatorActorRole: actor.actorRole,
        inviteType: dto.inviteType,
        targetEmail: dto.targetEmail.toLowerCase(),
        targetActorRole,
        minorProfileId: dto.minorProfileId ?? null,
        metadata,
        expiresAt,
      }),
    );

    await this.recordInviteEvent(saved, 'created', actor.actorRole, actor.subjectId);
    return saved;
  }

  async accept(id: string, actor: InviteActor) {
    const invite = await this.inviteRepository.findOne({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    const normalized = await this.expireInviteIfNeeded(invite);
    if (
      normalized.targetEmail !== actor.email.toLowerCase() ||
      (normalized.targetActorRole && normalized.targetActorRole !== actor.actorRole)
    ) {
      throw new ForbiddenException('Invite is not available for this actor');
    }

    if (normalized.status === 'revoked') {
      throw new ForbiddenException('Invite has already been revoked');
    }

    if (normalized.status === 'expired') {
      throw new ForbiddenException('Invite has already expired');
    }

    if (normalized.status === 'accepted' && normalized.acceptedByUserId === actor.subjectId) {
      return normalized;
    }

    if (normalized.status !== 'pending') {
      throw new ForbiddenException('Invite is no longer pending');
    }

    normalized.status = 'accepted';
    normalized.acceptedByUserId = actor.subjectId;
    normalized.acceptedAt = new Date();
    const saved = await this.inviteRepository.save(normalized);

    await this.recordInviteEvent(saved, 'accepted', actor.actorRole, actor.subjectId);
    return saved;
  }

  async update(id: string, dto: UpdateInviteDto, actor: InviteActor) {
    const invite = await this.inviteRepository.findOne({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    const normalized = await this.expireInviteIfNeeded(invite);
    if (normalized.creatorUserId !== actor.subjectId) {
      throw new ForbiddenException('Only the invite creator can update this invite');
    }

    return this.applyUpdate(normalized, dto, {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
    });
  }

  async updateAsAdmin(
    id: string,
    dto: UpdateInviteDto,
    actor: { subjectId: string; actorRole: string },
  ) {
    const invite = await this.inviteRepository.findOne({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    const normalized = await this.expireInviteIfNeeded(invite);
    return this.applyUpdate(normalized, dto, {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
    });
  }

  private async applyUpdate(
    invite: Invite,
    dto: UpdateInviteDto,
    actor: { actorRole: string; actorUserId: string },
  ) {
    if (!dto.status) {
      return invite;
    }

    if (dto.status !== 'revoked') {
      throw new BadRequestException('Only revoke is supported for invites in this phase');
    }

    if (invite.status === 'revoked') {
      return invite;
    }

    invite.status = 'revoked';
    const saved = await this.inviteRepository.save(invite);
    await this.recordInviteEvent(saved, 'revoked', actor.actorRole, actor.actorUserId);
    return saved;
  }

  private resolveExpiresAt(dto: CreateInviteDto) {
    if (dto.expiresAt) {
      const parsed = new Date(dto.expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid invite expiry');
      }

      return parsed;
    }

    const defaultTtlMs =
      dto.inviteType === 'monitored_room'
        ? 24 * 3600 * 1000
        : 7 * 24 * 3600 * 1000;
    return new Date(Date.now() + defaultTtlMs);
  }

  private resolveTargetActorRole(dto: CreateInviteDto) {
    if (dto.inviteType === 'monitored_room') {
      return 'therapist';
    }

    return dto.targetActorRole ?? null;
  }

  private normalizeMetadata(metadata: Record<string, unknown> | undefined) {
    const normalized = new Map<string, string | number | boolean | null>();
    if (!metadata) {
      return null;
    }

    for (const [key, value] of Object.entries(metadata)) {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
      ) {
        normalized.set(key, value);
      }
    }

    return Object.fromEntries(normalized.entries());
  }

  private resolveMetadataString(
    metadata: Record<string, string | number | boolean | null> | null | undefined,
    key: string,
  ) {
    const value = metadata?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
  }

  private resolveRoomId(invite: Invite) {
    return this.resolveMetadataString(invite.metadata, 'roomId');
  }

  private async normalizeInviteStatuses(invites: Invite[]) {
    const normalized = new Array<Invite>(invites.length);

    for (let index = 0; index < invites.length; index += 1) {
      normalized[index] = await this.expireInviteIfNeeded(invites[index]);
    }

    return normalized;
  }

  private async expireInviteIfNeeded(invite: Invite) {
    if (!invite.expiresAt) {
      return invite;
    }

    if (invite.status === 'revoked' || invite.status === 'expired') {
      return invite;
    }

    if (invite.expiresAt.getTime() > Date.now()) {
      return invite;
    }

    invite.status = 'expired';
    const saved = await this.inviteRepository.save(invite);
    await this.recordInviteEvent(saved, 'expired', saved.creatorActorRole ?? 'system', saved.creatorUserId ?? null);
    return saved;
  }

  private async recordInviteEvent(
    invite: Invite,
    action: 'created' | 'accepted' | 'revoked' | 'expired',
    actorRole: string,
    actorUserId: string | null,
  ) {
    const roomId = this.resolveRoomId(invite);
    const roomTitle = this.resolveMetadataString(invite.metadata, 'roomTitle');
    const eventType =
      invite.inviteType === 'monitored_room'
        ? `room_invite.${action}`
        : `invite.${action}`;

    await this.auditService.record(eventType, {
      actorRole,
      actorUserId,
      resourceType: 'invite',
      resourceId: invite.id,
      outcome: action === 'expired' ? 'blocked' : 'success',
      severity: 'low',
      metadata: {
        inviteType: invite.inviteType,
        minorProfileId: invite.minorProfileId ?? '',
        roomId,
        roomTitle,
        targetActorRole: invite.targetActorRole ?? '',
        status: invite.status,
      },
    });
  }
}
