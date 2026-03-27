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
import { ParentApproval } from '../common/entities/parent-approval.entity';
import { PresenceHeartbeatDto } from './dto/presence-heartbeat.dto';
import { RoomActionDto } from './dto/room-action.dto';

type AppActor = {
  subjectId: string;
  actorRole: string;
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
    @InjectRepository(ParentApproval)
    private readonly parentApprovalRepository: Repository<ParentApproval>,
  ) {}

  async list(minorProfileId: string, actor: AppActor) {
    const access = await this.resolveAccess(minorProfileId, actor);
    const activeRoomId = this.resolveActiveRoomId(minorProfileId);
    const requirements = this.serializeRequirements(access);

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

      return {
        allowed: false,
        reason: requirements.blockedReason,
        presenceEnabled: access.policy.presenceEnabled,
        activeRoomId,
        items: [],
        requirements,
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
      requirements,
    };
  }

  async join(roomId: string, dto: RoomActionDto, actor: AppActor) {
    const access = await this.resolveAccess(dto.minorProfileId, actor);
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
      },
    });

    return {
      allowed: true,
      reason: 'Entrada monitorada autorizada.',
      room,
      presence: this.buildPresenceState(room, dto.minorProfileId, activeShell, access),
      activeRoomId: room.id,
      requirements: this.serializeRequirements(access),
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
    };
  }

  async heartbeat(dto: PresenceHeartbeatDto, actor: AppActor) {
    const access = await this.resolveAccess(dto.minorProfileId, actor);
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
      },
    });

    return this.buildPresenceState(room, dto.minorProfileId, activeShell, access);
  }

  async getPresence(roomId: string, minorProfileId: string, actor: AppActor) {
    const access = await this.resolveAccess(minorProfileId, actor);
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

    const rows = new Array<{
      roomId: string;
      roomTitle: string;
      minorProfileId: string;
      minorRole: string;
      actorRole: string;
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

    const blockedBy: string[] = [];

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
      blockedBy,
    };
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
      blockedBy: access.blockedBy,
      blockedReason: this.buildBlockedReason(access.blockedBy),
    };
  }

  private buildBlockedReason(blockedBy: string[]) {
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
      },
    });
  }

  private resolveAdminRoomTitle(roomId: string) {
    const room = RoomCatalog.find((item) => item.id === roomId);
    return room?.title ?? 'Sala monitorada';
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
