import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../common/entities/audit-event.entity';
import { CareTeamMembership } from '../common/entities/care-team-membership.entity';
import { GuardianLink } from '../common/entities/guardian-link.entity';
import { InteractionPolicy } from '../common/entities/interaction-policy.entity';
import { ParentApproval } from '../common/entities/parent-approval.entity';
import { InvitesService } from '../invites/invites.service';
import { PresenceHeartbeatDto } from './dto/presence-heartbeat.dto';
import { RoomActionDto } from './dto/room-action.dto';

type AppActor = {
  subjectId: string;
  actorRole: string;
  email: string;
};

type AccessContext = {
  minorProfileId: string;
  policy: InteractionPolicy;
  accessSource: 'guardian_link' | 'care_team' | 'unlinked';
  guardianLinkStatus: string;
  careTeamStatus: string;
  parentApprovalStatus: string;
  adminApprovalStatus: string;
  presenceApprovalStatus: string;
  therapistLinkingStatus: string;
  roomInviteStatus: string;
  activeInviteId: string;
  inviteExpiresAt: string;
  operationalStatus: string;
  operationalMessage: string;
  lockExpiresAt: string;
  blockedBy: string[];
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
  minorRole: string;
  actorRole: string;
  actorUserId: string;
  activeShell: string;
  accessSource: string;
  joinedAt: string;
  lastHeartbeatAt: string;
};

type PresenceFilters = {
  roomId?: string;
  minorRole?: string;
  actorRole?: string;
  accessSource?: string;
};

type RuntimeEventFilters = {
  roomId?: string;
  minorProfileId?: string;
  actorRole?: string;
  eventType?: string;
};

type RoomInviteSnapshot = {
  roomId: string;
  roomTitle: string;
  status: string;
  inviteId: string;
  expiresAt: string;
};

type RuntimeOperationalLock = {
  roomId: string;
  minorProfileId: string;
  actorRole?: string;
  actorUserId?: string;
  operationalStatus: 'room_closed_admin' | 'participant_removed_admin';
  message: string;
  expiresAt: string;
  createdAt: string;
  createdByRole: string;
  createdByUserId: string;
};

type RuntimeOperationalSnapshot = {
  roomLock: RuntimeOperationalLock | null;
  participantLock: RuntimeOperationalLock | null;
  status: string;
  message: string;
  lockExpiresAt: string;
};

const PresenceTtlMs = 2 * 60 * 1000;
const OperationalLockDefaultMinutes = 15;
const RuntimeEventTypes = new Set([
  'room.joined',
  'room.left',
  'room.join_blocked',
  'room.join_blocked_invite',
  'room.join_blocked_admin_lock',
  'presence.heartbeat',
  'presence.heartbeat_blocked',
  'presence.heartbeat_blocked_invite',
  'presence.heartbeat_blocked_admin_lock',
  'presence.access_blocked_parent_approval',
  'presence.session_closed_timeout',
  'room_invite.created',
  'room_invite.accepted',
  'room_invite.revoked',
  'room_invite.expired',
  'admin.room_terminated',
  'admin.runtime_participant_removed',
]);
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
  private readonly roomLocks = new Map<string, RuntimeOperationalLock>();
  private readonly participantLocks = new Map<string, RuntimeOperationalLock>();

  constructor(
    private readonly auditService: AuditService,
    private readonly invitesService: InvitesService,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepository: Repository<GuardianLink>,
    @InjectRepository(CareTeamMembership)
    private readonly careTeamRepository: Repository<CareTeamMembership>,
    @InjectRepository(InteractionPolicy)
    private readonly interactionPolicyRepository: Repository<InteractionPolicy>,
    @InjectRepository(ParentApproval)
    private readonly parentApprovalRepository: Repository<ParentApproval>,
  ) {}

  async list(minorProfileId: string, actor: AppActor) {
    const access = await this.resolveAccess(minorProfileId, actor);
    const activeRoomId = this.resolveActiveRoomId(minorProfileId);
    const requirements = this.serializeRequirements(access);
    const operationalOnlyBlocked = this.isOperationallyBlocked(access.blockedBy);

    if (access.blockedBy.length > 0) {
      await this.auditAccessBlocked('rooms.list_blocked', actor, access, activeRoomId);
      if (this.isParentApprovalBlocked(access.blockedBy)) {
        await this.auditService.record('rooms.access_blocked_parent_approval', {
          actorRole: actor.actorRole,
          actorUserId: actor.subjectId,
          resourceType: 'minor_profile',
          resourceId: minorProfileId,
          outcome: 'blocked',
          severity: 'medium',
          metadata: {
            blockedBy: access.blockedBy.join(','),
            accessSource: access.accessSource,
          },
        });
      }

      const inviteCatalog = operationalOnlyBlocked
        ? await this.buildRoomInviteCatalog(actor, minorProfileId, access.policy)
        : null;

      return {
        allowed: false,
        reason: requirements.blockedReason,
        presenceEnabled: access.policy.presenceEnabled,
        activeRoomId,
        items: inviteCatalog ? this.buildRoomCatalog(access.policy, inviteCatalog) : [],
        requirements,
        operationalStatus: access.operationalStatus,
        operationalMessage: access.operationalMessage || requirements.blockedReason,
        lockExpiresAt: access.lockExpiresAt || null,
      };
    }

    const inviteCatalog = await this.buildRoomInviteCatalog(actor, minorProfileId, access.policy);
    const items = this.buildRoomCatalog(access.policy, inviteCatalog);

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
        roomInviteStatus: access.roomInviteStatus,
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
      requirements,
      operationalStatus: access.operationalStatus,
      operationalMessage: access.operationalMessage || null,
      lockExpiresAt: access.lockExpiresAt || null,
    };
  }

  async join(roomId: string, dto: RoomActionDto, actor: AppActor) {
    const access = await this.resolveAccess(dto.minorProfileId, actor, roomId);
    if (access.blockedBy.length > 0) {
      await this.auditAccessBlocked('room.join_blocked', actor, access, roomId);
      if (this.isParentApprovalBlocked(access.blockedBy)) {
        await this.auditService.record('rooms.access_blocked_parent_approval', {
          actorRole: actor.actorRole,
          actorUserId: actor.subjectId,
          resourceType: 'room',
          resourceId: roomId,
          outcome: 'blocked',
          severity: 'medium',
          metadata: {
            minorProfileId: dto.minorProfileId,
            blockedBy: access.blockedBy.join(','),
            accessSource: access.accessSource,
          },
        });
      }
      if (this.isRoomInviteBlocked(access.blockedBy)) {
        await this.auditService.record('room.join_blocked_invite', {
          actorRole: actor.actorRole,
          actorUserId: actor.subjectId,
          resourceType: 'room',
          resourceId: roomId,
          outcome: 'blocked',
          severity: 'medium',
          metadata: {
            minorProfileId: dto.minorProfileId,
            roomInviteStatus: access.roomInviteStatus,
            activeInviteId: access.activeInviteId,
            inviteExpiresAt: access.inviteExpiresAt,
            blockedBy: access.blockedBy.join(','),
          },
        });
      }
      if (this.isAdminOperationalBlocked(access.blockedBy)) {
        await this.auditService.record('room.join_blocked_admin_lock', {
          actorRole: actor.actorRole,
          actorUserId: actor.subjectId,
          resourceType: 'room',
          resourceId: roomId,
          outcome: 'blocked',
          severity: 'medium',
          metadata: {
            minorProfileId: dto.minorProfileId,
            blockedBy: access.blockedBy.join(','),
            lockExpiresAt: access.lockExpiresAt,
            operationalStatus: access.operationalStatus,
            operationalMessage: access.operationalMessage,
          },
        });
      }

      throw new ForbiddenException(this.serializeRequirements(access).blockedReason);
    }

    const room = this.ensureRoomAllowed(roomId, access.policy);
    const activeShell = this.resolveShell(dto.activeShell, access.policy);

    this.upsertParticipant(
      room.id,
      dto.minorProfileId,
      actor,
      activeShell,
      access.accessSource,
      access.policy.minorRole,
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
        accessSource: access.accessSource,
        activeInviteId: access.activeInviteId,
      },
    });

    return {
      allowed: true,
      reason: 'Entrada monitorada autorizada.',
      room,
      presence: this.buildPresenceState(room, dto.minorProfileId, activeShell, access),
      activeRoomId: room.id,
      requirements: this.serializeRequirements(access),
      operationalStatus: access.operationalStatus,
      operationalMessage: access.operationalMessage || null,
      lockExpiresAt: access.lockExpiresAt || null,
    };
  }

  async leave(roomId: string, dto: RoomActionDto, actor: AppActor) {
    const access = await this.resolveAccess(dto.minorProfileId, actor, roomId);
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
      allowed: access.blockedBy.length == 0,
      reason:
        access.blockedBy.length == 0
          ? 'Sala monitorada encerrada.'
          : this.serializeRequirements(access).blockedReason,
      room,
      presence:
        access.blockedBy.length == 0
          ? this.buildPresenceState(room, dto.minorProfileId, activeShell, access)
          : this.buildPresenceBlockedState(room, dto.minorProfileId, activeShell, access),
      activeRoomId: this.resolveActiveRoomId(dto.minorProfileId),
      requirements: this.serializeRequirements(access),
      operationalStatus: access.operationalStatus,
      operationalMessage: access.operationalMessage || null,
      lockExpiresAt: access.lockExpiresAt || null,
    };
  }

  async heartbeat(dto: PresenceHeartbeatDto, actor: AppActor) {
    const access = await this.resolveAccess(dto.minorProfileId, actor, dto.roomId);
    if (access.blockedBy.length > 0) {
      await this.auditAccessBlocked('presence.heartbeat_blocked', actor, access, dto.roomId);
      if (this.isParentApprovalBlocked(access.blockedBy)) {
        await this.auditService.record('presence.access_blocked_parent_approval', {
          actorRole: actor.actorRole,
          actorUserId: actor.subjectId,
          resourceType: 'room',
          resourceId: dto.roomId,
          outcome: 'blocked',
          severity: 'medium',
          metadata: {
            minorProfileId: dto.minorProfileId,
            blockedBy: access.blockedBy.join(','),
            accessSource: access.accessSource,
          },
        });
      }
      if (this.isRoomInviteBlocked(access.blockedBy)) {
        await this.auditService.record('presence.heartbeat_blocked_invite', {
          actorRole: actor.actorRole,
          actorUserId: actor.subjectId,
          resourceType: 'room',
          resourceId: dto.roomId,
          outcome: 'blocked',
          severity: 'medium',
          metadata: {
            minorProfileId: dto.minorProfileId,
            roomInviteStatus: access.roomInviteStatus,
            activeInviteId: access.activeInviteId,
            inviteExpiresAt: access.inviteExpiresAt,
            blockedBy: access.blockedBy.join(','),
          },
        });
      }
      if (this.isAdminOperationalBlocked(access.blockedBy)) {
        await this.auditService.record('presence.heartbeat_blocked_admin_lock', {
          actorRole: actor.actorRole,
          actorUserId: actor.subjectId,
          resourceType: 'room',
          resourceId: dto.roomId,
          outcome: 'blocked',
          severity: 'medium',
          metadata: {
            minorProfileId: dto.minorProfileId,
            blockedBy: access.blockedBy.join(','),
            lockExpiresAt: access.lockExpiresAt,
            operationalStatus: access.operationalStatus,
            operationalMessage: access.operationalMessage,
          },
        });
      }

      throw new ForbiddenException(this.serializeRequirements(access).blockedReason);
    }

    const room = this.ensureRoomAllowed(dto.roomId, access.policy);
    const activeShell = this.resolveShell(dto.activeShell, access.policy);

    this.upsertParticipant(
      room.id,
      dto.minorProfileId,
      actor,
      activeShell,
      access.accessSource,
      access.policy.minorRole,
    );

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
        accessSource: access.accessSource,
        activeInviteId: access.activeInviteId,
      },
    });

    return this.buildPresenceState(room, dto.minorProfileId, activeShell, access);
  }

  async getPresence(roomId: string, minorProfileId: string, actor: AppActor) {
    const access = await this.resolveAccess(minorProfileId, actor, roomId);
    const activeShell = this.resolveShell(undefined, access.policy);
    const room =
      access.policy.roomsEnabled && access.blockedBy.indexOf('rooms_disabled') == -1
        ? this.ensureRoomAllowed(roomId, access.policy)
        : this.resolveFallbackRoom(roomId, access.policy, activeShell);

    if (access.blockedBy.length > 0) {
      if (this.isParentApprovalBlocked(access.blockedBy)) {
        await this.auditService.record('presence.access_blocked_parent_approval', {
          actorRole: actor.actorRole,
          actorUserId: actor.subjectId,
          resourceType: 'room',
          resourceId: roomId,
          outcome: 'blocked',
          severity: 'medium',
          metadata: {
            minorProfileId,
            blockedBy: access.blockedBy.join(','),
            accessSource: access.accessSource,
          },
        });
      }

      return this.buildPresenceBlockedState(room, minorProfileId, activeShell, access);
    }

    return this.buildPresenceState(room, minorProfileId, activeShell, access);
  }

  async listPresenceForAdmin(
    actor: { subjectId: string; actorRole: string },
    filters: PresenceFilters = {},
  ) {
    this.prunePresence();
    this.pruneOperationalLocks();

    const rows = new Array<{
      roomId: string;
      roomTitle: string;
      minorProfileId: string;
      minorRole: string;
      actorRole: string;
      actorUserId: string;
      accessSource: string;
      activeShell: string;
      joinedAt: string;
      lastHeartbeatAt: string;
    }>();

    for (const [roomId, participants] of this.presenceByRoom.entries()) {
      const roomTitle = this.resolveAdminRoomTitle(roomId);
      for (const participant of participants.values()) {
        rows.push({
          roomId,
          roomTitle,
          minorProfileId: participant.minorProfileId,
          minorRole: participant.minorRole,
          actorRole: participant.actorRole,
          actorUserId: participant.actorUserId,
          accessSource: participant.accessSource,
          activeShell: participant.activeShell,
          joinedAt: participant.joinedAt,
          lastHeartbeatAt: participant.lastHeartbeatAt,
        });
      }
    }

    const filtered = rows.filter((row) => {
      if (filters.roomId && row.roomId !== filters.roomId) {
        return false;
      }

      if (filters.minorRole && row.minorRole !== filters.minorRole) {
        return false;
      }

      if (filters.actorRole && row.actorRole !== filters.actorRole) {
        return false;
      }

      if (filters.accessSource && row.accessSource !== filters.accessSource) {
        return false;
      }

      return true;
    });

    await this.auditService.record('admin.rooms_presence_viewed', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'presence_runtime',
      resourceId: filters.roomId ?? 'all',
      outcome: 'success',
      severity: 'low',
      metadata: {
        roomId: filters.roomId ?? '',
        minorRole: filters.minorRole ?? '',
        actorRoleFilter: filters.actorRole ?? '',
        accessSource: filters.accessSource ?? '',
        resultCount: filtered.length,
      },
    });

    return filtered;
  }

  async listRuntimeEventsForAdmin(
    actor: { subjectId: string; actorRole: string },
    filters: RuntimeEventFilters = {},
  ) {
    const events = await this.auditEventRepository.find({
      order: { occurredAt: 'DESC' },
      take: 400,
    });

    const rows = events
      .filter((event) => RuntimeEventTypes.has(event.eventType))
      .map((event) => this.serializeRuntimeEvent(event))
      .filter((event) => {
        if (filters.roomId && event.roomId !== filters.roomId) {
          return false;
        }

        if (filters.minorProfileId && event.minorProfileId !== filters.minorProfileId) {
          return false;
        }

        if (filters.actorRole && event.actorRole !== filters.actorRole) {
          return false;
        }

        if (filters.eventType && event.eventType !== filters.eventType) {
          return false;
        }

        return true;
      });

    await this.auditService.record('admin.rooms_events_viewed', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'presence_runtime',
      resourceId: filters.roomId ?? 'all',
      outcome: 'success',
      severity: 'low',
      metadata: {
        roomId: filters.roomId ?? '',
        minorProfileId: filters.minorProfileId ?? '',
        actorRoleFilter: filters.actorRole ?? '',
        eventType: filters.eventType ?? '',
        resultCount: rows.length,
      },
    });

    return rows;
  }

  async getRoomSnapshotForAdmin(
    roomId: string,
    minorProfileId: string,
    actor: { subjectId: string; actorRole: string },
  ) {
    if (!minorProfileId) {
      throw new NotFoundException('Minor profile is required');
    }

    this.prunePresence();
    this.pruneOperationalLocks();

    const policy = await this.interactionPolicyRepository.findOne({
      where: { minorProfileId },
      order: { createdAt: 'DESC' },
    });

    if (!policy) {
      throw new NotFoundException('Interaction policy not found');
    }

    const room =
      policy.roomsEnabled
        ? this.ensureRoomAllowed(roomId, policy)
        : this.resolveFallbackRoom(roomId, policy, policy.minorRole === 'adolescent' ? 'adolescent' : 'child');
    const participants = this.resolveParticipantsForRoom(room.id, minorProfileId).map(
      (participant) => ({
        roomId: room.id,
        roomTitle: room.title,
        minorProfileId: participant.minorProfileId,
        minorRole: participant.minorRole,
        actorRole: participant.actorRole,
        actorUserId: participant.actorUserId,
        accessSource: participant.accessSource,
        activeShell: participant.activeShell,
        joinedAt: participant.joinedAt,
        lastHeartbeatAt: participant.lastHeartbeatAt,
      }),
    );
    const invite = await this.resolveLatestRoomInviteStateForAdmin(minorProfileId, room.id);
    const lock = this.resolveOperationalLockSnapshot(minorProfileId, {
      subjectId: '',
      actorRole: 'parent_guardian',
      email: '',
    }, room.id);
    const lastHeartbeatAt =
      participants.length > 0
        ? participants
            .map((item) => item.lastHeartbeatAt)
            .sort((left, right) => Date.parse(right) - Date.parse(left))[0]
        : null;

    await this.auditService.record('admin.room_snapshot_viewed', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'room',
      resourceId: room.id,
      outcome: 'success',
      severity: 'low',
      metadata: {
        minorProfileId,
        participantCount: participants.length,
        activeInviteId: invite.inviteId,
        roomInviteStatus: invite.status,
        operationalStatus: lock.status,
      },
    });

    return {
      roomId: room.id,
      roomTitle: room.title,
      roomDescription: room.description,
      presenceMode: room.presenceMode,
      minorProfileId,
      minorRole: policy.minorRole,
      ageBand: policy.ageBand,
      activeInviteId: invite.inviteId || null,
      roomInviteStatus: invite.status,
      inviteExpiresAt: invite.expiresAt || null,
      operationalStatus: lock.status,
      operationalMessage: lock.message || null,
      lockExpiresAt: lock.lockExpiresAt || null,
      participantCount: participants.length,
      participants,
      lastHeartbeatAt,
      policySnapshot: {
        minorProfileId: policy.minorProfileId,
        minorRole: policy.minorRole,
        ageBand: policy.ageBand,
        roomsEnabled: policy.roomsEnabled,
        presenceEnabled: policy.presenceEnabled,
        messagingMode: policy.messagingMode,
        therapistParticipationAllowed: policy.therapistParticipationAllowed,
      },
    };
  }

  async terminateRoomForAdmin(
    roomId: string,
    body: { minorProfileId: string; lockMinutes?: number; message?: string },
    actor: { subjectId: string; actorRole: string },
  ) {
    const snapshot = await this.getRoomSnapshotForAdmin(roomId, body.minorProfileId, actor);
    const lock = this.createRoomLock(snapshot.roomId, snapshot.minorProfileId, actor, {
      lockMinutes: body.lockMinutes,
      message:
        body.message?.trim() ||
        'Sala pausada temporariamente pela operacao. Aguarde a liberacao administrativa.',
    });

    this.removeParticipantsMatching(snapshot.roomId, snapshot.minorProfileId, () => true);

    await this.auditService.record('admin.room_terminated', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'room',
      resourceId: snapshot.roomId,
      outcome: 'success',
      severity: 'high',
      metadata: {
        minorProfileId: snapshot.minorProfileId,
        minorRole: snapshot.minorRole,
        roomTitle: snapshot.roomTitle,
        lockExpiresAt: lock.expiresAt,
        removedParticipants: snapshot.participantCount,
        operationalMessage: lock.message,
      },
    });

    return this.getRoomSnapshotForAdmin(roomId, body.minorProfileId, actor);
  }

  async removeParticipantForAdmin(
    roomId: string,
    body: {
      minorProfileId: string;
      actorRole: string;
      actorUserId?: string;
      lockMinutes?: number;
      message?: string;
    },
    actor: { subjectId: string; actorRole: string },
  ) {
    const snapshot = await this.getRoomSnapshotForAdmin(roomId, body.minorProfileId, actor);
    const target = snapshot.participants.find((participant) => {
      if (participant.actorRole !== body.actorRole) {
        return false;
      }

      if (body.actorUserId && participant.actorUserId !== body.actorUserId) {
        return false;
      }

      return true;
    });

    if (!target && !body.actorUserId) {
      throw new NotFoundException('Runtime participant not found');
    }

    const actorUserId = body.actorUserId || target?.actorUserId;
    const lock = this.createParticipantLock(roomId, body.minorProfileId, body.actorRole, actorUserId, actor, {
      lockMinutes: body.lockMinutes,
      message:
        body.message?.trim() ||
        'Participacao encerrada temporariamente pela operacao. Aguarde nova liberacao.',
    });

    if (target) {
      this.removeParticipantsMatching(roomId, body.minorProfileId, (participant) => {
        if (participant.actorRole !== body.actorRole) {
          return false;
        }

        if (actorUserId && participant.actorUserId !== actorUserId) {
          return false;
        }

        return true;
      });
    }

    await this.auditService.record('admin.runtime_participant_removed', {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'room',
      resourceId: roomId,
      outcome: 'success',
      severity: 'high',
      metadata: {
        minorProfileId: body.minorProfileId,
        targetActorRole: body.actorRole,
        targetActorUserId: actorUserId ?? '',
        lockExpiresAt: lock.expiresAt,
        operationalMessage: lock.message,
      },
    });

    return this.getRoomSnapshotForAdmin(roomId, body.minorProfileId, actor);
  }

  private async resolveAccess(
    minorProfileId: string,
    actor: AppActor,
    roomId?: string,
  ): Promise<AccessContext> {
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

    if (actor.actorRole !== 'parent_guardian' && actor.actorRole !== 'therapist') {
      throw new ForbiddenException('Actor role is not allowed to use monitored rooms');
    }

    let accessSource: AccessContext['accessSource'] = 'unlinked';
    let guardianLinkStatus = 'missing';
    let careTeamStatus = 'missing';
    let parentApprovalStatus = 'missing';
    let adminApprovalStatus = 'missing';
    let parentUserId = '';

    if (actor.actorRole === 'parent_guardian') {
      const guardianLink = await this.guardianLinkRepository.findOne({
        where: {
          parentUserId: actor.subjectId,
          minorProfileId,
          status: 'active',
        },
        order: { createdAt: 'DESC' },
      });

      guardianLinkStatus = guardianLink ? 'active' : 'missing';
      accessSource = guardianLink ? 'guardian_link' : 'unlinked';
      parentUserId = actor.subjectId;
    } else {
      const membership = await this.careTeamRepository.findOne({
        where: {
          therapistUserId: actor.subjectId,
          minorProfileId,
        },
        order: { createdAt: 'DESC' },
      });

      if (membership) {
        accessSource = 'care_team';
        careTeamStatus = membership.status ?? 'pending';
        parentApprovalStatus = membership.parentApprovalStatus ?? 'pending';
        adminApprovalStatus = membership.adminApprovalStatus ?? 'pending';
        parentUserId = membership.parentUserId ?? '';
      }
    }

    const presenceApprovalStatus = parentUserId
      ? await this.resolveApprovalStatus(parentUserId, minorProfileId, 'presence_enabled')
      : 'missing';
    const therapistLinkingStatus = parentUserId
      ? await this.resolveApprovalStatus(parentUserId, minorProfileId, 'therapist_linking')
      : 'missing';
    const inviteSnapshot = await this.resolveLatestRoomInviteState(actor, minorProfileId, roomId);
    const operationalLock = this.resolveOperationalLockSnapshot(minorProfileId, actor, roomId);

    const blockedBy: string[] = [];

    if (operationalLock.roomLock) {
      blockedBy.push('room_closed_admin');
    }

    if (operationalLock.participantLock) {
      blockedBy.push('participant_removed_admin');
    }

    if (actor.actorRole === 'parent_guardian' && guardianLinkStatus !== 'active') {
      blockedBy.push('guardian_link_required');
    }

    if (actor.actorRole === 'therapist') {
      if (careTeamStatus === 'missing') {
        blockedBy.push('care_team_required');
      }
      if (parentApprovalStatus !== 'approved') {
        blockedBy.push('care_team_parent_approval_required');
      }
      if (adminApprovalStatus !== 'approved') {
        blockedBy.push('care_team_admin_approval_required');
      }
      if (careTeamStatus !== 'active') {
        blockedBy.push('care_team_inactive');
      }
      if (therapistLinkingStatus !== 'active') {
        blockedBy.push('therapist_linking_required');
      }
      if (!policy.therapistParticipationAllowed) {
        blockedBy.push('therapist_participation_disabled');
      }
      if (inviteSnapshot.status !== 'accepted') {
        if (inviteSnapshot.status === 'expired') {
          blockedBy.push('room_invite_expired');
        } else if (inviteSnapshot.status === 'revoked') {
          blockedBy.push('room_invite_revoked');
        } else {
          blockedBy.push('room_invite_required');
        }
      }
    }

    if (presenceApprovalStatus !== 'active') {
      blockedBy.push('presence_enabled_required');
    }

    if (!policy.roomsEnabled) {
      blockedBy.push('rooms_disabled');
    }

    if (!policy.presenceEnabled) {
      blockedBy.push('presence_disabled');
    }

    return {
      minorProfileId,
      policy,
      accessSource,
      guardianLinkStatus,
      careTeamStatus,
      parentApprovalStatus,
      adminApprovalStatus,
      presenceApprovalStatus,
      therapistLinkingStatus,
      roomInviteStatus: inviteSnapshot.status,
      activeInviteId: inviteSnapshot.inviteId,
      inviteExpiresAt: inviteSnapshot.expiresAt,
      operationalStatus: operationalLock.status,
      operationalMessage: operationalLock.message,
      lockExpiresAt: operationalLock.lockExpiresAt,
      blockedBy,
    };
  }

  private buildBaseRoomCatalog(policy: InteractionPolicy) {
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

  private buildRoomCatalog(
    policy: InteractionPolicy,
    inviteCatalog: Map<string, RoomInviteSnapshot> = new Map<string, RoomInviteSnapshot>(),
  ) {
    return this.buildBaseRoomCatalog(policy).map((room) => {
      const invite = inviteCatalog.get(room.id);
      return {
        ...room,
        inviteStatus: invite?.status ?? 'missing',
        activeInviteId: invite?.inviteId ?? null,
        inviteExpiresAt: invite?.expiresAt ?? null,
      };
    });
  }

  private ensureRoomAllowed(roomId: string, policy: InteractionPolicy) {
    const room = this.buildBaseRoomCatalog(policy).find((item) => item.id === roomId);
    if (!room) {
      throw new NotFoundException('Structured room not available for this minor');
    }

    return room;
  }

  private resolveFallbackRoom(roomId: string, policy: InteractionPolicy, shell: string) {
    const room =
      RoomCatalog.find((item) => item.id === roomId) ?? {
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

  private async buildRoomInviteCatalog(
    actor: AppActor,
    minorProfileId: string,
    policy: InteractionPolicy,
  ) {
    const roomIds = new Set(this.buildBaseRoomCatalog(policy).map((room) => room.id));
    const invites = await this.invitesService.list(actor, {
      minorProfileId,
      inviteType: 'monitored_room',
    });
    const catalog = new Map<string, RoomInviteSnapshot>();

    for (const invite of invites) {
      const roomId = this.resolveMetadataString(invite.metadata, 'roomId');
      const roomTitle = this.resolveMetadataString(invite.metadata, 'roomTitle');
      if (!roomId || !roomIds.has(roomId) || catalog.has(roomId)) {
        continue;
      }

      catalog.set(roomId, {
        roomId,
        roomTitle: roomTitle || this.resolveAdminRoomTitle(roomId),
        status: invite.status,
        inviteId: invite.id,
        expiresAt: invite.expiresAt?.toISOString?.() ?? '',
      });
    }

    return catalog;
  }

  private async resolveLatestRoomInviteState(
    actor: AppActor,
    minorProfileId: string,
    roomId?: string,
  ): Promise<RoomInviteSnapshot> {
    const invites = await this.invitesService.list(actor, {
      minorProfileId,
      inviteType: 'monitored_room',
      ...(roomId ? { roomId } : {}),
    });

    const invite = invites[0];
    if (!invite) {
      return {
        roomId: roomId ?? '',
        roomTitle: roomId ? this.resolveAdminRoomTitle(roomId) : '',
        status: 'missing',
        inviteId: '',
        expiresAt: '',
      };
    }

    const resolvedRoomId = this.resolveMetadataString(invite.metadata, 'roomId');
    const resolvedRoomTitle = this.resolveMetadataString(invite.metadata, 'roomTitle');
    return {
      roomId: resolvedRoomId || roomId || '',
      roomTitle: resolvedRoomTitle || this.resolveAdminRoomTitle(resolvedRoomId || roomId || ''),
      status: invite.status,
      inviteId: invite.id,
      expiresAt: invite.expiresAt?.toISOString?.() ?? '',
    };
  }

  private async resolveLatestRoomInviteStateForAdmin(
    minorProfileId: string,
    roomId: string,
  ): Promise<RoomInviteSnapshot> {
    const invites = await this.invitesService.listAsAdmin({
      minorProfileId,
      inviteType: 'monitored_room',
      roomId,
    });

    const invite = invites[0];
    if (!invite) {
      return {
        roomId,
        roomTitle: this.resolveAdminRoomTitle(roomId),
        status: 'missing',
        inviteId: '',
        expiresAt: '',
      };
    }

    const resolvedRoomId = this.resolveMetadataString(invite.metadata, 'roomId');
    const resolvedRoomTitle = this.resolveMetadataString(invite.metadata, 'roomTitle');
    return {
      roomId: resolvedRoomId || roomId,
      roomTitle: resolvedRoomTitle || this.resolveAdminRoomTitle(resolvedRoomId || roomId),
      status: invite.status,
      inviteId: invite.id,
      expiresAt: invite.expiresAt?.toISOString?.() ?? '',
    };
  }

  private upsertParticipant(
    roomId: string,
    minorProfileId: string,
    actor: AppActor,
    activeShell: string,
    accessSource: AccessContext['accessSource'],
    minorRole: string,
  ) {
    this.prunePresence();
    const participantKey = this.resolveParticipantKey(minorProfileId, actor.actorRole);
    const now = new Date().toISOString();
    const roomPresence = this.presenceByRoom.get(roomId) ?? new Map<string, PresenceParticipant>();
    const existing = roomPresence.get(participantKey);

    roomPresence.set(participantKey, {
      participantKey,
      minorProfileId,
      minorRole,
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
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
    access: AccessContext,
  ) {
    this.prunePresence();
    const roomPresence = this.presenceByRoom.get(room.id);
    const participants = roomPresence ? Array.from(roomPresence.values()) : [];

    return {
      allowed: true,
      reason:
        participants.length > 0
          ? 'Presenca monitorada ativa.'
          : 'Presenca pronta para heartbeat.',
      requirements: this.serializeRequirements(access),
      roomId: room.id,
      roomTitle: room.title,
      minorProfileId,
      activeShell,
      status: participants.length > 0 ? 'active' : 'idle',
      presenceMode: room.presenceMode,
      participantCount: participants.length,
      participants,
      operationalStatus: access.operationalStatus,
      operationalMessage: access.operationalMessage || null,
      lockExpiresAt: access.lockExpiresAt || null,
    };
  }

  private buildPresenceBlockedState(
    room: { id: string; title: string; presenceMode: string },
    minorProfileId: string,
    activeShell: string,
    access: AccessContext,
  ) {
    return {
      allowed: false,
      reason: this.serializeRequirements(access).blockedReason,
      requirements: this.serializeRequirements(access),
      roomId: room.id,
      roomTitle: room.title,
      minorProfileId,
      activeShell,
      status: 'blocked',
      presenceMode: room.presenceMode,
      participantCount: 0,
      participants: [],
      operationalStatus: access.operationalStatus,
      operationalMessage: access.operationalMessage || null,
      lockExpiresAt: access.lockExpiresAt || null,
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

  private async resolveApprovalStatus(
    parentUserId: string,
    targetId: string,
    approvalType: string,
  ) {
    const approval = await this.parentApprovalRepository.findOne({
      where: {
        parentUserId,
        targetId,
        approvalType,
        status: 'active',
        decision: 'granted',
      },
      order: { updatedAt: 'DESC' },
    });

    return approval ? 'active' : 'missing';
  }

  private serializeRequirements(access: AccessContext) {
    return {
      guardianLinkStatus: access.guardianLinkStatus,
      careTeamStatus: access.careTeamStatus,
      parentApprovalStatus: access.parentApprovalStatus,
      adminApprovalStatus: access.adminApprovalStatus,
      presenceApprovalStatus: access.presenceApprovalStatus,
      therapistLinkingStatus: access.therapistLinkingStatus,
      roomInviteStatus: access.roomInviteStatus,
      activeInviteId: access.activeInviteId || null,
      inviteExpiresAt: access.inviteExpiresAt || null,
      policySnapshot: {
        minorProfileId: access.policy.minorProfileId,
        minorRole: access.policy.minorRole,
        ageBand: access.policy.ageBand,
        roomsEnabled: access.policy.roomsEnabled,
        presenceEnabled: access.policy.presenceEnabled,
        messagingMode: access.policy.messagingMode,
        therapistParticipationAllowed: access.policy.therapistParticipationAllowed,
      },
      accessSource: access.accessSource,
      operationalStatus: access.operationalStatus,
      operationalMessage: access.operationalMessage || null,
      lockExpiresAt: access.lockExpiresAt || null,
      blockedBy: access.blockedBy,
      blockedReason: this.buildBlockedReason(access),
    };
  }

  private buildBlockedReason(access: AccessContext) {
    const { blockedBy } = access;

    if (blockedBy.includes('room_closed_admin')) {
      return access.operationalMessage || 'A sala foi pausada temporariamente pela operacao.';
    }

    if (blockedBy.includes('participant_removed_admin')) {
      return access.operationalMessage || 'Sua participacao foi encerrada temporariamente pela operacao.';
    }

    if (blockedBy.includes('guardian_link_required')) {
      return 'Este menor precisa de GuardianLink ativo antes de usar salas monitoradas.';
    }

    if (blockedBy.includes('presence_enabled_required')) {
      return 'A presenca estruturada ainda precisa de aprovacao explicita do responsavel em /pais.';
    }

    if (blockedBy.includes('care_team_required')) {
      return 'O terapeuta ainda nao possui care-team valido para este menor.';
    }

    if (blockedBy.includes('care_team_parent_approval_required')) {
      return 'O pedido clinico ainda depende da aprovacao do responsavel.';
    }

    if (blockedBy.includes('care_team_admin_approval_required')) {
      return 'O pedido clinico ainda depende da aprovacao administrativa.';
    }

    if (blockedBy.includes('care_team_inactive')) {
      return 'O vinculo clinico ainda nao esta ativo para este menor.';
    }

    if (blockedBy.includes('therapist_linking_required')) {
      return 'A participacao do terapeuta ainda precisa de aprovacao explicita do responsavel.';
    }

    if (blockedBy.includes('therapist_participation_disabled')) {
      return 'A policy atual nao autoriza participacao clinica no runtime monitorado.';
    }

    if (blockedBy.includes('room_invite_expired')) {
      return 'O convite terapeutico desta sala expirou. Reenvie um novo convite em /pais.';
    }

    if (blockedBy.includes('room_invite_revoked')) {
      return 'O convite terapeutico desta sala foi revogado. O responsavel precisa liberar um novo convite.';
    }

    if (blockedBy.includes('room_invite_required')) {
      if (access.roomInviteStatus === 'pending') {
        return 'O convite desta sala ja foi enviado e ainda aguarda o aceite do terapeuta.';
      }

      return 'O terapeuta ainda precisa de convite explicito para participar desta sala.';
    }

    if (blockedBy.includes('rooms_disabled')) {
      return 'A policy atual bloqueia salas estruturadas para este menor.';
    }

    if (blockedBy.includes('presence_disabled')) {
      return 'A policy atual bloqueia presenca monitorada para este menor.';
    }

    return 'O runtime monitorado ainda nao esta liberado para este contexto.';
  }

  private isParentApprovalBlocked(blockedBy: string[]) {
    return (
      blockedBy.includes('presence_enabled_required') ||
      blockedBy.includes('therapist_linking_required')
    );
  }

  private isRoomInviteBlocked(blockedBy: string[]) {
    return (
      blockedBy.includes('room_invite_required') ||
      blockedBy.includes('room_invite_expired') ||
      blockedBy.includes('room_invite_revoked')
    );
  }

  private isAdminOperationalBlocked(blockedBy: string[]) {
    return (
      blockedBy.includes('room_closed_admin') || blockedBy.includes('participant_removed_admin')
    );
  }

  private isOperationallyBlocked(blockedBy: string[]) {
    return (
      blockedBy.length > 0 &&
      blockedBy.every(
        (item) => item === 'room_closed_admin' || item === 'participant_removed_admin',
      )
    );
  }

  private async auditAccessBlocked(
    eventType: string,
    actor: AppActor,
    access: AccessContext,
    resourceId: string | null,
  ) {
    await this.auditService.record(eventType, {
      actorRole: actor.actorRole,
      actorUserId: actor.subjectId,
      resourceType: 'room',
      resourceId: resourceId ?? access.minorProfileId,
      outcome: 'blocked',
      severity: 'medium',
      metadata: {
        minorProfileId: access.minorProfileId,
        blockedBy: access.blockedBy.join(','),
        accessSource: access.accessSource,
        roomInviteStatus: access.roomInviteStatus,
        activeInviteId: access.activeInviteId,
        lockExpiresAt: access.lockExpiresAt,
        operationalStatus: access.operationalStatus,
        operationalMessage: access.operationalMessage,
      },
    });
  }

  private serializeRuntimeEvent(event: AuditEvent) {
    const roomId =
      event.resourceType === 'room'
        ? event.resourceId ?? ''
        : this.resolveMetadataString(event.metadata, 'roomId');
    const inviteId = event.resourceType === 'invite' ? event.resourceId ?? '' : '';
    const minorProfileId = this.resolveMetadataString(event.metadata, 'minorProfileId');
    const minorRole = this.resolveMetadataString(event.metadata, 'minorRole');
    const accessSource = this.resolveMetadataString(event.metadata, 'accessSource');
    const blockedBy = this.resolveMetadataString(event.metadata, 'blockedBy');
    const activeShell = this.resolveMetadataString(event.metadata, 'activeShell');
    const inviteExpiresAt = this.resolveMetadataString(event.metadata, 'inviteExpiresAt');
    const lockExpiresAt = this.resolveMetadataString(event.metadata, 'lockExpiresAt');
    const roomTitle =
      this.resolveMetadataString(event.metadata, 'roomTitle') ||
      this.resolveAdminRoomTitle(roomId);

    return {
      id: event.id,
      eventType: event.eventType,
      actorRole: event.actorRole,
      actorUserId: event.actorUserId ?? null,
      resourceType: event.resourceType,
      resourceId: event.resourceId ?? null,
      outcome: event.outcome,
      severity: event.severity,
      occurredAt: event.occurredAt,
      roomId,
      roomTitle,
      minorProfileId,
      minorRole,
      accessSource,
      activeShell,
      activeInviteId: inviteId || this.resolveMetadataString(event.metadata, 'activeInviteId'),
      inviteExpiresAt: inviteExpiresAt || null,
      lockExpiresAt: lockExpiresAt || null,
      blockedBy: blockedBy ? blockedBy.split(',').filter(Boolean) : [],
      summary: this.buildRuntimeEventSummary(event.eventType, roomTitle, event.metadata),
    };
  }

  private buildRuntimeEventSummary(
    eventType: string,
    roomTitle: string,
    metadata: Record<string, string | number | boolean | null> | null | undefined,
  ) {
    switch (eventType) {
      case 'room_invite.created':
        return `Convite de runtime criado para ${roomTitle}.`;
      case 'room_invite.accepted':
        return `Convite de runtime aceito para ${roomTitle}.`;
      case 'room_invite.revoked':
        return `Convite de runtime revogado para ${roomTitle}.`;
      case 'room_invite.expired':
        return `Convite de runtime expirado para ${roomTitle}.`;
      case 'room.joined':
        return `Entrada monitorada liberada em ${roomTitle}.`;
      case 'room.join_blocked_invite':
        return `Entrada bloqueada por convite em ${roomTitle}.`;
      case 'room.join_blocked_admin_lock':
        return `Entrada bloqueada por lock operacional em ${roomTitle}.`;
      case 'presence.heartbeat':
        return `Heartbeat recebido em ${roomTitle}.`;
      case 'presence.heartbeat_blocked_invite':
        return `Heartbeat bloqueado por convite em ${roomTitle}.`;
      case 'presence.heartbeat_blocked_admin_lock':
        return `Heartbeat bloqueado por lock operacional em ${roomTitle}.`;
      case 'presence.session_closed_timeout':
        return `Sessao encerrada por ausencia de heartbeat em ${roomTitle}.`;
      case 'admin.room_terminated':
        return `Sala encerrada operacionalmente em ${roomTitle}.`;
      case 'admin.runtime_participant_removed':
        return `Participante removido operacionalmente em ${roomTitle}.`;
      default:
        return this.resolveMetadataString(metadata, 'blockedReason') || `Evento operacional em ${roomTitle}.`;
    }
  }

  private resolveAdminRoomTitle(roomId: string) {
    const room = RoomCatalog.find((item) => item.id === roomId);
    return room?.title ?? 'Sala monitorada';
  }

  private resolveMetadataString(
    metadata: Record<string, string | number | boolean | null> | null | undefined,
    key: string,
  ) {
    const value = metadata?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
  }

  private prunePresence() {
    const now = Date.now();

    for (const [roomId, participants] of this.presenceByRoom.entries()) {
      for (const [participantKey, participant] of participants.entries()) {
        const lastHeartbeatAt = Date.parse(participant.lastHeartbeatAt);
        if (Number.isNaN(lastHeartbeatAt) || now - lastHeartbeatAt > PresenceTtlMs) {
          participants.delete(participantKey);
          void this.auditService.record('presence.session_closed_timeout', {
            actorRole: participant.actorRole,
            actorUserId: participant.actorUserId,
            resourceType: 'room',
            resourceId: roomId,
            outcome: 'success',
            severity: 'low',
            metadata: {
              minorProfileId: participant.minorProfileId,
              minorRole: participant.minorRole,
              activeShell: participant.activeShell,
              accessSource: participant.accessSource,
              roomTitle: this.resolveAdminRoomTitle(roomId),
            },
          });
        }
      }

      if (participants.size === 0) {
        this.presenceByRoom.delete(roomId);
      }
    }
  }

  private pruneOperationalLocks() {
    const now = Date.now();

    for (const [key, lock] of this.roomLocks.entries()) {
      const expiresAt = Date.parse(lock.expiresAt);
      if (!Number.isNaN(expiresAt) && expiresAt <= now) {
        this.roomLocks.delete(key);
      }
    }

    for (const [key, lock] of this.participantLocks.entries()) {
      const expiresAt = Date.parse(lock.expiresAt);
      if (!Number.isNaN(expiresAt) && expiresAt <= now) {
        this.participantLocks.delete(key);
      }
    }
  }

  private resolveOperationalLockSnapshot(
    minorProfileId: string,
    actor: AppActor,
    roomId?: string,
  ): RuntimeOperationalSnapshot {
    this.pruneOperationalLocks();

    const roomLock = roomId
      ? this.roomLocks.get(this.buildRoomLockKey(roomId, minorProfileId)) ?? null
      : this.findLatestRoomLock(minorProfileId);
    const participantLock =
      actor.subjectId && actor.actorRole
        ? roomId
          ? this.participantLocks.get(
              this.buildParticipantLockKey(roomId, minorProfileId, actor.actorRole, actor.subjectId),
            ) ?? null
          : this.findLatestParticipantLock(minorProfileId, actor.actorRole, actor.subjectId)
        : null;

    if (roomLock) {
      return {
        roomLock,
        participantLock,
        status: roomLock.operationalStatus,
        message: roomLock.message,
        lockExpiresAt: roomLock.expiresAt,
      };
    }

    if (participantLock) {
      return {
        roomLock,
        participantLock,
        status: participantLock.operationalStatus,
        message: participantLock.message,
        lockExpiresAt: participantLock.expiresAt,
      };
    }

    return {
      roomLock: null,
      participantLock: null,
      status: 'open',
      message: '',
      lockExpiresAt: '',
    };
  }

  private createRoomLock(
    roomId: string,
    minorProfileId: string,
    actor: { subjectId: string; actorRole: string },
    options: { lockMinutes?: number; message: string },
  ) {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.resolveOperationalLockMinutes(options.lockMinutes) * 60 * 1000,
    ).toISOString();
    const lock: RuntimeOperationalLock = {
      roomId,
      minorProfileId,
      operationalStatus: 'room_closed_admin',
      message: options.message,
      expiresAt,
      createdAt: now.toISOString(),
      createdByRole: actor.actorRole,
      createdByUserId: actor.subjectId,
    };

    this.roomLocks.set(this.buildRoomLockKey(roomId, minorProfileId), lock);
    return lock;
  }

  private createParticipantLock(
    roomId: string,
    minorProfileId: string,
    actorRole: string,
    actorUserId: string | undefined,
    actor: { subjectId: string; actorRole: string },
    options: { lockMinutes?: number; message: string },
  ) {
    if (!actorUserId) {
      throw new NotFoundException('Participant user is required');
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.resolveOperationalLockMinutes(options.lockMinutes) * 60 * 1000,
    ).toISOString();
    const lock: RuntimeOperationalLock = {
      roomId,
      minorProfileId,
      actorRole,
      actorUserId,
      operationalStatus: 'participant_removed_admin',
      message: options.message,
      expiresAt,
      createdAt: now.toISOString(),
      createdByRole: actor.actorRole,
      createdByUserId: actor.subjectId,
    };

    this.participantLocks.set(
      this.buildParticipantLockKey(roomId, minorProfileId, actorRole, actorUserId),
      lock,
    );
    return lock;
  }

  private resolveOperationalLockMinutes(lockMinutes?: number) {
    if (typeof lockMinutes !== 'number' || Number.isNaN(lockMinutes) || lockMinutes <= 0) {
      return OperationalLockDefaultMinutes;
    }

    return lockMinutes;
  }

  private buildRoomLockKey(roomId: string, minorProfileId: string) {
    return `${roomId}:${minorProfileId}`;
  }

  private buildParticipantLockKey(
    roomId: string,
    minorProfileId: string,
    actorRole: string,
    actorUserId: string,
  ) {
    return `${roomId}:${minorProfileId}:${actorRole}:${actorUserId}`;
  }

  private findLatestRoomLock(minorProfileId: string) {
    let selected: RuntimeOperationalLock | null = null;

    for (const lock of this.roomLocks.values()) {
      if (lock.minorProfileId !== minorProfileId) {
        continue;
      }

      if (!selected || Date.parse(lock.createdAt) > Date.parse(selected.createdAt)) {
        selected = lock;
      }
    }

    return selected;
  }

  private findLatestParticipantLock(
    minorProfileId: string,
    actorRole: string,
    actorUserId: string,
  ) {
    let selected: RuntimeOperationalLock | null = null;

    for (const lock of this.participantLocks.values()) {
      if (
        lock.minorProfileId !== minorProfileId ||
        lock.actorRole !== actorRole ||
        lock.actorUserId !== actorUserId
      ) {
        continue;
      }

      if (!selected || Date.parse(lock.createdAt) > Date.parse(selected.createdAt)) {
        selected = lock;
      }
    }

    return selected;
  }

  private resolveParticipantsForRoom(roomId: string, minorProfileId: string) {
    this.prunePresence();
    const roomPresence = this.presenceByRoom.get(roomId);
    if (!roomPresence) {
      return [];
    }

    return Array.from(roomPresence.values()).filter(
      (participant) => participant.minorProfileId === minorProfileId,
    );
  }

  private removeParticipantsMatching(
    roomId: string,
    minorProfileId: string,
    predicate: (participant: PresenceParticipant) => boolean,
  ) {
    const roomPresence = this.presenceByRoom.get(roomId);
    if (!roomPresence) {
      return;
    }

    for (const [participantKey, participant] of roomPresence.entries()) {
      if (participant.minorProfileId !== minorProfileId) {
        continue;
      }

      if (!predicate(participant)) {
        continue;
      }

      roomPresence.delete(participantKey);
    }

    if (roomPresence.size === 0) {
      this.presenceByRoom.delete(roomId);
    }
  }
}
