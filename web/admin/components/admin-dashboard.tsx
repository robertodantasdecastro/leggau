'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type AdminOverview = {
  app: { name: string; apiBaseUrl: string };
  counts: Record<string, number>;
  metrics: Record<string, number>;
};

type Realtime = {
  sessions: Record<string, number>;
  system: {
    cpuCount: number;
    totalMemoryMb: number;
    freeMemoryMb: number;
    uptimeSeconds: number;
    disk: {
      filesystem: string;
      capacity: string;
      mountpoint: string;
    };
  };
  services: Record<
    string,
    string | { portal: string; admin: string; api: string }
  >;
};

type BillingOverview = {
  providers: number;
  plans: number;
  transactions: number;
  totals: {
    inboundCents: number;
    outboundCents: number;
    netCents: number;
  };
};

type AuthProviderConfig = {
  id: string;
  provider: 'google' | 'apple';
  displayName: string;
  enabled: boolean;
  verificationMode: 'mock' | 'live';
  clientId?: string | null;
  issuer?: string | null;
  jwksUrl?: string | null;
  allowedAudiences: string[];
  scopes: string[];
  metadata: Record<string, unknown>;
  credentialSummary: {
    hasClientSecret: boolean;
    hasPrivateKey: boolean;
    maskedClientSecret?: string | null;
    maskedPrivateKey?: string | null;
  };
};

type MediaVerificationJob = {
  id: string;
  verificationType: string;
  actorRole: string;
  subjectRole: string;
  status: string;
  sampleKey?: string | null;
  confidenceScore?: number | null;
  matched?: boolean | null;
  reviewRequired: boolean;
  createdAt: string;
  notes?: string | null;
};

type CareTeamMembership = {
  id: string;
  therapistUserId: string;
  therapistProfileId?: string | null;
  parentUserId: string;
  parentProfileId: string;
  minorProfileId: string;
  minorRole: string;
  status: string;
  adminApprovalStatus: string;
  parentApprovalStatus: string;
  scope?: Record<string, unknown> | null;
  approvedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
};

type AuditEvent = {
  id: string;
  eventType: string;
  actorRole: string;
  actorUserId?: string | null;
  resourceType: string;
  resourceId?: string | null;
  outcome: string;
  severity: string;
  occurredAt: string;
  metadata?: Record<string, unknown> | null;
};

type IncidentRecord = {
  id: string;
  sourceType: string;
  sourceId?: string | null;
  severity: string;
  status: string;
  summary: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
};

type ModerationCase = {
  id: string;
  sourceType: string;
  sourceId?: string | null;
  status: string;
  severity: string;
  policyCode?: string | null;
  humanReviewRequired: boolean;
  aiDecision?: Record<string, unknown> | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
};

type AdminInteractionPolicy = {
  id: string;
  minorProfileId: string;
  minorRole: string;
  ageBand: string;
  roomsEnabled: boolean;
  presenceEnabled: boolean;
  messagingMode: string;
  therapistParticipationAllowed: boolean;
  accessSource?: string | null;
};

type AdminPresenceRecord = {
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
  sessionStatus?: string | null;
  participantStatus?: string | null;
  heartbeatTimeoutAt?: string | null;
  endedAt?: string | null;
  endedBy?: string | null;
  closeReason?: string | null;
};

type RoomRuntimeEvent = {
  id: string;
  eventType: string;
  actorRole: string;
  actorUserId?: string | null;
  resourceType: string;
  resourceId?: string | null;
  outcome: string;
  severity: string;
  occurredAt: string;
  roomId: string;
  roomTitle: string;
  minorProfileId?: string | null;
  minorRole?: string | null;
  accessSource?: string | null;
  activeShell?: string | null;
  activeInviteId?: string | null;
  inviteExpiresAt?: string | null;
  lockExpiresAt?: string | null;
  sessionStatus?: string | null;
  participantStatus?: string | null;
  heartbeatTimeoutAt?: string | null;
  endedAt?: string | null;
  endedBy?: string | null;
  closeReason?: string | null;
  blockedBy?: string[];
  summary: string;
};

type RuntimeContextPayload = {
  roomId: string;
  minorProfileId: string;
  minorRole?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  activeInviteId?: string | null;
  eventId?: string | null;
  presenceSnapshot?: Record<string, unknown> | null;
};

type RoomRuntimeSnapshot = {
  roomId: string;
  roomTitle: string;
  roomDescription?: string | null;
  presenceMode: string;
  minorProfileId: string;
  minorRole: string;
  ageBand: string;
  activeInviteId?: string | null;
  roomInviteStatus: string;
  inviteExpiresAt?: string | null;
  operationalStatus: string;
  operationalMessage?: string | null;
  lockExpiresAt?: string | null;
  sessionStatus?: string | null;
  participantStatus?: string | null;
  heartbeatTimeoutAt?: string | null;
  endedAt?: string | null;
  endedBy?: string | null;
  closeReason?: string | null;
  participantCount: number;
  participants: AdminPresenceRecord[];
  lastHeartbeatAt?: string | null;
  policySnapshot?: Record<string, unknown> | null;
};

type ProviderFormState = {
  enabled: boolean;
  verificationMode: 'mock' | 'live';
  clientId: string;
  clientSecret: string;
  privateKey: string;
  issuer: string;
  jwksUrl: string;
  allowedAudiences: string;
  scopes: string;
  metadataJson: string;
};

type CareTeamFilters = {
  status: string;
  parentApprovalStatus: string;
  adminApprovalStatus: string;
  minorRole: string;
};

type AuditFilters = {
  eventType: string;
  actorRole: string;
  resourceType: string;
};

type IncidentFilters = {
  status: string;
  severity: string;
  sourceType: string;
};

type ModerationFilters = {
  status: string;
  severity: string;
  sourceType: string;
};

type PresenceFilters = {
  roomId: string;
  minorRole: string;
  actorRole: string;
  accessSource: string;
};

type RuntimeEventFilters = {
  roomId: string;
  minorProfileId: string;
  actorRole: string;
  eventType: string;
};

type IncidentDraft = {
  severity: string;
  sourceType: string;
  summary: string;
};

type ModerationDraft = {
  severity: string;
  sourceType: string;
  policyCode: string;
};

type AdminPolicyDraft = {
  roomsEnabled: boolean;
  presenceEnabled: boolean;
  therapistParticipationAllowed: boolean;
};

const apiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? '/api';

async function apiRequest<T>(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha em ${path}: ${response.status} ${body}`);
  }

  return (await response.json()) as T;
}

function csvJoin(values: string[] | undefined) {
  return (values ?? []).join(', ');
}

function safeJson(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  return JSON.parse(trimmed) as Record<string, unknown>;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function slugToLabel(value: string) {
  if (!value) {
    return 'Todos';
  }

  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function resolveLifecycleSummary(
  sessionStatus?: string | null,
  participantStatus?: string | null,
  closeReason?: string | null,
) {
  if (participantStatus === 'participant_removed') {
    return closeReason || 'Participacao removida pela operacao.';
  }

  switch (sessionStatus) {
    case 'active':
      return 'Sessao viva com heartbeats recentes.';
    case 'stale':
      return 'Sessao sem heartbeat recente e sob observacao.';
    case 'closed_by_timeout':
      return closeReason || 'Sessao encerrada automaticamente por timeout.';
    case 'closed_by_admin':
      return closeReason || 'Sessao encerrada pela operacao.';
    default:
      return closeReason || 'Runtime aguardando nova atividade.';
  }
}

function compactId(value?: string | null) {
  if (!value) {
    return '-';
  }

  return value.slice(0, 8);
}

function buildProviderForm(config?: AuthProviderConfig): ProviderFormState {
  return {
    enabled: config?.enabled ?? false,
    verificationMode: config?.verificationMode ?? 'mock',
    clientId: config?.clientId ?? '',
    clientSecret: '',
    privateKey: '',
    issuer: config?.issuer ?? '',
    jwksUrl: config?.jwksUrl ?? '',
    allowedAudiences: csvJoin(config?.allowedAudiences),
    scopes: csvJoin(config?.scopes),
    metadataJson: JSON.stringify(config?.metadata ?? {}, null, 2),
  };
}

function buildAdminPolicyDraft(policy?: AdminInteractionPolicy | null): AdminPolicyDraft {
  return {
    roomsEnabled: policy?.roomsEnabled ?? false,
    presenceEnabled: policy?.presenceEnabled ?? false,
    therapistParticipationAllowed: policy?.therapistParticipationAllowed ?? false,
  };
}

function buildQuery(params: Record<string, string>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value.trim()) {
      query.set(key, value.trim());
    }
  });

  const result = query.toString();
  return result ? `?${result}` : '';
}

function buildRuntimeContextFromPresence(record: AdminPresenceRecord): RuntimeContextPayload {
  return {
    roomId: record.roomId,
    minorProfileId: record.minorProfileId,
    minorRole: record.minorRole,
    actorUserId: record.actorUserId,
    actorRole: record.actorRole,
    presenceSnapshot: {
      roomTitle: record.roomTitle,
      accessSource: record.accessSource,
      activeShell: record.activeShell,
      joinedAt: record.joinedAt,
      lastHeartbeatAt: record.lastHeartbeatAt,
    },
  };
}

function buildRuntimeContextFromEvent(event: RoomRuntimeEvent): RuntimeContextPayload {
  return {
    roomId: event.roomId,
    minorProfileId: event.minorProfileId ?? '',
    minorRole: event.minorRole ?? null,
    actorUserId: event.actorUserId ?? null,
    actorRole: event.actorRole,
    activeInviteId: event.activeInviteId ?? null,
    eventId: event.id,
    presenceSnapshot: {
      roomTitle: event.roomTitle,
      accessSource: event.accessSource ?? null,
      activeShell: event.activeShell ?? null,
      occurredAt: event.occurredAt,
      blockedBy: event.blockedBy ?? [],
      summary: event.summary,
    },
  };
}

function buildRuntimeContextFromSnapshot(snapshot: RoomRuntimeSnapshot): RuntimeContextPayload {
  return {
    roomId: snapshot.roomId,
    minorProfileId: snapshot.minorProfileId,
    minorRole: snapshot.minorRole,
    activeInviteId: snapshot.activeInviteId ?? null,
    presenceSnapshot: {
      roomTitle: snapshot.roomTitle,
      participantCount: snapshot.participantCount,
      lastHeartbeatAt: snapshot.lastHeartbeatAt ?? null,
      operationalStatus: snapshot.operationalStatus,
      operationalMessage: snapshot.operationalMessage ?? null,
      lockExpiresAt: snapshot.lockExpiresAt ?? null,
    },
  };
}

function ScopeSummary({ scope }: { scope?: Record<string, unknown> | null }) {
  if (!scope || Object.keys(scope).length === 0) {
    return <span className="muted">Escopo padrao</span>;
  }

  return (
    <div className="chipRow">
      {Object.entries(scope).map(([key, value]) => (
        <span key={key} className="chip">
          {slugToLabel(key)}: {String(value)}
        </span>
      ))}
    </div>
  );
}

function StatusTag({
  value,
  tone,
}: {
  value: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  return (
    <span className={`tag ${tone ? `tag-${tone}` : ''}`}>{slugToLabel(value)}</span>
  );
}

function ProviderConfigCard({
  config,
  form,
  saving,
  saveError,
  onChange,
  onSubmit,
}: {
  config: AuthProviderConfig;
  form: ProviderFormState;
  saving: boolean;
  saveError?: string | null;
  onChange: (patch: Partial<ProviderFormState>) => void;
  onSubmit: () => void;
}) {
  return (
    <article className="card stack">
      <div className="row spread">
        <div>
          <h3>{config.displayName}</h3>
          <p className="muted">
            {config.provider} | modo {config.verificationMode} |{' '}
            {config.enabled ? 'ativo' : 'desativado'}
          </p>
        </div>
        <div className="badge">{config.enabled ? 'Ativo' : 'Pausado'}</div>
      </div>

      <div className="provider-grid">
        <label className="field">
          <span>Habilitado</span>
          <select
            value={form.enabled ? 'true' : 'false'}
            onChange={(event) => onChange({ enabled: event.target.value === 'true' })}
          >
            <option value="false">Nao</option>
            <option value="true">Sim</option>
          </select>
        </label>
        <label className="field">
          <span>Modo</span>
          <select
            value={form.verificationMode}
            onChange={(event) =>
              onChange({
                verificationMode: event.target.value as 'mock' | 'live',
              })
            }
          >
            <option value="mock">Mock</option>
            <option value="live">Live</option>
          </select>
        </label>
        <label className="field">
          <span>Client ID</span>
          <input
            value={form.clientId}
            onChange={(event) => onChange({ clientId: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Issuer</span>
          <input
            value={form.issuer}
            onChange={(event) => onChange({ issuer: event.target.value })}
          />
        </label>
        <label className="field">
          <span>JWKS URL</span>
          <input
            value={form.jwksUrl}
            onChange={(event) => onChange({ jwksUrl: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Audiencias (CSV)</span>
          <input
            value={form.allowedAudiences}
            onChange={(event) => onChange({ allowedAudiences: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Scopes (CSV)</span>
          <input
            value={form.scopes}
            onChange={(event) => onChange({ scopes: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Client Secret</span>
          <input
            type="password"
            placeholder={config.credentialSummary.maskedClientSecret ?? 'Nao salvo'}
            value={form.clientSecret}
            onChange={(event) => onChange({ clientSecret: event.target.value })}
          />
        </label>
      </div>

      <label className="field">
        <span>Private key / Apple key</span>
        <textarea
          rows={4}
          placeholder={config.credentialSummary.maskedPrivateKey ?? 'Nao salvo'}
          value={form.privateKey}
          onChange={(event) => onChange({ privateKey: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Metadata JSON</span>
        <textarea
          rows={8}
          value={form.metadataJson}
          onChange={(event) => onChange({ metadataJson: event.target.value })}
        />
      </label>

      <div className="row spread">
        <p className="muted">
          Segredos ficam mascarados no admin e sao persistidos de forma protegida no
          backend.
        </p>
        <button type="button" onClick={onSubmit} disabled={saving}>
          {saving ? 'Salvando...' : `Salvar ${config.displayName}`}
        </button>
      </div>
      {saveError ? <p className="error">{saveError}</p> : null}
    </article>
  );
}

export function AdminDashboard() {
  const [email, setEmail] = useState('admin@leggau.local');
  const [password, setPassword] = useState('Admin123!');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [realtime, setRealtime] = useState<Realtime | null>(null);
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [users, setUsers] = useState<Record<string, unknown> | null>(null);
  const [providers, setProviders] = useState<AuthProviderConfig[]>([]);
  const [providerForms, setProviderForms] = useState<Record<string, ProviderFormState>>(
    {},
  );
  const [providerSaving, setProviderSaving] = useState<Record<string, boolean>>({});
  const [providerErrors, setProviderErrors] = useState<Record<string, string | null>>(
    {},
  );
  const [mediaJobs, setMediaJobs] = useState<MediaVerificationJob[]>([]);
  const [careTeamMemberships, setCareTeamMemberships] = useState<CareTeamMembership[]>(
    [],
  );
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [moderationCases, setModerationCases] = useState<ModerationCase[]>([]);
  const [presenceRecords, setPresenceRecords] = useState<AdminPresenceRecord[]>([]);
  const [runtimeEvents, setRuntimeEvents] = useState<RoomRuntimeEvent[]>([]);
  const [careTeamFilters, setCareTeamFilters] = useState<CareTeamFilters>({
    status: '',
    parentApprovalStatus: '',
    adminApprovalStatus: '',
    minorRole: '',
  });
  const [auditFilters, setAuditFilters] = useState<AuditFilters>({
    eventType: '',
    actorRole: '',
    resourceType: '',
  });
  const [incidentFilters, setIncidentFilters] = useState<IncidentFilters>({
    status: '',
    severity: '',
    sourceType: '',
  });
  const [moderationFilters, setModerationFilters] = useState<ModerationFilters>({
    status: '',
    severity: '',
    sourceType: '',
  });
  const [presenceFilters, setPresenceFilters] = useState<PresenceFilters>({
    roomId: '',
    minorRole: '',
    actorRole: '',
    accessSource: '',
  });
  const [runtimeEventFilters, setRuntimeEventFilters] = useState<RuntimeEventFilters>({
    roomId: '',
    minorProfileId: '',
    actorRole: '',
    eventType: '',
  });
  const [incidentDraft, setIncidentDraft] = useState<IncidentDraft>({
    severity: 'medium',
    sourceType: 'care_team',
    summary: 'Revisao manual solicitada pelo operador',
  });
  const [moderationDraft, setModerationDraft] = useState<ModerationDraft>({
    severity: 'medium',
    sourceType: 'care_team',
    policyCode: 'guardian-review-required',
  });
  const [policyTargetMinorId, setPolicyTargetMinorId] = useState('');
  const [adminPolicy, setAdminPolicy] = useState<AdminInteractionPolicy | null>(null);
  const [adminPolicyDraft, setAdminPolicyDraft] = useState<AdminPolicyDraft>(
    buildAdminPolicyDraft(),
  );
  const [incidentEdits, setIncidentEdits] = useState<
    Record<string, { severity?: string; status?: string }>
  >({});
  const [moderationEdits, setModerationEdits] = useState<
    Record<string, { severity?: string; status?: string }>
  >({});
  const [runtimeSnapshot, setRuntimeSnapshot] = useState<RoomRuntimeSnapshot | null>(null);

  const stats = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      ['Pais', overview.counts.parents],
      ['Criancas', overview.counts.children],
      ['Adolescentes', overview.counts.adolescents ?? 0],
      ['Therapists', overview.counts.therapists ?? 0],
      ['Admins', overview.counts.admins],
      ['Downloads', overview.metrics.downloads],
    ];
  }, [overview]);

  const governanceStats = useMemo(() => {
    const pendingCareTeam = careTeamMemberships.filter(
      (membership) => membership.status === 'pending',
    ).length;
    const openIncidents = incidents.filter((incident) => incident.status === 'open').length;
    const openModeration = moderationCases.filter(
      (item) => item.status === 'open' || item.status === 'triaged',
    ).length;
    const flaggedMedia = mediaJobs.filter((job) => job.reviewRequired).length;
    const livePresence = presenceRecords.length;

    return [
      ['Care-team pendente', pendingCareTeam],
      ['Incidentes abertos', openIncidents],
      ['Moderacao ativa', openModeration],
      ['OCR/biometria em revisao', flaggedMedia],
      ['Presenca ativa', livePresence],
    ];
  }, [careTeamMemberships, incidents, mediaJobs, moderationCases, presenceRecords]);

  async function loadDashboard(activeToken: string) {
    const [
      overviewResponse,
      realtimeResponse,
      billingResponse,
      usersResponse,
      providerResponse,
      mediaResponse,
      careTeamResponse,
      auditResponse,
      incidentsResponse,
      moderationResponse,
      presenceResponse,
      runtimeEventsResponse,
      policyResponse,
    ] = await Promise.all([
      apiRequest<AdminOverview>('/admin/overview', activeToken),
      apiRequest<Realtime>('/admin/realtime', activeToken),
      apiRequest<BillingOverview>('/admin/billing/overview', activeToken),
      apiRequest<Record<string, unknown>>('/admin/users', activeToken),
      apiRequest<AuthProviderConfig[]>('/admin/auth/providers', activeToken),
      apiRequest<MediaVerificationJob[]>('/admin/media-verification/jobs', activeToken),
      apiRequest<CareTeamMembership[]>(
        `/care-team/admin${buildQuery(careTeamFilters)}`,
        activeToken,
      ),
      apiRequest<AuditEvent[]>(
        `/audit/events${buildQuery(auditFilters)}`,
        activeToken,
      ),
      apiRequest<IncidentRecord[]>(
        `/incidents${buildQuery(incidentFilters)}`,
        activeToken,
      ),
      apiRequest<ModerationCase[]>(
        `/moderation/cases${buildQuery(moderationFilters)}`,
        activeToken,
      ),
      apiRequest<AdminPresenceRecord[]>(
        `/admin/rooms/presence${buildQuery(presenceFilters)}`,
        activeToken,
      ),
      apiRequest<RoomRuntimeEvent[]>(
        `/admin/rooms/events${buildQuery(runtimeEventFilters)}`,
        activeToken,
      ),
      policyTargetMinorId.trim()
        ? apiRequest<AdminInteractionPolicy>(
            `/admin/interaction-policies/${encodeURIComponent(policyTargetMinorId.trim())}`,
            activeToken,
          )
        : Promise.resolve(null),
    ]);

    setOverview(overviewResponse);
    setRealtime(realtimeResponse);
    setBilling(billingResponse);
    setUsers(usersResponse);
    setProviders(providerResponse);
    setProviderForms(
      Object.fromEntries(
        providerResponse.map((config) => [config.provider, buildProviderForm(config)]),
      ),
    );
    setMediaJobs(mediaResponse);
    setCareTeamMemberships(careTeamResponse);
    setAuditEvents(auditResponse);
    setIncidents(incidentsResponse);
    setModerationCases(moderationResponse);
    setPresenceRecords(presenceResponse);
    setRuntimeEvents(runtimeEventsResponse);
    setAdminPolicy(policyResponse);
    setAdminPolicyDraft(buildAdminPolicyDraft(policyResponse));
  }

  useEffect(() => {
    const stored = window.localStorage.getItem('leggau-admin-token');
    if (!stored) {
      return;
    }

    setToken(stored);
    void loadDashboard(stored).catch((reason: Error) => {
      setError(reason.message);
      window.localStorage.removeItem('leggau-admin-token');
      setToken(null);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${apiBase}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`Login invalido: ${response.status}`);
      }

      const payload = (await response.json()) as { accessToken: string };
      setToken(payload.accessToken);
      window.localStorage.setItem('leggau-admin-token', payload.accessToken);
      await loadDashboard(payload.accessToken);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshDashboard() {
    if (!token) {
      return;
    }

    setBusyAction('refresh');
    setError(null);
    try {
      await loadDashboard(token);
      if (runtimeSnapshot) {
        await loadRoomSnapshot(runtimeSnapshot.roomId, runtimeSnapshot.minorProfileId);
      }
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function saveProvider(provider: string) {
    if (!token) {
      return;
    }

    const form = providerForms[provider];
    setProviderSaving((current) => ({ ...current, [provider]: true }));
    setProviderErrors((current) => ({ ...current, [provider]: null }));

    try {
      await apiRequest<AuthProviderConfig>(`/admin/auth/providers/${provider}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          provider,
          enabled: form.enabled,
          verificationMode: form.verificationMode,
          clientId: form.clientId || undefined,
          clientSecret: form.clientSecret || undefined,
          privateKey: form.privateKey || undefined,
          issuer: form.issuer || undefined,
          jwksUrl: form.jwksUrl || undefined,
          allowedAudiences: form.allowedAudiences
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          scopes: form.scopes
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          metadata: safeJson(form.metadataJson),
        }),
      });

      await loadDashboard(token);
    } catch (reason) {
      setProviderErrors((current) => ({
        ...current,
        [provider]: (reason as Error).message,
      }));
    } finally {
      setProviderSaving((current) => ({ ...current, [provider]: false }));
    }
  }

  async function approveMembership(id: string) {
    if (!token) {
      return;
    }

    setBusyAction(`care-team-approve-${id}`);
    try {
      await apiRequest(`/care-team/${id}/admin`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          adminApprovalStatus: 'approved',
        }),
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function revokeMembership(id: string) {
    if (!token) {
      return;
    }

    setBusyAction(`care-team-revoke-${id}`);
    try {
      await apiRequest(`/care-team/${id}/admin`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'revoked',
        }),
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function loadAdminPolicy(minorProfileId: string) {
    if (!token) {
      return;
    }

    const trimmed = minorProfileId.trim();
    if (!trimmed) {
      setAdminPolicy(null);
      setAdminPolicyDraft(buildAdminPolicyDraft());
      setPolicyTargetMinorId('');
      return;
    }

    setBusyAction('policy-load');
    setError(null);
    try {
      const response = await apiRequest<AdminInteractionPolicy>(
        `/admin/interaction-policies/${encodeURIComponent(trimmed)}`,
        token,
      );
      setPolicyTargetMinorId(trimmed);
      setAdminPolicy(response);
      setAdminPolicyDraft(buildAdminPolicyDraft(response));
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function saveAdminPolicy() {
    if (!token || !policyTargetMinorId.trim()) {
      return;
    }

    setBusyAction('policy-save');
    setError(null);
    try {
      const response = await apiRequest<AdminInteractionPolicy>(
        `/admin/interaction-policies/${encodeURIComponent(policyTargetMinorId.trim())}`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify(adminPolicyDraft),
        },
      );
      setAdminPolicy(response);
      setAdminPolicyDraft(buildAdminPolicyDraft(response));
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function loadRoomSnapshot(roomId: string, minorProfileId: string) {
    if (!token || !roomId || !minorProfileId) {
      return;
    }

    setBusyAction(`runtime-snapshot-${roomId}-${minorProfileId}`);
    setError(null);
    try {
      const response = await apiRequest<RoomRuntimeSnapshot>(
        `/admin/rooms/${encodeURIComponent(roomId)}/snapshot?minorProfileId=${encodeURIComponent(minorProfileId)}`,
        token,
      );
      setRuntimeSnapshot(response);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function terminateRuntimeRoom(roomId: string, minorProfileId: string) {
    if (!token) {
      return;
    }

    setBusyAction(`runtime-terminate-${roomId}-${minorProfileId}`);
    setError(null);
    try {
      await apiRequest<RoomRuntimeSnapshot>(`/admin/rooms/${encodeURIComponent(roomId)}/terminate`, token, {
        method: 'POST',
        body: JSON.stringify({
          minorProfileId,
        }),
      });
      await loadDashboard(token);
      await loadRoomSnapshot(roomId, minorProfileId);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function removeRuntimeParticipant(
    roomId: string,
    minorProfileId: string,
    actorRole: string,
    actorUserId: string,
  ) {
    if (!token) {
      return;
    }

    setBusyAction(`runtime-remove-${roomId}-${minorProfileId}-${actorRole}`);
    setError(null);
    try {
      await apiRequest<RoomRuntimeSnapshot>(
        `/admin/rooms/${encodeURIComponent(roomId)}/participants/remove`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            minorProfileId,
            actorRole,
            actorUserId,
          }),
        },
      );
      await loadDashboard(token);
      await loadRoomSnapshot(roomId, minorProfileId);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function openIncidentFromPresence(record: AdminPresenceRecord) {
    if (!token) {
      return;
    }

    setBusyAction(`presence-incident-${record.roomId}-${record.actorRole}`);
    setError(null);
    try {
      await apiRequest('/incidents', token, {
        method: 'POST',
        body: JSON.stringify({
          severity: 'medium',
          sourceType: 'presence_runtime',
          sourceId: `${record.roomId}:${record.minorProfileId}:${record.actorRole}`,
          summary: `Runtime monitorado em ${record.roomTitle} para ${record.minorRole} via ${record.accessSource}`,
          runtimeContext: buildRuntimeContextFromPresence(record),
        }),
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function openModerationFromPresence(record: AdminPresenceRecord) {
    if (!token) {
      return;
    }

    setBusyAction(`presence-moderation-${record.roomId}-${record.actorRole}`);
    setError(null);
    try {
      await apiRequest('/moderation/cases', token, {
        method: 'POST',
        body: JSON.stringify({
          severity: 'medium',
          sourceType: 'presence_runtime',
          sourceId: `${record.roomId}:${record.minorProfileId}:${record.actorRole}`,
          policyCode: 'runtime-monitoring-review',
          humanReviewRequired: true,
          aiDecision: {
            disposition: 'hold',
            accessSource: record.accessSource,
          },
          runtimeContext: buildRuntimeContextFromPresence(record),
        }),
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function openIncidentFromRuntimeEvent(event: RoomRuntimeEvent) {
    if (!token) {
      return;
    }

    setBusyAction(`runtime-event-incident-${event.id}`);
    setError(null);
    try {
      await apiRequest('/incidents', token, {
        method: 'POST',
        body: JSON.stringify({
          severity: event.severity ?? 'medium',
          sourceType: 'runtime_event',
          sourceId: event.id,
          summary: `${event.eventType} · ${event.roomTitle} · ${event.summary}`,
          runtimeContext: buildRuntimeContextFromEvent(event),
        }),
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function openModerationFromRuntimeEvent(event: RoomRuntimeEvent) {
    if (!token) {
      return;
    }

    setBusyAction(`runtime-event-moderation-${event.id}`);
    setError(null);
    try {
      await apiRequest('/moderation/cases', token, {
        method: 'POST',
        body: JSON.stringify({
          severity: event.severity ?? 'medium',
          sourceType: 'runtime_event',
          sourceId: event.id,
          policyCode: 'runtime-monitoring-review',
          humanReviewRequired: true,
          aiDecision: {
            disposition: 'hold',
            eventType: event.eventType,
            roomId: event.roomId,
          },
          runtimeContext: buildRuntimeContextFromEvent(event),
        }),
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function revokeRuntimeInvite(inviteId: string) {
    if (!token) {
      return;
    }

    setBusyAction(`runtime-invite-revoke-${inviteId}`);
    setError(null);
    try {
      await apiRequest(`/admin/invites/${inviteId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'revoked',
        }),
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function createIncident() {
    if (!token) {
      return;
    }

    setBusyAction('incident-create');
    try {
      await apiRequest('/incidents', token, {
        method: 'POST',
        body: JSON.stringify(incidentDraft),
      });
      setIncidentDraft({
        severity: 'medium',
        sourceType: incidentDraft.sourceType,
        summary: '',
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function createIncidentFromSnapshot() {
    if (!token || !runtimeSnapshot) {
      return;
    }

    setBusyAction('incident-create-runtime');
    try {
      await apiRequest('/incidents', token, {
        method: 'POST',
        body: JSON.stringify({
          ...incidentDraft,
          sourceType: 'runtime_snapshot',
          sourceId: `${runtimeSnapshot.roomId}:${runtimeSnapshot.minorProfileId}`,
          runtimeContext: buildRuntimeContextFromSnapshot(runtimeSnapshot),
        }),
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function updateIncident(id: string) {
    if (!token) {
      return;
    }

    const draft = incidentEdits[id];
    if (!draft || (!draft.severity && !draft.status)) {
      return;
    }

    setBusyAction(`incident-update-${id}`);
    try {
      await apiRequest(`/incidents/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          severity: draft.severity,
          status: draft.status,
        }),
      });
      setIncidentEdits((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function createModerationCase() {
    if (!token) {
      return;
    }

    setBusyAction('moderation-create');
    try {
      await apiRequest('/moderation/cases', token, {
        method: 'POST',
        body: JSON.stringify({
          severity: moderationDraft.severity,
          sourceType: moderationDraft.sourceType,
          policyCode: moderationDraft.policyCode || undefined,
          humanReviewRequired: true,
          aiDecision: {
            channel: 'admin-console',
            disposition: 'hold',
          },
        }),
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function createModerationFromSnapshot() {
    if (!token || !runtimeSnapshot) {
      return;
    }

    setBusyAction('moderation-create-runtime');
    try {
      await apiRequest('/moderation/cases', token, {
        method: 'POST',
        body: JSON.stringify({
          severity: moderationDraft.severity,
          sourceType: 'runtime_snapshot',
          sourceId: `${runtimeSnapshot.roomId}:${runtimeSnapshot.minorProfileId}`,
          policyCode: moderationDraft.policyCode || undefined,
          humanReviewRequired: true,
          aiDecision: {
            channel: 'admin-console',
            disposition: 'hold',
          },
          runtimeContext: buildRuntimeContextFromSnapshot(runtimeSnapshot),
        }),
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  async function updateModerationCase(id: string) {
    if (!token) {
      return;
    }

    const draft = moderationEdits[id];
    if (!draft || (!draft.severity && !draft.status)) {
      return;
    }

    setBusyAction(`moderation-update-${id}`);
    try {
      await apiRequest(`/moderation/cases/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(draft),
      });
      setModerationEdits((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await loadDashboard(token);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusyAction('');
    }
  }

  function logout() {
    window.localStorage.removeItem('leggau-admin-token');
    setToken(null);
    setError(null);
    setAdminPolicy(null);
    setAdminPolicyDraft(buildAdminPolicyDraft());
    setPolicyTargetMinorId('');
    setPresenceRecords([]);
    setRuntimeSnapshot(null);
  }

  if (!token) {
    return (
      <div className="panel hero">
        <div>
          <h1>Leggau Admin</h1>
          <p className="muted">
            Console operacional de governanca, identidade, OCR/biometria,
            auditoria e triagem da plataforma.
          </p>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field">
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no admin'}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="panel hero">
        <div className="row spread">
          <div>
            <h1>Leggau Admin</h1>
            <p className="muted">
              Governanca operacional da Fase E: provedores sociais, care-team,
              auditoria, incidentes, moderacao, policy override e runtime monitorado.
            </p>
          </div>
          <div className="actionRow">
            <button type="button" onClick={() => void refreshDashboard()}>
              {busyAction === 'refresh' ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button type="button" className="secondaryButton" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="grid">
        {stats.map(([label, value]) => (
          <article key={label} className="card">
            <div className="muted">{label}</div>
            <div className="metric">{value}</div>
          </article>
        ))}
      </section>

      <section className="grid">
        {governanceStats.map(([label, value]) => (
          <article key={label} className="card governanceMetric">
            <div className="muted">{label}</div>
            <div className="metric">{value}</div>
          </article>
        ))}
      </section>

      <section className="grid">
        <article className="card">
          <h2>Tempo real</h2>
          <p className="muted">
            App: {realtime?.sessions.app ?? 0} | Admin: {realtime?.sessions.admin ?? 0}
          </p>
          <p className="muted">
            CPU: {realtime?.system.cpuCount ?? 0} | RAM livre:{' '}
            {realtime?.system.freeMemoryMb ?? 0} MB
          </p>
          <p className="muted">
            Disco: {realtime?.system.disk.capacity ?? '-'} em{' '}
            {realtime?.system.disk.mountpoint ?? '-'}
          </p>
        </article>
        <article className="card">
          <h2>Billing sandbox</h2>
          <p className="muted">Providers: {billing?.providers ?? 0}</p>
          <p className="muted">Planos: {billing?.plans ?? 0}</p>
          <p className="muted">Neto: {formatCurrency(billing?.totals.netCents ?? 0)}</p>
        </article>
        <article className="card">
          <h2>API e ambiente</h2>
          <p className="muted">{overview?.app.apiBaseUrl ?? apiBase}</p>
          <p className="muted">
            Backend unico na VM com auth multiactor, trilha auditavel, provedores
            sociais e base de moderacao.
          </p>
        </article>
      </section>

      <section className="panel stack">
        <div className="row spread">
          <div>
            <h2>Review de care-team</h2>
            <p className="muted">
              Aprove ou revogue pedidos clinicos com filtros por estado do vinculo e
              aprovacoes separadas.
            </p>
          </div>
          <button type="button" onClick={() => void refreshDashboard()}>
            Atualizar governanca
          </button>
        </div>
        <div className="filterBar">
          <label className="field smallField">
            <span>Status</span>
            <select
              value={careTeamFilters.status}
              onChange={(event) =>
                setCareTeamFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </label>
          <label className="field smallField">
            <span>Aprov. responsavel</span>
            <select
              value={careTeamFilters.parentApprovalStatus}
              onChange={(event) =>
                setCareTeamFilters((current) => ({
                  ...current,
                  parentApprovalStatus: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="field smallField">
            <span>Aprov. admin</span>
            <select
              value={careTeamFilters.adminApprovalStatus}
              onChange={(event) =>
                setCareTeamFilters((current) => ({
                  ...current,
                  adminApprovalStatus: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="field smallField">
            <span>Papel do menor</span>
            <select
              value={careTeamFilters.minorRole}
              onChange={(event) =>
                setCareTeamFilters((current) => ({
                  ...current,
                  minorRole: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="child">Child</option>
              <option value="adolescent">Adolescent</option>
            </select>
          </label>
          <button type="button" onClick={() => void refreshDashboard()}>
            Aplicar filtros
          </button>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Perfis</th>
                <th>Aprovacoes</th>
                <th>Escopo</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {careTeamMemberships.map((membership) => (
                <tr key={membership.id}>
                  <td>
                    <strong>{formatDate(membership.createdAt)}</strong>
                    <div className="tableMeta">
                      {compactId(membership.id)} · {slugToLabel(membership.minorRole)}
                    </div>
                    <div className="chipRow">
                      <StatusTag
                        value={membership.status}
                        tone={
                          membership.status === 'active'
                            ? 'success'
                            : membership.status === 'revoked'
                              ? 'danger'
                              : 'warning'
                        }
                      />
                    </div>
                  </td>
                  <td>
                    <div className="stackCompact">
                      <span>Terapeuta {compactId(membership.therapistUserId)}</span>
                      <span>Responsavel {compactId(membership.parentUserId)}</span>
                      <span>Menor {compactId(membership.minorProfileId)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="chipRow">
                      <StatusTag
                        value={`resp ${membership.parentApprovalStatus}`}
                        tone={
                          membership.parentApprovalStatus === 'approved'
                            ? 'success'
                            : membership.parentApprovalStatus === 'rejected'
                              ? 'danger'
                              : 'warning'
                        }
                      />
                      <StatusTag
                        value={`admin ${membership.adminApprovalStatus}`}
                        tone={
                          membership.adminApprovalStatus === 'approved'
                            ? 'success'
                            : membership.adminApprovalStatus === 'rejected'
                              ? 'danger'
                              : 'warning'
                        }
                      />
                    </div>
                  </td>
                  <td>
                    <ScopeSummary scope={membership.scope} />
                  </td>
                  <td>
                    <div className="actionColumn">
                      <button
                        type="button"
                        disabled={
                          membership.adminApprovalStatus === 'approved' ||
                          busyAction === `care-team-approve-${membership.id}`
                        }
                        onClick={() => void approveMembership(membership.id)}
                      >
                        {busyAction === `care-team-approve-${membership.id}`
                          ? 'Aprovando...'
                          : 'Aprovar'}
                      </button>
                      <button
                        type="button"
                        className="secondaryButton"
                        disabled={busyAction === `care-team-revoke-${membership.id}`}
                        onClick={() => void revokeMembership(membership.id)}
                      >
                        {busyAction === `care-team-revoke-${membership.id}`
                          ? 'Revogando...'
                          : 'Revogar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <div className="row spread">
          <div>
            <h2>Runtime monitorado</h2>
            <p className="muted">
              Presenca ativa por sala com filtros operacionais e atalhos para abrir
              incidente, moderacao e override emergencial de policy.
            </p>
          </div>
          <button type="button" onClick={() => void refreshDashboard()}>
            Atualizar runtime
          </button>
        </div>
        <div className="filterBar">
          <label className="field smallField">
            <span>Sala</span>
            <input
              value={presenceFilters.roomId}
              onChange={(event) =>
                setPresenceFilters((current) => ({
                  ...current,
                  roomId: event.target.value,
                }))
              }
              placeholder="focus-lab"
            />
          </label>
          <label className="field smallField">
            <span>Papel do menor</span>
            <select
              value={presenceFilters.minorRole}
              onChange={(event) =>
                setPresenceFilters((current) => ({
                  ...current,
                  minorRole: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="child">Child</option>
              <option value="adolescent">Adolescent</option>
            </select>
          </label>
          <label className="field smallField">
            <span>Ator</span>
            <select
              value={presenceFilters.actorRole}
              onChange={(event) =>
                setPresenceFilters((current) => ({
                  ...current,
                  actorRole: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="parent_guardian">Parent guardian</option>
              <option value="therapist">Therapist</option>
            </select>
          </label>
          <label className="field smallField">
            <span>Origem</span>
            <select
              value={presenceFilters.accessSource}
              onChange={(event) =>
                setPresenceFilters((current) => ({
                  ...current,
                  accessSource: event.target.value,
                }))
              }
            >
              <option value="">Todas</option>
              <option value="guardian_link">Guardian link</option>
              <option value="care_team">Care team</option>
              <option value="unlinked">Unlinked</option>
            </select>
          </label>
          <button type="button" onClick={() => void refreshDashboard()}>
            Aplicar filtros
          </button>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Sala</th>
                <th>Contexto</th>
                <th>Heartbeat</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {presenceRecords.length ? (
                presenceRecords.map((record) => (
                  <tr key={`${record.roomId}-${record.minorProfileId}-${record.actorRole}`}>
                    <td>
                      <strong>{record.roomTitle}</strong>
                      <div className="tableMeta">{record.roomId}</div>
                    </td>
                    <td>
                      <div className="stackCompact">
                        <span>Menor {compactId(record.minorProfileId)} · {slugToLabel(record.minorRole)}</span>
                        <span>Ator {slugToLabel(record.actorRole)} · shell {slugToLabel(record.activeShell)}</span>
                        <span>Origem {slugToLabel(record.accessSource)}</span>
                        <span>
                          Sessao {slugToLabel(record.sessionStatus ?? 'idle')} · participante {slugToLabel(record.participantStatus ?? 'idle')}
                        </span>
                        {record.closeReason ? <span>{record.closeReason}</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="stackCompact">
                        <span>Entrou {formatDate(record.joinedAt)}</span>
                        <span>Ultimo heartbeat {formatDate(record.lastHeartbeatAt)}</span>
                        {record.heartbeatTimeoutAt ? (
                          <span>Timeout em {formatDate(record.heartbeatTimeoutAt)}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="actionColumn">
                        <button
                          type="button"
                          disabled={busyAction === `runtime-snapshot-${record.roomId}-${record.minorProfileId}`}
                          onClick={() => void loadRoomSnapshot(record.roomId, record.minorProfileId)}
                        >
                          {busyAction === `runtime-snapshot-${record.roomId}-${record.minorProfileId}`
                            ? 'Abrindo...'
                            : 'Snapshot'}
                        </button>
                        <button
                          type="button"
                          disabled={busyAction === `runtime-terminate-${record.roomId}-${record.minorProfileId}`}
                          onClick={() => void terminateRuntimeRoom(record.roomId, record.minorProfileId)}
                        >
                          {busyAction === `runtime-terminate-${record.roomId}-${record.minorProfileId}`
                            ? 'Encerrando...'
                            : 'Encerrar sala'}
                        </button>
                        <button
                          type="button"
                          className="secondaryButton"
                          disabled={busyAction === `runtime-remove-${record.roomId}-${record.minorProfileId}-${record.actorRole}`}
                          onClick={() =>
                            void removeRuntimeParticipant(
                              record.roomId,
                              record.minorProfileId,
                              record.actorRole,
                              record.actorUserId,
                            )
                          }
                        >
                          {busyAction === `runtime-remove-${record.roomId}-${record.minorProfileId}-${record.actorRole}`
                            ? 'Removendo...'
                            : 'Remover participante'}
                        </button>
                        <button
                          type="button"
                          disabled={busyAction === 'policy-load'}
                          onClick={() => void loadAdminPolicy(record.minorProfileId)}
                        >
                          Abrir policy
                        </button>
                        <button
                          type="button"
                          className="secondaryButton"
                          disabled={busyAction === `presence-incident-${record.roomId}-${record.actorRole}`}
                          onClick={() => void openIncidentFromPresence(record)}
                        >
                          {busyAction === `presence-incident-${record.roomId}-${record.actorRole}`
                            ? 'Abrindo...'
                            : 'Incidente'}
                        </button>
                        <button
                          type="button"
                          className="secondaryButton"
                          disabled={busyAction === `presence-moderation-${record.roomId}-${record.actorRole}`}
                          onClick={() => void openModerationFromPresence(record)}
                        >
                          {busyAction === `presence-moderation-${record.roomId}-${record.actorRole}`
                            ? 'Abrindo...'
                            : 'Moderacao'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="emptyState">
                      Nenhuma presenca ativa no runtime com os filtros atuais.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <div className="row spread">
          <div>
            <h2>Snapshot operacional da sala</h2>
            <p className="muted">
              Contexto vivo do runtime para encerrar a sessao, remover participante ou abrir incidente e moderacao com payload preenchido.
            </p>
          </div>
          {runtimeSnapshot ? (
            <button
              type="button"
              onClick={() => void loadRoomSnapshot(runtimeSnapshot.roomId, runtimeSnapshot.minorProfileId)}
            >
              {busyAction === `runtime-snapshot-${runtimeSnapshot.roomId}-${runtimeSnapshot.minorProfileId}`
                ? 'Atualizando...'
                : 'Atualizar snapshot'}
            </button>
          ) : null}
        </div>
        {runtimeSnapshot ? (
          <div className="stack">
            <div className="grid3 responsive">
              <div className="miniCard">
                <span className="microLabel">Sala</span>
                <strong>{runtimeSnapshot.roomTitle}</strong>
                <span>{runtimeSnapshot.roomId}</span>
              </div>
              <div className="miniCard">
                <span className="microLabel">Menor</span>
                <strong>{compactId(runtimeSnapshot.minorProfileId)}</strong>
                <span>{slugToLabel(runtimeSnapshot.minorRole)} · {runtimeSnapshot.ageBand}</span>
              </div>
              <div className="miniCard">
                <span className="microLabel">Estado operacional</span>
                <strong>{slugToLabel(runtimeSnapshot.operationalStatus || 'open')}</strong>
                <span>
                  {runtimeSnapshot.operationalMessage ??
                    (runtimeSnapshot.lockExpiresAt
                      ? `Lock ate ${formatDate(runtimeSnapshot.lockExpiresAt)}`
                      : 'Sem lock operacional ativo.')}
                </span>
              </div>
              <div className="miniCard">
                <span className="microLabel">Lifecycle</span>
                <strong>{slugToLabel(runtimeSnapshot.sessionStatus || 'idle')}</strong>
                <span>
                  {resolveLifecycleSummary(
                    runtimeSnapshot.sessionStatus,
                    runtimeSnapshot.participantStatus,
                    runtimeSnapshot.closeReason,
                  )}
                </span>
              </div>
            </div>
            <div className="grid3 responsive">
              <div className="miniCard">
                <span className="microLabel">Invite</span>
                <strong>{slugToLabel(runtimeSnapshot.roomInviteStatus)}</strong>
                <span>
                  {runtimeSnapshot.activeInviteId
                    ? `Invite ${compactId(runtimeSnapshot.activeInviteId)}`
                    : 'Sem invite ativo'}
                </span>
              </div>
              <div className="miniCard">
                <span className="microLabel">Presence mode</span>
                <strong>{slugToLabel(runtimeSnapshot.presenceMode)}</strong>
                <span>{runtimeSnapshot.participantCount} participante(s) ativos</span>
              </div>
              <div className="miniCard">
                <span className="microLabel">Ultimo heartbeat</span>
                <strong>{formatDate(runtimeSnapshot.lastHeartbeatAt)}</strong>
                <span>
                  {runtimeSnapshot.heartbeatTimeoutAt
                    ? `Timeout em ${formatDate(runtimeSnapshot.heartbeatTimeoutAt)}`
                    : runtimeSnapshot.lockExpiresAt
                      ? `Lock expira ${formatDate(runtimeSnapshot.lockExpiresAt)}`
                      : 'Sem lock programado'}
                </span>
              </div>
            </div>
            <div className="actionRow">
              <button
                type="button"
                disabled={busyAction === `runtime-terminate-${runtimeSnapshot.roomId}-${runtimeSnapshot.minorProfileId}`}
                onClick={() => void terminateRuntimeRoom(runtimeSnapshot.roomId, runtimeSnapshot.minorProfileId)}
              >
                {busyAction === `runtime-terminate-${runtimeSnapshot.roomId}-${runtimeSnapshot.minorProfileId}`
                  ? 'Encerrando...'
                  : 'Encerrar sala'}
              </button>
              <button
                type="button"
                className="secondaryButton"
                disabled={busyAction === 'incident-create-runtime'}
                onClick={() => void createIncidentFromSnapshot()}
              >
                {busyAction === 'incident-create-runtime' ? 'Abrindo...' : 'Abrir incidente com contexto'}
              </button>
              <button
                type="button"
                className="secondaryButton"
                disabled={busyAction === 'moderation-create-runtime'}
                onClick={() => void createModerationFromSnapshot()}
              >
                {busyAction === 'moderation-create-runtime' ? 'Abrindo...' : 'Abrir moderacao com contexto'}
              </button>
            </div>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Participante</th>
                    <th>Contexto</th>
                    <th>Heartbeat</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {runtimeSnapshot.participants.length ? (
                    runtimeSnapshot.participants.map((participant) => (
                      <tr key={`${participant.roomId}-${participant.actorRole}-${participant.actorUserId}`}>
                        <td>
                          <strong>{slugToLabel(participant.actorRole)}</strong>
                          <div className="tableMeta">{compactId(participant.actorUserId)}</div>
                        </td>
                        <td>
                          <div className="stackCompact">
                            <span>Origem {slugToLabel(participant.accessSource)}</span>
                            <span>Shell {slugToLabel(participant.activeShell)}</span>
                            <span>
                              Sessao {slugToLabel(participant.sessionStatus ?? 'idle')} · participante {slugToLabel(participant.participantStatus ?? 'idle')}
                            </span>
                            {participant.closeReason ? <span>{participant.closeReason}</span> : null}
                          </div>
                        </td>
                        <td>
                          <div className="stackCompact">
                            <span>Entrou {formatDate(participant.joinedAt)}</span>
                            <span>Heartbeat {formatDate(participant.lastHeartbeatAt)}</span>
                            {participant.heartbeatTimeoutAt ? (
                              <span>Timeout em {formatDate(participant.heartbeatTimeoutAt)}</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="secondaryButton"
                            disabled={busyAction === `runtime-remove-${runtimeSnapshot.roomId}-${runtimeSnapshot.minorProfileId}-${participant.actorRole}`}
                            onClick={() =>
                              void removeRuntimeParticipant(
                                runtimeSnapshot.roomId,
                                runtimeSnapshot.minorProfileId,
                                participant.actorRole,
                                participant.actorUserId,
                              )
                            }
                          >
                            {busyAction === `runtime-remove-${runtimeSnapshot.roomId}-${runtimeSnapshot.minorProfileId}-${participant.actorRole}`
                              ? 'Removendo...'
                              : 'Remover'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <div className="emptyState">
                          Nenhum participante ativo no snapshot atual.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="emptyState">
            Abra um snapshot a partir da presenca ativa ou de um evento do runtime.
          </div>
        )}
      </section>

      <section className="panel stack">
        <div className="row spread">
          <div>
            <h2>Timeline de runtime</h2>
            <p className="muted">
              Trilha operacional de convite, aceite, bloqueios, joins e heartbeats do runtime monitorado.
            </p>
          </div>
          <button type="button" onClick={() => void refreshDashboard()}>
            Atualizar timeline
          </button>
        </div>
        <div className="filterBar">
          <label className="field smallField">
            <span>Sala</span>
            <input
              value={runtimeEventFilters.roomId}
              onChange={(event) =>
                setRuntimeEventFilters((current) => ({
                  ...current,
                  roomId: event.target.value,
                }))
              }
              placeholder="focus-lab"
            />
          </label>
          <label className="field smallField">
            <span>Minor profile</span>
            <input
              value={runtimeEventFilters.minorProfileId}
              onChange={(event) =>
                setRuntimeEventFilters((current) => ({
                  ...current,
                  minorProfileId: event.target.value,
                }))
              }
              placeholder="UUID do menor"
            />
          </label>
          <label className="field smallField">
            <span>Ator</span>
            <select
              value={runtimeEventFilters.actorRole}
              onChange={(event) =>
                setRuntimeEventFilters((current) => ({
                  ...current,
                  actorRole: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="parent_guardian">Parent guardian</option>
              <option value="therapist">Therapist</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="field smallField">
            <span>Evento</span>
            <input
              value={runtimeEventFilters.eventType}
              onChange={(event) =>
                setRuntimeEventFilters((current) => ({
                  ...current,
                  eventType: event.target.value,
                }))
              }
              placeholder="room_invite.accepted"
            />
          </label>
          <button type="button" onClick={() => void refreshDashboard()}>
            Aplicar filtros
          </button>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Contexto</th>
                <th>Momento</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {runtimeEvents.length ? (
                runtimeEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <strong>{event.eventType}</strong>
                      <div className="tableMeta">
                        {event.roomTitle} · {event.severity} · {event.outcome}
                      </div>
                    </td>
                    <td>
                      <div className="stackCompact">
                        <span>Menor {compactId(event.minorProfileId ?? '')} · {slugToLabel(event.minorRole ?? 'child')}</span>
                        <span>Ator {slugToLabel(event.actorRole)} · origem {slugToLabel(event.accessSource ?? 'n/a')}</span>
                        <span>{event.summary}</span>
                        {event.sessionStatus || event.participantStatus ? (
                          <span>
                            Sessao {slugToLabel(event.sessionStatus ?? 'idle')} · participante {slugToLabel(event.participantStatus ?? 'idle')}
                          </span>
                        ) : null}
                        {event.closeReason ? <span>{event.closeReason}</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="stackCompact">
                        <span>{formatDate(event.occurredAt)}</span>
                        {event.inviteExpiresAt ? <span>invite expira {formatDate(event.inviteExpiresAt)}</span> : null}
                        {event.lockExpiresAt ? <span>lock ate {formatDate(event.lockExpiresAt)}</span> : null}
                        {event.heartbeatTimeoutAt ? <span>timeout em {formatDate(event.heartbeatTimeoutAt)}</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="actionColumn">
                        {event.roomId && event.minorProfileId ? (
                          <button
                            type="button"
                            disabled={busyAction === `runtime-snapshot-${event.roomId}-${event.minorProfileId}`}
                            onClick={() => void loadRoomSnapshot(event.roomId, event.minorProfileId ?? '')}
                          >
                            {busyAction === `runtime-snapshot-${event.roomId}-${event.minorProfileId}`
                              ? 'Abrindo...'
                              : 'Snapshot'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="secondaryButton"
                          disabled={busyAction === `runtime-event-incident-${event.id}`}
                          onClick={() => void openIncidentFromRuntimeEvent(event)}
                        >
                          {busyAction === `runtime-event-incident-${event.id}` ? 'Abrindo...' : 'Incidente'}
                        </button>
                        <button
                          type="button"
                          className="secondaryButton"
                          disabled={busyAction === `runtime-event-moderation-${event.id}`}
                          onClick={() => void openModerationFromRuntimeEvent(event)}
                        >
                          {busyAction === `runtime-event-moderation-${event.id}` ? 'Abrindo...' : 'Moderacao'}
                        </button>
                        {event.activeInviteId ? (
                          <button
                            type="button"
                            disabled={busyAction === `runtime-invite-revoke-${event.activeInviteId}`}
                            onClick={() => void revokeRuntimeInvite(event.activeInviteId ?? '')}
                          >
                            {busyAction === `runtime-invite-revoke-${event.activeInviteId}`
                              ? 'Revogando...'
                              : 'Revogar invite'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="emptyState">
                      Nenhum evento de runtime encontrado com os filtros atuais.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <div className="row spread">
          <div>
            <h2>Override emergencial de policy</h2>
            <p className="muted">
              Use somente quando o admin precisar endurecer ou liberar gates com
              trilha auditavel completa.
            </p>
          </div>
        </div>
        <div className="filterBar">
          <label className="field grow">
            <span>Minor profile ID</span>
            <input
              value={policyTargetMinorId}
              onChange={(event) => setPolicyTargetMinorId(event.target.value)}
              placeholder="UUID do menor"
            />
          </label>
          <button type="button" onClick={() => void loadAdminPolicy(policyTargetMinorId)}>
            {busyAction === 'policy-load' ? 'Carregando...' : 'Carregar policy'}
          </button>
        </div>
        {adminPolicy ? (
          <div className="stack">
            <div className="grid3 responsive">
              <div className="miniCard">
                <span className="microLabel">Perfil</span>
                <strong>{adminPolicy.minorRole}</strong>
                <span>{adminPolicy.minorProfileId}</span>
              </div>
              <div className="miniCard">
                <span className="microLabel">Faixa</span>
                <strong>{adminPolicy.ageBand}</strong>
                <span>Origem {adminPolicy.accessSource ?? 'admin'}</span>
              </div>
              <div className="miniCard">
                <span className="microLabel">Mensageria</span>
                <strong>{slugToLabel(adminPolicy.messagingMode)}</strong>
                <span>Segue invisivel/bloqueada nesta fase.</span>
              </div>
            </div>
            <div className="provider-grid">
              <label className="field">
                <span>Rooms enabled</span>
                <select
                  value={adminPolicyDraft.roomsEnabled ? 'true' : 'false'}
                  onChange={(event) =>
                    setAdminPolicyDraft((current) => ({
                      ...current,
                      roomsEnabled: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="true">Sim</option>
                  <option value="false">Nao</option>
                </select>
              </label>
              <label className="field">
                <span>Presence enabled</span>
                <select
                  value={adminPolicyDraft.presenceEnabled ? 'true' : 'false'}
                  onChange={(event) =>
                    setAdminPolicyDraft((current) => ({
                      ...current,
                      presenceEnabled: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="true">Sim</option>
                  <option value="false">Nao</option>
                </select>
              </label>
              <label className="field">
                <span>Therapist participation</span>
                <select
                  value={adminPolicyDraft.therapistParticipationAllowed ? 'true' : 'false'}
                  onChange={(event) =>
                    setAdminPolicyDraft((current) => ({
                      ...current,
                      therapistParticipationAllowed: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="false">Nao</option>
                  <option value="true">Sim</option>
                </select>
              </label>
            </div>
            <div className="row spread">
              <p className="muted">
                Overrides emergenciais ficam auditados no namespace admin de interaction
                policy.
              </p>
              <button type="button" onClick={() => void saveAdminPolicy()}>
                {busyAction === 'policy-save' ? 'Salvando...' : 'Salvar override'}
              </button>
            </div>
          </div>
        ) : (
          <div className="emptyState">
            Carregue um minor profile para revisar ou ajustar a policy efetiva.
          </div>
        )}
      </section>

      <section className="panel stack">
        <div className="row spread">
          <div>
            <h2>Audit trail</h2>
            <p className="muted">
              Leitura cronologica de auth, convites, aprovacoes, care-team e media
              verification com filtro por ator e recurso.
            </p>
          </div>
        </div>
        <div className="filterBar">
          <label className="field smallField">
            <span>Evento</span>
            <input
              value={auditFilters.eventType}
              onChange={(event) =>
                setAuditFilters((current) => ({
                  ...current,
                  eventType: event.target.value,
                }))
              }
              placeholder="auth.social_login"
            />
          </label>
          <label className="field smallField">
            <span>Ator</span>
            <input
              value={auditFilters.actorRole}
              onChange={(event) =>
                setAuditFilters((current) => ({
                  ...current,
                  actorRole: event.target.value,
                }))
              }
              placeholder="parent_guardian"
            />
          </label>
          <label className="field smallField">
            <span>Recurso</span>
            <input
              value={auditFilters.resourceType}
              onChange={(event) =>
                setAuditFilters((current) => ({
                  ...current,
                  resourceType: event.target.value,
                }))
              }
              placeholder="care_team_membership"
            />
          </label>
          <button type="button" onClick={() => void refreshDashboard()}>
            Aplicar filtros
          </button>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Evento</th>
                <th>Ator</th>
                <th>Recurso</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.occurredAt)}</td>
                  <td>
                    <strong>{event.eventType}</strong>
                    <div className="tableMeta">{event.severity}</div>
                  </td>
                  <td>
                    {event.actorRole}
                    <div className="tableMeta">{compactId(event.actorUserId)}</div>
                  </td>
                  <td>
                    {event.resourceType}
                    <div className="tableMeta">{compactId(event.resourceId)}</div>
                  </td>
                  <td>
                    <StatusTag
                      value={event.outcome}
                      tone={event.outcome === 'success' ? 'success' : 'danger'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid governanceGrid">
        <article className="panel stack">
          <div className="row spread">
            <div>
              <h2>Incidentes</h2>
              <p className="muted">
                Triagem operacional para riscos, acessos sensiveis e excecoes que
                exigem revisao humana.
              </p>
            </div>
          </div>
          <div className="card stack">
            <h3>Novo incidente</h3>
            <div className="provider-grid">
              <label className="field">
                <span>Severidade</span>
                <select
                  value={incidentDraft.severity}
                  onChange={(event) =>
                    setIncidentDraft((current) => ({
                      ...current,
                      severity: event.target.value,
                    }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="field">
                <span>Origem</span>
                <select
                  value={incidentDraft.sourceType}
                  onChange={(event) =>
                    setIncidentDraft((current) => ({
                      ...current,
                      sourceType: event.target.value,
                    }))
                  }
                >
                  <option value="care_team">Care-team</option>
                  <option value="auth">Auth</option>
                  <option value="media_verification">Media verification</option>
                  <option value="parent_approval">Parent approval</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>Resumo</span>
              <textarea
                rows={4}
                value={incidentDraft.summary}
                onChange={(event) =>
                  setIncidentDraft((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
              />
            </label>
            <div className="row spread">
              <div className="muted">Cria um caso operacional para a fila do admin.</div>
              <button type="button" onClick={() => void createIncident()}>
                {busyAction === 'incident-create' ? 'Criando...' : 'Abrir incidente'}
              </button>
            </div>
          </div>
          <div className="filterBar">
            <label className="field smallField">
              <span>Status</span>
              <select
                value={incidentFilters.status}
                onChange={(event) =>
                  setIncidentFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                <option value="open">Open</option>
                <option value="triaged">Triaged</option>
                <option value="blocked">Blocked</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <label className="field smallField">
              <span>Severidade</span>
              <select
                value={incidentFilters.severity}
                onChange={(event) =>
                  setIncidentFilters((current) => ({
                    ...current,
                    severity: event.target.value,
                  }))
                }
              >
                <option value="">Todas</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="field smallField">
              <span>Origem</span>
              <input
                value={incidentFilters.sourceType}
                onChange={(event) =>
                  setIncidentFilters((current) => ({
                    ...current,
                    sourceType: event.target.value,
                  }))
                }
                placeholder="care_team"
              />
            </label>
            <button type="button" onClick={() => void refreshDashboard()}>
              Aplicar filtros
            </button>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Incidente</th>
                  <th>Estado</th>
                  <th>Resumo</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => {
                  const draft = incidentEdits[incident.id] ?? {};
                  return (
                    <tr key={incident.id}>
                      <td>
                        <strong>{incident.sourceType}</strong>
                        <div className="tableMeta">
                          {compactId(incident.id)} · {formatDate(incident.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="stackCompact">
                          <StatusTag value={incident.status} tone="warning" />
                          <select
                            value={draft.status ?? incident.status}
                            onChange={(event) =>
                              setIncidentEdits((current) => ({
                                ...current,
                                [incident.id]: {
                                  ...(current[incident.id] ?? {}),
                                  status: event.target.value,
                                },
                              }))
                            }
                          >
                            <option value="open">Open</option>
                            <option value="triaged">Triaged</option>
                            <option value="blocked">Blocked</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <select
                            value={draft.severity ?? incident.severity}
                            onChange={(event) =>
                              setIncidentEdits((current) => ({
                                ...current,
                                [incident.id]: {
                                  ...(current[incident.id] ?? {}),
                                  severity: event.target.value,
                                },
                              }))
                            }
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </td>
                      <td>{incident.summary}</td>
                      <td>
                        <button type="button" onClick={() => void updateIncident(incident.id)}>
                          {busyAction === `incident-update-${incident.id}`
                            ? 'Salvando...'
                            : 'Atualizar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel stack">
          <div className="row spread">
            <div>
              <h2>Moderacao</h2>
              <p className="muted">
                Cases de politica, triagem automatizada e bloqueio preventivo sob
                revisao humana.
              </p>
            </div>
          </div>
          <div className="card stack">
            <h3>Novo caso de moderacao</h3>
            <div className="provider-grid">
              <label className="field">
                <span>Severidade</span>
                <select
                  value={moderationDraft.severity}
                  onChange={(event) =>
                    setModerationDraft((current) => ({
                      ...current,
                      severity: event.target.value,
                    }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="field">
                <span>Origem</span>
                <select
                  value={moderationDraft.sourceType}
                  onChange={(event) =>
                    setModerationDraft((current) => ({
                      ...current,
                      sourceType: event.target.value,
                    }))
                  }
                >
                  <option value="care_team">Care-team</option>
                  <option value="media_verification">Media verification</option>
                  <option value="auth">Auth</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>Policy code</span>
              <input
                value={moderationDraft.policyCode}
                onChange={(event) =>
                  setModerationDraft((current) => ({
                    ...current,
                    policyCode: event.target.value,
                  }))
                }
              />
            </label>
            <div className="row spread">
              <div className="muted">
                Casos novos entram em hold com revisao humana obrigatoria.
              </div>
              <button type="button" onClick={() => void createModerationCase()}>
                {busyAction === 'moderation-create' ? 'Criando...' : 'Abrir caso'}
              </button>
            </div>
          </div>
          <div className="filterBar">
            <label className="field smallField">
              <span>Status</span>
              <select
                value={moderationFilters.status}
                onChange={(event) =>
                  setModerationFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                <option value="open">Open</option>
                <option value="triaged">Triaged</option>
                <option value="blocked">Blocked</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <label className="field smallField">
              <span>Severidade</span>
              <select
                value={moderationFilters.severity}
                onChange={(event) =>
                  setModerationFilters((current) => ({
                    ...current,
                    severity: event.target.value,
                  }))
                }
              >
                <option value="">Todas</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="field smallField">
              <span>Origem</span>
              <input
                value={moderationFilters.sourceType}
                onChange={(event) =>
                  setModerationFilters((current) => ({
                    ...current,
                    sourceType: event.target.value,
                  }))
                }
                placeholder="media_verification"
              />
            </label>
            <button type="button" onClick={() => void refreshDashboard()}>
              Aplicar filtros
            </button>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Caso</th>
                  <th>Estado</th>
                  <th>Policy</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {moderationCases.map((item) => {
                  const draft = moderationEdits[item.id] ?? {};
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.sourceType}</strong>
                        <div className="tableMeta">
                          {compactId(item.id)} · {formatDate(item.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="stackCompact">
                          <StatusTag value={item.status} tone="warning" />
                          <select
                            value={draft.status ?? item.status}
                            onChange={(event) =>
                              setModerationEdits((current) => ({
                                ...current,
                                [item.id]: {
                                  ...(current[item.id] ?? {}),
                                  status: event.target.value,
                                },
                              }))
                            }
                          >
                            <option value="open">Open</option>
                            <option value="triaged">Triaged</option>
                            <option value="blocked">Blocked</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <select
                            value={draft.severity ?? item.severity}
                            onChange={(event) =>
                              setModerationEdits((current) => ({
                                ...current,
                                [item.id]: {
                                  ...(current[item.id] ?? {}),
                                  severity: event.target.value,
                                },
                              }))
                            }
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        {item.policyCode ?? '-'}
                        <div className="tableMeta">
                          Revisao humana: {item.humanReviewRequired ? 'sim' : 'nao'}
                        </div>
                      </td>
                      <td>
                        <button type="button" onClick={() => void updateModerationCase(item.id)}>
                          {busyAction === `moderation-update-${item.id}`
                            ? 'Salvando...'
                            : 'Atualizar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="panel stack">
        <div className="row spread">
          <div>
            <h2>Provedores de conta</h2>
            <p className="muted">
              Configure Google e Apple com modo mock ou live, client IDs,
              audiencias, JWKS e credenciais protegidas.
            </p>
          </div>
        </div>
        <div className="provider-stack">
          {providers.map((config) => (
            <ProviderConfigCard
              key={config.provider}
              config={config}
              form={providerForms[config.provider] ?? buildProviderForm(config)}
              saving={providerSaving[config.provider] ?? false}
              saveError={providerErrors[config.provider]}
              onChange={(patch) =>
                setProviderForms((current) => ({
                  ...current,
                  [config.provider]: {
                    ...(current[config.provider] ?? buildProviderForm(config)),
                    ...patch,
                  },
                }))
              }
              onSubmit={() => void saveProvider(config.provider)}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Jobs de OCR e biometria</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Amostra</th>
                <th>Status</th>
                <th>Score</th>
                <th>Match</th>
              </tr>
            </thead>
            <tbody>
              {mediaJobs.map((job) => (
                <tr key={job.id}>
                  <td>{formatDate(job.createdAt)}</td>
                  <td>{job.verificationType}</td>
                  <td>{job.sampleKey ?? '-'}</td>
                  <td>
                    <StatusTag
                      value={job.status}
                      tone={job.reviewRequired ? 'warning' : 'success'}
                    />
                  </td>
                  <td>{job.confidenceScore?.toFixed(2) ?? '-'}</td>
                  <td>
                    {job.matched === undefined || job.matched === null
                      ? '-'
                      : job.matched
                        ? 'sim'
                        : 'nao'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Usuarios</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(overview?.counts ?? {}).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Snapshot bruto</h2>
        <pre className="debug">{JSON.stringify(users, null, 2)}</pre>
      </section>
    </div>
  );
}
