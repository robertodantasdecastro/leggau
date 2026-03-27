import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { CareTeamMembership } from '../common/entities/care-team-membership.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { InteractionPolicy } from '../common/entities/interaction-policy.entity';
import { PresenceHeartbeatDto } from './dto/presence-heartbeat.dto';
import { RoomActionDto } from './dto/room-action.dto';

type AppActor = {
  subjectId: string;
  actorRole: string;
};

type AccessContext = {
  minorProfileId: string;
  policy: InteractionPolicy;
  accessSource: 'guardian_link' | 'care_team';
};

type RoomDefinition = {
  id: string;
  title: string;
  description: string;
  audience: string;
  ageBands: string[];
  shells: string[];
  presenceMode: string;
};

type PresenceParticipant = {
  participantKey: string;
  minorProfileId: string;
  actorRole: string;
  activeShell: string;
  accessSource: string;
  joinedAt: string;
  lastHeartbeatAt: string;
};

const PresenceTtlMs = 2 * 60 * 1000;
const RoomCatalog: RoomDefinition[] = [
  {
    id: 'gau-clubhouse',
    title: 'Clube do Gau',
    description: 'Sala guiada com passos curtos, acolhimento e trilha visual reforcada.',
    audience: 'child',
    ageBands: ['6-9'],
    shells: ['child'],
    presenceMode: 'guided',
  },
  {
    id: 'quest-deck',
    title: 'Deck das Missoes',
    description: 'Espaco monitorado para escolher atividades do dia com autonomia assistida.',
    audience: 'child',
    ageBands: ['10-12'],
    shells: ['child'],
    presenceMode: 'guided',
  },
  {
    id: 'focus-lab',
    title: 'Laboratorio de Foco',
    description: 'Ambiente estruturado para rotina, metas e check-ins monitorados.',
    audience: 'all',
    ageBands: ['10-12', '13-17'],
    shells: ['child', 'adolescent'],
    presenceMode: 'structured',
  },
  {
    id: 'teen-hub',
    title: 'Hub Teen',
    description: 'Sala calma para progresso, objetivos e acompanhamento autorizado.',
    audience: 'adolescent',
    ageBands: ['13-17'],
    shells: ['adolescent'],
    presenceMode: 'structured',
  },
];

@Injectable()
export class RoomsService {
  private readonly presenceByRoom = new Map<string, Map<string, PresenceParticipant>>();

  constructor(
    private readonly auditService: AuditService,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepository: Repository<GuardianLink>,
    @InjectRepository(CareTeamMembership)
    private readonly careTeamRepository: Repository<CareTeamMembership>,
    @InjectRepository(InteractionPolicy)
    private readonly interactionPolicyRepository: Repository<InteractionPolicy>,
  ) {}

  async list(minorProfileId: string, actor: AppActor) {
    const access = await this.resolveAccess(minorProfileId, actor);
    const activeRoomId = this.resolveActiveRoomId(minorProfileId);

    if (!access.policy.roomsEnabled) {
      await this.auditService.record('rooms.list_blocked', {
        actorRole: actor.actorRole,
        actorUserId: actor.subjectId,
        resourceType: 'interaction_policy',
        resourceId: access.policy.id,
        outcome: 'blocked',
        severity: 'medium',
        metadata: {
          minorProfileId,
          reason: 'rooms_disabled',
        },
      });

      return {
        allowed: false,
        reason: 'Salas estruturadas bloqueadas pela policy deste menor.',
        presenceEnabled: access.policy.presenceEnabled,
        activeRoomId,
        items: [],
      };
    }

    const items = this.buildRoomCatalog(access.policy);

    await this.auditService.record('rooms.listed', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'minor_profile',
      resourceId: minorProfileId,
      outcome: 'success',
      severity: 'low',
      metadata: {
        activeRoomId: activeRoomId ?? '',
        roomCount: items.length,
      },
    });

    return {
      allowed: true,
      reason:
        items.length > 0
          ? 'Salas monitoradas prontas para este shell.'
          : 'Nenhuma sala monitorada foi publicada para este shell.',
      presenceEnabled: access.policy.presenceEnabled,
      activeRoomId,
      items,
    };
  }

  async join(roomId: string, dto: RoomActionDto, actor: AppActor) {
    const access = await this.resolveAccess(dto.minorProfileId, actor);
    if (!access.policy.roomsEnabled) {
      await this.auditService.record('room.join_blocked', {
        actorRole: actor.actorRole,
        actorUserId: actor.subjectId,
        resourceType: 'room',
        resourceId: roomId,
        outcome: 'blocked',
        severity: 'medium',
        metadata: {
          minorProfileId: dto.minorProfileId,
          reason: 'rooms_disabled',
        },
      });

      throw new ForbiddenException('Interaction policy blocks structured rooms for this minor');
    }

    const room = this.ensureRoomAllowed(roomId, access.policy);
    const activeShell = this.resolveShell(dto.activeShell, access.policy);

    this.upsertParticipant(
      room.id,
      dto.minorProfileId,
      actor,
      activeShell,
      access.accessSource,
    );

    await this.auditService.record('room.joined', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'room',
      resourceId: room.id,
      outcome: 'success',
      severity: 'low',
      metadata: {
        minorProfileId: dto.minorProfileId,
        activeShell,
      },
    });

    return {
      allowed: true,
      room,
      presence: access.policy.presenceEnabled
        ? this.buildPresenceState(room, dto.minorProfileId, activeShell)
        : this.buildPresenceDisabledState(room, dto.minorProfileId, activeShell),
      activeRoomId: room.id,
    };
  }

  async leave(roomId: string, dto: RoomActionDto, actor: AppActor) {
    const access = await this.resolveAccess(dto.minorProfileId, actor);
    const activeShell = this.resolveShell(dto.activeShell, access.policy);
    const room = access.policy.roomsEnabled
      ? this.ensureRoomAllowed(roomId, access.policy)
      : this.resolveFallbackRoom(roomId, access.policy, activeShell);
    const roomPresence = this.presenceByRoom.get(room.id);

    if (roomPresence) {
      roomPresence.delete(this.resolveParticipantKey(dto.minorProfileId, actor.actorRole));
      if (roomPresence.size == 0) {
        this.presenceByRoom.delete(room.id);
      }
    }

    await this.auditService.record('room.left', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'room',
      resourceId: room.id,
      outcome: 'success',
      severity: 'low',
      metadata: {
        minorProfileId: dto.minorProfileId,
      },
    });

    return {
      allowed: true,
      room,
      presence: access.policy.presenceEnabled
        ? this.buildPresenceState(room, dto.minorProfileId, activeShell)
        : this.buildPresenceDisabledState(room, dto.minorProfileId, activeShell),
      activeRoomId: this.resolveActiveRoomId(dto.minorProfileId),
    };
  }

  async heartbeat(dto: PresenceHeartbeatDto, actor: AppActor) {
    const access = await this.resolveAccess(dto.minorProfileId, actor);
    if (!access.policy.roomsEnabled) {
      await this.auditService.record('presence.heartbeat_blocked', {
        actorRole: actor.actorRole,
        actorUserId: actor.subjectId,
        resourceType: 'room',
        resourceId: dto.roomId,
        outcome: 'blocked',
        severity: 'medium',
        metadata: {
          minorProfileId: dto.minorProfileId,
          reason: 'rooms_disabled',
        },
      });

      throw new ForbiddenException('Interaction policy blocks structured rooms for this minor');
    }

    const room = this.ensureRoomAllowed(dto.roomId, access.policy);
    const activeShell = this.resolveShell(dto.activeShell, access.policy);

    if (!access.policy.presenceEnabled) {
      await this.auditService.record('presence.heartbeat_blocked', {
        actorRole: actor.actorRole,
        actorUserId: actor.subjectId,
        resourceType: 'room',
        resourceId: room.id,
        outcome: 'blocked',
        severity: 'medium',
        metadata: {
          minorProfileId: dto.minorProfileId,
          reason: 'presence_disabled',
        },
      });

      throw new ForbiddenException('Presence monitoring is disabled for this minor');
    }

    this.upsertParticipant(room.id, dto.minorProfileId, actor, activeShell, access.accessSource);

    await this.auditService.record('presence.heartbeat', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'room',
      resourceId: room.id,
      outcome: 'success',
      severity: 'low',
      metadata: {
        minorProfileId: dto.minorProfileId,
        activeShell,
      },
    });

    return this.buildPresenceState(room, dto.minorProfileId, activeShell);
  }

  async getPresence(roomId: string, minorProfileId: string, actor: AppActor) {
    const access = await this.resolveAccess(minorProfileId, actor);
    const activeShell = this.resolveShell(undefined, access.policy);
    if (!access.policy.roomsEnabled) {
      return this.buildPresenceDisabledState(
        this.resolveFallbackRoom(roomId, access.policy, activeShell),
        minorProfileId,
        activeShell,
      );
    }

    const room = this.ensureRoomAllowed(roomId, access.policy);

    if (!access.policy.presenceEnabled) {
      return this.buildPresenceDisabledState(room, minorProfileId, activeShell);
    }

    return this.buildPresenceState(room, minorProfileId, activeShell);
  }

  private async resolveAccess(minorProfileId: string, actor: AppActor): Promise<AccessContext> {
    if (!minorProfileId) {
      throw new NotFoundException('Minor profile is required');
    }

    const policy = await this.interactionPolicyRepository.findOne({
      where: { minorProfileId },
      order: { createdAt: 'DESC' },
    });

    if (!policy) {
      throw new NotFoundException('Interaction policy not found');
    }

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
        throw new ForbiddenException('Active guardian link required');
      }

      return {
        minorProfileId,
        policy,
        accessSource: 'guardian_link',
      };
    }

    if (actor.actorRole === 'therapist') {
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
        throw new ForbiddenException('Active care-team membership required');
      }

      if (!policy.therapistParticipationAllowed) {
        throw new ForbiddenException('Interaction policy blocks therapist participation');
      }

      return {
        minorProfileId,
        policy,
        accessSource: 'care_team',
      };
    }

    throw new ForbiddenException('Actor role is not allowed to use monitored rooms');
  }

  private buildRoomCatalog(policy: InteractionPolicy) {
    const shell = policy.minorRole === 'adolescent' ? 'adolescent' : 'child';
    return RoomCatalog.filter((room) => room.ageBands.includes(policy.ageBand))
      .filter((room) => room.shells.includes(shell))
      .map((room) => ({
        id: room.id,
        title: room.title,
        description: room.description,
        audience: room.audience,
        ageBand: policy.ageBand,
        shell,
        presenceMode: room.presenceMode,
      }));
  }

  private ensureRoomAllowed(roomId: string, policy: InteractionPolicy) {
    const room = this.buildRoomCatalog(policy).find((item) => item.id === roomId);
    if (!room) {
      throw new NotFoundException('Structured room not available for this minor');
    }

    return room;
  }

  private resolveFallbackRoom(roomId: string, policy: InteractionPolicy, shell: string) {
    const room =
      RoomCatalog.find((item) => item.id === roomId) ??
      {
        id: roomId,
        title: 'Sala monitorada',
        description: 'Sala monitorada resolvida em modo de compatibilidade.',
        audience: policy.minorRole,
        ageBands: [policy.ageBand],
        shells: [shell],
        presenceMode: policy.presenceEnabled ? 'structured' : 'disabled',
      };

    return {
      id: room.id,
      title: room.title,
      description: room.description,
      audience: room.audience,
      ageBand: policy.ageBand,
      shell,
      presenceMode: room.presenceMode,
    };
  }

  private upsertParticipant(
    roomId: string,
    minorProfileId: string,
    actor: AppActor,
    activeShell: string,
    accessSource: AccessContext['accessSource'],
  ) {
    this.prunePresence();
    const participantKey = this.resolveParticipantKey(minorProfileId, actor.actorRole);
    const now = new Date().toISOString();
    const roomPresence = this.presenceByRoom.get(roomId) ?? new Map<string, PresenceParticipant>();
    const existing = roomPresence.get(participantKey);

    roomPresence.set(participantKey, {
      participantKey,
      minorProfileId,
      actorRole: actor.actorRole,
      activeShell,
      accessSource,
      joinedAt: existing?.joinedAt ?? now,
      lastHeartbeatAt: now,
    });

    this.presenceByRoom.set(roomId, roomPresence);
    return roomPresence.get(participantKey);
  }

  private buildPresenceState(
    room: { id: string; title: string; presenceMode: string },
    minorProfileId: string,
    activeShell: string,
  ) {
    this.prunePresence();
    const roomPresence = this.presenceByRoom.get(room.id);
    const participants = roomPresence ? Array.from(roomPresence.values()) : [];

    return {
      roomId: room.id,
      roomTitle: room.title,
      minorProfileId,
      activeShell,
      status: participants.length > 0 ? 'active' : 'idle',
      presenceMode: room.presenceMode,
      participantCount: participants.length,
      participants,
    };
  }

  private buildPresenceDisabledState(
    room: { id: string; title: string; presenceMode: string },
    minorProfileId: string,
    activeShell: string,
  ) {
    return {
      roomId: room.id,
      roomTitle: room.title,
      minorProfileId,
      activeShell,
      status: 'disabled',
      presenceMode: room.presenceMode,
      participantCount: 0,
      participants: [],
    };
  }

  private resolveActiveRoomId(minorProfileId: string) {
    this.prunePresence();

    for (const [roomId, participants] of this.presenceByRoom.entries()) {
      for (const participant of participants.values()) {
        if (participant.minorProfileId === minorProfileId) {
          return roomId;
        }
      }
    }

    return null;
  }

  private resolveParticipantKey(minorProfileId: string, actorRole: string) {
    return `${minorProfileId}:${actorRole}`;
  }

  private resolveShell(activeShell: string | undefined, policy: InteractionPolicy) {
    if (activeShell === 'adolescent') {
      return 'adolescent';
    }

    if (activeShell === 'child') {
      return 'child';
    }

    return policy.minorRole === 'adolescent' ? 'adolescent' : 'child';
  }

  private prunePresence() {
    const now = Date.now();

    for (const [roomId, participants] of this.presenceByRoom.entries()) {
      for (const [participantKey, participant] of participants.entries()) {
        const lastHeartbeatAt = Date.parse(participant.lastHeartbeatAt);
        if (Number.isNaN(lastHeartbeatAt) || now - lastHeartbeatAt > PresenceTtlMs) {
          participants.delete(participantKey);
        }
      }

      if (participants.size === 0) {
        this.presenceByRoom.delete(roomId);
      }
    }
  }
}
