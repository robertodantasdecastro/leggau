'use client';

import { startTransition, useEffect, useState } from 'react';

type ActorRole = 'parent_guardian' | 'therapist';

type PublicProvider = {
  provider: string;
  displayName: string;
  clientId?: string;
  scopes?: string[];
};

type Requirements = {
  legalConsentRequired: boolean;
  missingPolicies: Array<{
    id: string;
    key: string;
    version: string;
    title: string;
  }>;
  actorDependencies: {
    activeGuardianLinks: number;
    activeCareTeamMemberships: number;
    therapistAdminApproved: boolean;
  };
};

type SessionEnvelope = {
  accessToken: string;
  refreshToken: string;
  actorRole: ActorRole;
  authMethod?: string;
  identityProvider?: string;
  requirements?: Requirements;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  };
  parent?: {
    id: string;
    appUserId: string;
    email: string;
    name: string;
  } | null;
  profile?: {
    id: string;
    appUserId?: string;
    email?: string;
    name?: string;
    displayName?: string;
    role?: string;
    adminApprovalStatus?: string;
  } | null;
};

type LegalDocument = {
  id?: string;
  key: string;
  title?: string;
  version?: string;
  audience?: string;
  summary?: string;
};

type FamilyOverview = {
  parent: {
    id: string;
    appUserId: string;
    email: string;
    name: string;
  } | null;
  guardian: {
    id: string;
    appUserId: string;
    email: string;
    name: string;
  } | null;
  children: Array<{
    id: string;
    name: string;
    age: number;
    ageBand: string;
    role: string;
    avatar?: string;
  }>;
  guardianLinks: Array<{
    id: string;
    minorProfileId: string;
    minorRole: string;
    status: string;
    createdAt: string;
  }>;
  minorProfiles: Array<{
    id: string;
    name: string;
    age: number;
    ageBand: string;
    role: string;
    avatar?: string;
  }>;
};

type DeviceSession = {
  id: string;
  actorRole: string;
  email: string;
  sessionStatus: string;
  createdAt: string;
  expiresAt: string;
  deviceType?: string | null;
};

type CareTeamMembership = {
  id: string;
  therapistUserId: string;
  parentUserId: string;
  parentProfileId: string;
  minorProfileId: string;
  minorRole: string;
  status: string;
  adminApprovalStatus: string;
  parentApprovalStatus: string;
  scope?: Record<string, unknown> | null;
  createdAt: string;
};

type InviteRecord = {
  id: string;
  inviteType: string;
  targetEmail: string;
  targetActorRole?: string | null;
  creatorActorRole?: string | null;
  minorProfileId?: string | null;
  status: string;
  acceptedAt?: string | null;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null> | null;
};

type ParentApprovalRecord = {
  id: string;
  approvalType: string;
  targetId: string;
  decision: string;
  status: string;
  decidedAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

type ActivityItem = {
  id: string;
  code: string;
  title: string;
  description: string;
  points: number;
};

type ActivitiesPayload = {
  source: string;
  items: ActivityItem[];
};

type RewardItem = {
  id: string;
  title: string;
  description: string;
  cost: number;
  unlocked: boolean;
};

type RewardPayload = {
  availablePoints: number;
  items: RewardItem[];
};

type ProgressSummary = {
  child: {
    id: string;
    name: string;
    role?: string;
  };
  minor?: {
    id: string;
    name: string;
    role?: string;
  };
  totalPoints: number;
  completedActivities: number;
  latestEntries: Array<{
    id: string;
    pointsEarned: number;
    performedAt: string;
    activity?: {
      title?: string;
    } | null;
  }>;
};

const DEV_VM_API_BASE = 'http://10.211.55.22:8080/api';

function resolveApiBase() {
  if (typeof window === 'undefined') {
    return DEV_VM_API_BASE;
  }

  const host = window.location.hostname;
  if (host === '10.211.55.22' || host.endsWith('leggau.com')) {
    return `${window.location.origin}/api`;
  }

  return DEV_VM_API_BASE;
}

async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {},
) {
  const response = await fetch(`${resolveApiBase()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const detail =
      typeof payload === 'string'
        ? payload
        : payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as { message: unknown }).message)
          : 'Falha ao comunicar com o backend.';
    throw new Error(detail);
  }

  return payload as T;
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'agora';
  }

  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function slugToLabel(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function AdultShell({ actor }: { actor: ActorRole }) {
  const isParent = actor === 'parent_guardian';
  const storageKey = `leggau.portal.${actor}.session`;
  const defaultMockSubject = isParent ? 'google-parent-helena' : 'apple-therapist-marina';

  const [session, setSession] = useState<SessionEnvelope | null>(null);
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
  const [familyOverview, setFamilyOverview] = useState<FamilyOverview | null>(null);
  const [lookupFamily, setLookupFamily] = useState<FamilyOverview | null>(null);
  const [careTeamMemberships, setCareTeamMemberships] = useState<CareTeamMembership[]>([]);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [parentApprovals, setParentApprovals] = useState<ParentApprovalRecord[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [rewardSummary, setRewardSummary] = useState<RewardPayload | null>(null);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [status, setStatus] = useState('Pronto para autenticar.');
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [passwordMode, setPasswordMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(
    isParent ? 'Responsavel Leggau' : 'Terapeuta Leggau',
  );
  const [socialDrafts, setSocialDrafts] = useState<Record<string, { mockSubject: string; idToken: string }>>({
    google: {
      mockSubject: isParent ? 'google-parent-helena' : '',
      idToken: '',
    },
    apple: {
      mockSubject: isParent ? '' : 'apple-therapist-marina',
      idToken: '',
    },
  });
  const [acceptedPolicies, setAcceptedPolicies] = useState<Record<string, boolean>>({});
  const [childName, setChildName] = useState('Lia');
  const [childAge, setChildAge] = useState('8');
  const [childAvatar, setChildAvatar] = useState('gau-rounded-pixel');
  const [selectedMinorId, setSelectedMinorId] = useState('');
  const [familyLookupEmail, setFamilyLookupEmail] = useState('');
  const [lookupMinorId, setLookupMinorId] = useState('');
  const [scopeDraft, setScopeDraft] = useState('{"focus":"rotina","channel":"portal"}');
  const [inviteTargetEmail, setInviteTargetEmail] = useState('terapeuta@exemplo.com');

  useEffect(() => {
    void loadProviders();
    void loadLegalDocuments();

    if (typeof window === 'undefined') {
      return;
    }

    const rawSession = window.localStorage.getItem(storageKey);
    if (!rawSession) {
      return;
    }

    try {
      const parsed = JSON.parse(rawSession) as SessionEnvelope;
      setSession(parsed);
      setEmail(parsed.user.email);
      setDisplayName(parsed.user.displayName);
      setStatus('Sessao local restaurada. Atualizando dados...');
      startTransition(() => {
        void refreshActorState(parsed, { preserveFamilyLookup: true });
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!session) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }, [session, storageKey]);

  useEffect(() => {
    if (!selectedMinorId && familyOverview?.minorProfiles?.length) {
      setSelectedMinorId(familyOverview.minorProfiles[0].id);
    }
  }, [familyOverview, selectedMinorId]);

  useEffect(() => {
    if (!lookupMinorId && lookupFamily?.minorProfiles?.length) {
      setLookupMinorId(lookupFamily.minorProfiles[0].id);
    }
  }, [lookupFamily, lookupMinorId]);

  useEffect(() => {
    if (session) {
      return;
    }

    setFamilyOverview(null);
    setLookupFamily(null);
    setCareTeamMemberships([]);
    setSessions([]);
    setInvites([]);
    setParentApprovals([]);
    setActivities([]);
    setRewardSummary(null);
    setProgressSummary(null);
  }, [session]);

  async function loadProviders() {
    try {
      const nextProviders = await apiRequest<PublicProvider[]>('/auth/social/providers');
      setProviders(nextProviders);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel carregar provedores.');
    }
  }

  async function loadLegalDocuments() {
    try {
      const documents = await apiRequest<LegalDocument[]>('/legal/documents');
      setLegalDocuments(documents);
      setAcceptedPolicies(
        Object.fromEntries(documents.map((document) => [document.key, true])),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel carregar documentos legais.');
    }
  }

  async function loadInvites(envelope: SessionEnvelope, minorProfileId?: string) {
    const suffix = minorProfileId
      ? `?minorProfileId=${encodeURIComponent(minorProfileId)}`
      : '';
    const nextInvites = await apiRequest<InviteRecord[]>(`/invites${suffix}`, {
      token: envelope.accessToken,
    });
    setInvites(nextInvites);
  }

  async function loadParentApprovals(envelope: SessionEnvelope, targetId?: string) {
    const suffix = targetId ? `?targetId=${encodeURIComponent(targetId)}` : '';
    const approvals = await apiRequest<ParentApprovalRecord[]>(`/parent-approvals${suffix}`, {
      token: envelope.accessToken,
    });
    setParentApprovals(approvals);
  }

  async function loadMinorWorkspace(envelope: SessionEnvelope, minorProfileId: string) {
    const [memberships, activitiesPayload, rewardsPayload] = await Promise.all([
      apiRequest<CareTeamMembership[]>(
        `/care-team?minorProfileId=${encodeURIComponent(minorProfileId)}`,
        { token: envelope.accessToken },
      ),
      apiRequest<ActivitiesPayload>('/activities'),
      apiRequest<RewardPayload>(`/rewards?childId=${encodeURIComponent(minorProfileId)}`),
    ]);

    setCareTeamMemberships(memberships);
    setActivities(activitiesPayload.items);
    setRewardSummary(rewardsPayload);

    if (isParent) {
      await loadParentApprovals(envelope, minorProfileId);
      await loadInvites(envelope, minorProfileId);
    }

    try {
      const summary = await apiRequest<ProgressSummary>(
        `/progress/summary?childId=${encodeURIComponent(minorProfileId)}`,
      );
      setProgressSummary(summary);
    } catch {
      setProgressSummary(null);
    }
  }

  async function lookupFamilyByEmail(targetEmail: string) {
    const overview = await apiRequest<FamilyOverview>(
      `/families/overview?email=${encodeURIComponent(targetEmail)}`,
    );
    setLookupFamily(overview);
    if (overview.minorProfiles?.length) {
      setLookupMinorId(overview.minorProfiles[0].id);
    }
    return overview;
  }

  async function refreshActorState(
    envelope: SessionEnvelope,
    options: { preserveFamilyLookup?: boolean } = {},
  ) {
    setError('');
    const nextStatus = isParent
      ? 'Atualizando identidade, consentimentos e familia...'
      : 'Atualizando identidade, sessoes e fluxo clinico...';
    setStatus(nextStatus);

    try {
      const nextSessions = await apiRequest<DeviceSession[]>('/sessions', {
        token: envelope.accessToken,
      });
      setSessions(nextSessions);
      await loadInvites(envelope);

      if (isParent) {
        const overview = await apiRequest<FamilyOverview>(
          `/families/overview?email=${encodeURIComponent(envelope.user.email)}`,
          {
            token: envelope.accessToken,
          },
        );
        setFamilyOverview(overview);
        if (overview.minorProfiles?.length) {
          const firstMinor = overview.minorProfiles[0].id;
          setSelectedMinorId((current) => current || firstMinor);
          await loadMinorWorkspace(envelope, firstMinor);
        } else {
          setCareTeamMemberships([]);
          setParentApprovals([]);
          setActivities([]);
          setRewardSummary(null);
          setProgressSummary(null);
        }

        setSession((current) =>
          current
            ? {
                ...current,
                requirements: current.requirements
                  ? {
                      ...current.requirements,
                      actorDependencies: {
                        ...current.requirements.actorDependencies,
                        activeGuardianLinks: overview.guardianLinks?.length ?? 0,
                      },
                    }
                  : current.requirements,
              }
            : current,
        );
      } else if (!options.preserveFamilyLookup) {
        setLookupFamily(null);
        setLookupMinorId('');
        setCareTeamMemberships([]);
      }

      setStatus('Painel adulto pronto para uso.');
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Nao foi possivel atualizar o shell adulto.';
      setError(message);
      setStatus('Sessao recuperada, mas a atualizacao encontrou bloqueios.');
    }
  }

  async function handlePasswordAuth() {
    setBusyKey('password-auth');
    setError('');
    setStatus(
      passwordMode === 'register'
        ? 'Criando conta adulta com senha...'
        : 'Entrando com email e senha...',
    );

    try {
      const path = passwordMode === 'register' ? '/auth/register' : '/auth/login';
      const body =
        passwordMode === 'register'
          ? {
              email,
              password,
              displayName,
              role: actor,
              profileDraft: { name: displayName },
            }
          : {
              email,
              password,
            };
      const envelope = await apiRequest<SessionEnvelope>(path, {
        method: 'POST',
        body,
      });
      setSession(envelope);
      await refreshActorState(envelope);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha no fluxo com senha.');
      setStatus('A autenticacao com senha nao concluiu.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleSocialAuth(provider: PublicProvider) {
    setBusyKey(`social-${provider.provider}`);
    setError('');
    setStatus(`Validando acesso rapido com ${provider.displayName}...`);

    try {
      const draft = socialDrafts[provider.provider] ?? {
        mockSubject: defaultMockSubject,
        idToken: '',
      };
      const envelope = await apiRequest<SessionEnvelope>('/auth/social/login', {
        method: 'POST',
        body: {
          provider: provider.provider,
          role: actor,
          displayName,
          mockSubject: draft.mockSubject || undefined,
          idToken: draft.idToken || undefined,
          profileDraft: { name: displayName },
        },
      });
      setSession(envelope);
      setEmail(envelope.user.email);
      setDisplayName(envelope.user.displayName);
      await refreshActorState(envelope);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha no login rapido.');
      setStatus(`O login rapido com ${provider.displayName} falhou.`);
    } finally {
      setBusyKey('');
    }
  }

  async function handleAcceptConsents() {
    if (!session) {
      return;
    }

    setBusyKey('consents');
    setError('');
    setStatus('Gravando consentimentos publicados...');

    try {
      const selectedDocuments = legalDocuments.filter((document) => acceptedPolicies[document.key]);
      for (const document of selectedDocuments) {
        await apiRequest('/legal/consents', {
          method: 'POST',
          body: {
            userEmail: session.user.email,
            documentKey: document.key,
          },
        });
      }

      setSession((current) =>
        current
          ? {
              ...current,
              requirements: current.requirements
                ? {
                    ...current.requirements,
                    legalConsentRequired: false,
                    missingPolicies: [],
                  }
                : current.requirements,
            }
          : current,
      );
      setStatus('Consentimentos atualizados. O perfil ja pode seguir para os proximos passos.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel registrar os consentimentos.');
      setStatus('Os consentimentos ainda nao foram concluidos.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleCreateMinor() {
    if (!session) {
      return;
    }

    setBusyKey('create-minor');
    setError('');
    setStatus('Criando ou ativando o perfil infantojuvenil...');

    try {
      await apiRequest('/children', {
        method: 'POST',
        body: {
          parentEmail: session.user.email,
          name: childName,
          age: Number(childAge),
          avatar: childAvatar,
        },
      });
      await refreshActorState(session);
      setStatus('Perfil infantojuvenil atualizado com sucesso.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel provisionar o perfil.');
      setStatus('O perfil infantojuvenil nao foi provisionado.');
    } finally {
      setBusyKey('');
    }
  }

  async function loadMembershipsForMinor(minorProfileId: string) {
    if (!session) {
      return;
    }

    setBusyKey(`memberships-${minorProfileId}`);
    setError('');
    setStatus('Atualizando pedidos de equipe de cuidado...');

    try {
      await loadMinorWorkspace(session, minorProfileId);
      setStatus('Pedidos, permissoes e relatorios do perfil foram atualizados.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel carregar a equipe de cuidado.');
      setStatus('Falha ao consultar o workspace do perfil selecionado.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleParentMembershipAction(
    membershipId: string,
    body: Record<string, string>,
  ) {
    if (!session || !selectedMinorId) {
      return;
    }

    setBusyKey(`parent-membership-${membershipId}`);
    setError('');
    setStatus('Atualizando aprovacao do responsavel...');

    try {
      await apiRequest(`/care-team/${membershipId}`, {
        method: 'PATCH',
        token: session.accessToken,
        body,
      });
      await loadMembershipsForMinor(selectedMinorId);
      setStatus('Aprovacao do responsavel atualizada.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel atualizar a aprovacao.');
      setStatus('A aprovacao do responsavel nao foi atualizada.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleLookupFamily() {
    setBusyKey('lookup-family');
    setError('');
    setStatus('Buscando familia pelo email do responsavel...');

    try {
      await lookupFamilyByEmail(familyLookupEmail);
      setStatus('Familia localizada. Escolha o perfil para solicitar o vinculo.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel localizar a familia.');
      setStatus('A familia informada nao foi localizada.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleCreateInvite() {
    if (!session || !selectedMinor || !familyOverview?.parent) {
      return;
    }

    setBusyKey('create-invite');
    setError('');
    setStatus('Gerando convite rastreavel para o profissional...');

    try {
      await apiRequest('/invites', {
        method: 'POST',
        token: session.accessToken,
        body: {
          inviteType: 'care_team_invite',
          targetEmail: inviteTargetEmail,
          targetActorRole: 'therapist',
          minorProfileId: selectedMinor.id,
          metadata: {
            parentEmail: familyOverview.parent.email,
            parentName: familyOverview.parent.name,
            minorName: selectedMinor.name,
            minorRole: selectedMinor.role,
            ageBand: selectedMinor.ageBand,
          },
        },
      });
      await loadInvites(session, selectedMinor.id);
      setStatus('Convite criado. O profissional ja pode aceitar pelo shell dele.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel criar o convite.');
      setStatus('O convite rastreavel nao foi criado.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleAcceptInvite(invite: InviteRecord) {
    if (!session) {
      return;
    }

    setBusyKey(`accept-invite-${invite.id}`);
    setError('');
    setStatus('Aceitando convite e preparando o contexto da familia...');

    try {
      await apiRequest(`/invites/${invite.id}/accept`, {
        method: 'POST',
        token: session.accessToken,
      });
      await loadInvites(session);

      const parentEmail =
        typeof invite.metadata?.parentEmail === 'string' ? invite.metadata.parentEmail : '';
      if (parentEmail) {
        const overview = await lookupFamilyByEmail(parentEmail);
        if (invite.minorProfileId && overview.minorProfiles.some((minor) => minor.id === invite.minorProfileId)) {
          setLookupMinorId(invite.minorProfileId);
        }
      }

      setStatus('Convite aceito. O contexto da familia foi preparado para o pedido clinico.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel aceitar o convite.');
      setStatus('O convite nao foi aceito.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleCreateParentApproval(
    approvalType: string,
    targetId: string,
    metadata?: Record<string, unknown>,
  ) {
    if (!session) {
      return;
    }

    setBusyKey(`approval-${approvalType}`);
    setError('');
    setStatus('Registrando aprovacao explicita do responsavel...');

    try {
      await apiRequest('/parent-approvals', {
        method: 'POST',
        token: session.accessToken,
        body: {
          approvalType,
          targetId,
          metadata,
        },
      });
      await loadParentApprovals(session, targetId);
      setStatus('Aprovacao registrada com trilha auditavel.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel registrar a aprovacao.');
      setStatus('A aprovacao explicita nao foi registrada.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleRevokeParentApproval(approvalId: string, targetId: string) {
    if (!session) {
      return;
    }

    setBusyKey(`revoke-approval-${approvalId}`);
    setError('');
    setStatus('Revogando aprovacao explicita do responsavel...');

    try {
      await apiRequest(`/parent-approvals/${approvalId}`, {
        method: 'PATCH',
        token: session.accessToken,
        body: {
          decision: 'revoked',
          status: 'revoked',
        },
      });
      await loadParentApprovals(session, targetId);
      setStatus('Aprovacao revogada com sucesso.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel revogar a aprovacao.');
      setStatus('A aprovacao nao foi revogada.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleQuickCheckin() {
    if (!selectedMinorId || !activities.length) {
      return;
    }

    setBusyKey('quick-checkin');
    setError('');
    setStatus('Registrando check-in rapido para atualizar progresso e recompensas...');

    try {
      await apiRequest('/progress/checkins', {
        method: 'POST',
        body: {
          childId: selectedMinorId,
          activityId: activities[0].id,
          notes: 'Check-in rapido pelo shell adulto',
        },
      });
      if (session) {
        await loadMinorWorkspace(session, selectedMinorId);
      }
      setStatus('Check-in concluido. Os relatórios foram atualizados.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel registrar o check-in.');
      setStatus('O check-in rapido nao foi concluido.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleRequestCareTeam() {
    if (!session || !lookupFamily || !lookupMinorId) {
      return;
    }

    const minor = lookupFamily.minorProfiles.find((profile) => profile.id === lookupMinorId);
    if (!minor || !lookupFamily.parent || !session.profile?.id) {
      setError('Dados insuficientes para solicitar o vinculo clinico.');
      return;
    }

    let parsedScope: Record<string, unknown> | undefined;
    try {
      parsedScope = scopeDraft.trim()
        ? (JSON.parse(scopeDraft) as Record<string, unknown>)
        : undefined;
    } catch {
      setError('O escopo do vinculo precisa ser um JSON valido.');
      return;
    }

    setBusyKey('create-care-team');
    setError('');
    setStatus('Enviando pedido de equipe de cuidado para o backend...');

    try {
      await apiRequest('/care-team', {
        method: 'POST',
        token: session.accessToken,
        body: {
          therapistUserId: session.user.id,
          therapistProfileId: session.profile.id,
          parentUserId: lookupFamily.parent.appUserId,
          parentProfileId: lookupFamily.parent.id,
          minorProfileId: minor.id,
          minorRole: minor.role,
          scope: parsedScope,
        },
      });
      const memberships = await apiRequest<CareTeamMembership[]>(
        `/care-team?minorProfileId=${encodeURIComponent(minor.id)}`,
        {
          token: session.accessToken,
        },
      );
      setCareTeamMemberships(memberships);
      setStatus('Pedido criado. Agora ele depende de aprovacao do responsavel e do admin.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel criar o pedido clinico.');
      setStatus('O pedido clinico nao foi criado.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleRevokeSession(id: string) {
    if (!session) {
      return;
    }

    setBusyKey(`session-${id}`);
    setError('');

    try {
      await apiRequest(`/sessions/${id}`, {
        method: 'DELETE',
        token: session.accessToken,
      });
      await refreshActorState(session, { preserveFamilyLookup: true });
      setStatus('Sessao revogada com sucesso.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel revogar a sessao.');
      setStatus('A revogacao de sessao falhou.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleLogout() {
    if (session) {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { token: session.accessToken },
        });
      } catch {
        // Local cleanup remains the priority for the shell.
      }
    }

    setSession(null);
    setFamilyOverview(null);
    setLookupFamily(null);
    setCareTeamMemberships([]);
    setSessions([]);
    setStatus('Sessao local encerrada.');
    setError('');
  }

  const intro = isParent
    ? {
        eyebrow: 'Shell de responsavel',
        title: 'Gerencie consentimentos, perfis infantojuvenis e aprovacoes a partir da web.',
        lead:
          'Este fluxo usa o backend real da VM para login rapido, consentimentos, criacao de criancas/adolescentes e governanca de vinculos com terapeutas.',
      }
    : {
        eyebrow: 'Shell profissional',
        title: 'Entre com rapidez, encontre a familia certa e solicite o vinculo clinico com trilha auditavel.',
        lead:
          'A superficie profissional ja conversa com a base multiactor da VM e respeita aprovacao do responsavel, aprovacao admin e politica publicada.',
      };

  const currentRequirements = session?.requirements;
  const selectedMinor = familyOverview?.minorProfiles.find((profile) => profile.id === selectedMinorId);
  const selectedLookupMinor = lookupFamily?.minorProfiles.find((profile) => profile.id === lookupMinorId);
  const activeApprovals = parentApprovals.filter((approval) => approval.status === 'active');
  const inviteInbox = isParent
    ? invites.filter((invite) => invite.creatorActorRole === 'parent_guardian')
    : invites.filter((invite) => invite.targetEmail === session?.user.email);

  return (
    <section className="actorFrame">
      <article className="actorHero card">
        <div className="stack">
          <span className="eyebrow">{intro.eyebrow}</span>
          <h1 className="headline compact">{intro.title}</h1>
          <p className="lead">{intro.lead}</p>
        </div>
        <div className="heroAside">
          <div className="metric accent">
            <strong>{providers.length}</strong>
            provedores publicados agora
          </div>
          <div className="metric">
            <strong>{sessions.length}</strong>
            sessoes vivas para este ator
          </div>
          <div className="metric">
            <strong>{isParent ? familyOverview?.minorProfiles.length ?? 0 : careTeamMemberships.length}</strong>
            {isParent ? 'perfis infantojuvenis vinculados' : 'pedidos clinicos visiveis'}
          </div>
        </div>
      </article>

      <div className="statusRail">
        <div className="statusBubble">
          <strong>Status</strong>
          <span>{status}</span>
        </div>
        {error ? (
          <div className="statusBubble error">
            <strong>Atencao</strong>
            <span>{error}</span>
          </div>
        ) : null}
      </div>

      <div className="actorFlow">
        <article className="stageCard card">
          <div className="spread">
            <div>
              <h2>{isParent ? 'Entrada do responsavel' : 'Entrada profissional'}</h2>
              <p className="subtle">
                Escolha entre senha ou login rapido. O portal sempre usa o catalogo
                publico de provedores que o admin publicou na VM.
              </p>
            </div>
            {session ? (
              <button className="button secondary" onClick={() => void handleLogout()}>
                Encerrar sessao local
              </button>
            ) : null}
          </div>

          <div className="grid2">
            <div className="stack">
              <label className="field">
                <span>Nome exibido</span>
                <input
                  className="input"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>

              {providers.length ? (
                <>
                  <div className="providerGrid">
                    {providers.map((provider) => {
                      const draft = socialDrafts[provider.provider] ?? {
                        mockSubject: '',
                        idToken: '',
                      };

                      return (
                        <div key={provider.provider} className="providerCard">
                          <div className="spread">
                            <strong>{provider.displayName}</strong>
                            <span className="badge">{provider.provider}</span>
                          </div>
                          <p className="subtle">
                            Escopos: {(provider.scopes ?? []).join(', ') || 'email'}
                          </p>
                          <button
                            className="button primary full"
                            disabled={busyKey === `social-${provider.provider}`}
                            onClick={() => void handleSocialAuth(provider)}
                            type="button"
                          >
                            {busyKey === `social-${provider.provider}`
                              ? 'Validando...'
                              : `Continuar com ${provider.displayName}`}
                          </button>
                          <details className="details">
                            <summary>Ajustes de desenvolvimento</summary>
                            <label className="field">
                              <span>Mock subject do provedor</span>
                              <input
                                className="input"
                                value={draft.mockSubject}
                                onChange={(event) =>
                                  setSocialDrafts((current) => ({
                                    ...current,
                                    [provider.provider]: {
                                      ...draft,
                                      mockSubject: event.target.value,
                                    },
                                  }))
                                }
                                placeholder={defaultMockSubject}
                              />
                            </label>
                            <label className="field">
                              <span>ID token real</span>
                              <textarea
                                className="textarea"
                                value={draft.idToken}
                                onChange={(event) =>
                                  setSocialDrafts((current) => ({
                                    ...current,
                                    [provider.provider]: {
                                      ...draft,
                                      idToken: event.target.value,
                                    },
                                  }))
                                }
                                placeholder="Cole aqui um ID token quando a integracao real estiver habilitada."
                              />
                            </label>
                          </details>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pillRow">
                    {isParent ? (
                      <button
                        className="pill"
                        onClick={() =>
                          setSocialDrafts((current) => ({
                            ...current,
                            google: {
                              mockSubject: 'google-parent-helena',
                              idToken: current.google?.idToken ?? '',
                            },
                          }))
                        }
                        type="button"
                      >
                        Preencher demo Google
                      </button>
                    ) : (
                      <button
                        className="pill"
                        onClick={() =>
                          setSocialDrafts((current) => ({
                            ...current,
                            apple: {
                              mockSubject: 'apple-therapist-marina',
                              idToken: current.apple?.idToken ?? '',
                            },
                          }))
                        }
                        type="button"
                      >
                        Preencher demo Apple
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="emptyState">
                  O admin ainda nao publicou provedores sociais. O fluxo com senha segue disponivel.
                </div>
              )}
            </div>

            <div className="stack">
              <div className="segmented">
                <button
                  className={authModeClass(passwordMode, 'register')}
                  onClick={() => setPasswordMode('register')}
                  type="button"
                >
                  Criar conta
                </button>
                <button
                  className={authModeClass(passwordMode, 'login')}
                  onClick={() => setPasswordMode('login')}
                  type="button"
                >
                  Entrar
                </button>
              </div>
              <label className="field">
                <span>Email</span>
                <input
                  className="input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={isParent ? 'familia@exemplo.com' : 'terapeuta@exemplo.com'}
                />
              </label>
              <label className="field">
                <span>Senha</span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Use uma senha forte."
                />
              </label>
              <button
                className="button secondary full"
                disabled={busyKey === 'password-auth'}
                onClick={() => void handlePasswordAuth()}
                type="button"
              >
                {busyKey === 'password-auth'
                  ? 'Processando...'
                  : passwordMode === 'register'
                    ? 'Criar conta com senha'
                    : 'Entrar com senha'}
              </button>
            </div>
          </div>
        </article>

        <article className="stageCard card">
          <h2>Estado atual da sessao</h2>
          {session ? (
            <div className="grid2">
              <div className="miniCard">
                <span className="microLabel">Conta ativa</span>
                <strong>{session.user.displayName}</strong>
                <span>{session.user.email}</span>
                <span className="badge">{slugToLabel(session.actorRole)}</span>
                {session.identityProvider ? (
                  <span className="badge warm">{slugToLabel(session.identityProvider)}</span>
                ) : null}
              </div>
              <div className="miniCard">
                <span className="microLabel">Dependencias</span>
                <strong>
                  {currentRequirements?.legalConsentRequired ? 'Consentimento pendente' : 'Consentimentos em dia'}
                </strong>
                <span>
                  Guardioes ativos: {currentRequirements?.actorDependencies.activeGuardianLinks ?? 0}
                </span>
                <span>
                  Vinculos clinicos ativos: {currentRequirements?.actorDependencies.activeCareTeamMemberships ?? 0}
                </span>
                {actor === 'therapist' ? (
                  <span>
                    Liberacao admin:{' '}
                    {currentRequirements?.actorDependencies.therapistAdminApproved ? 'aprovada' : 'pendente'}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="emptyState">
              Assim que voce autenticar, o portal passa a mostrar dependencias legais, sessoes e o fluxo do seu papel.
            </div>
          )}
        </article>

        {isParent ? (
          <>
            <article className="stageCard card">
              <h2>Consentimentos e prontidao legal</h2>
              <p className="subtle">
                Menores so sao provisionados depois do aceite das policies publicadas para `parent_guardian`.
              </p>
              <div className="stack">
                {legalDocuments.map((document) => (
                  <label key={document.key} className="toggleRow">
                    <input
                      type="checkbox"
                      checked={acceptedPolicies[document.key] ?? false}
                      onChange={(event) =>
                        setAcceptedPolicies((current) => ({
                          ...current,
                          [document.key]: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      <strong>{document.title ?? slugToLabel(document.key)}</strong>
                      <small>
                        {document.key} · v{document.version ?? '1'} · {document.audience ?? 'parent_guardian'}
                      </small>
                    </span>
                  </label>
                ))}
                <button
                  className="button primary"
                  disabled={!session || busyKey === 'consents'}
                  onClick={() => void handleAcceptConsents()}
                  type="button"
                >
                  {busyKey === 'consents' ? 'Gravando...' : 'Aceitar documentos selecionados'}
                </button>
              </div>
            </article>

            <article className="stageCard card">
              <div className="spread">
                <div>
                  <h2>Perfis vinculados</h2>
                  <p className="subtle">
                    O backend responde por `GuardianLink` como fonte de verdade e projeta criancas e adolescentes para o shell web.
                  </p>
                </div>
                <button
                  className="button secondary"
                  disabled={!session}
                  onClick={() => session && void refreshActorState(session)}
                  type="button"
                >
                  Recarregar familia
                </button>
              </div>
              {familyOverview?.minorProfiles?.length ? (
                <div className="tiles">
                  {familyOverview.minorProfiles.map((minor) => (
                    <button
                      key={minor.id}
                      className={minor.id === selectedMinorId ? 'miniCard selected' : 'miniCard'}
                      onClick={() => {
                        setSelectedMinorId(minor.id);
                        if (session) {
                          void loadMembershipsForMinor(minor.id);
                        }
                      }}
                      type="button"
                    >
                      <span className="microLabel">{minor.role === 'adolescent' ? 'Adolescente' : 'Crianca'}</span>
                      <strong>{minor.name}</strong>
                      <span>
                        {minor.age} anos · faixa {minor.ageBand}
                      </span>
                      <span>{minor.avatar ?? 'gau-rounded-pixel'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="emptyState">
                  Nenhum perfil infantojuvenil ativo ainda. Use o formulario abaixo para iniciar a jornada.
                </div>
              )}
              <div className="grid3 responsive">
                <label className="field">
                  <span>Nome da crianca ou adolescente</span>
                  <input
                    className="input"
                    value={childName}
                    onChange={(event) => setChildName(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Idade</span>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={childAge}
                    onChange={(event) => setChildAge(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Avatar</span>
                  <select
                    className="input"
                    value={childAvatar}
                    onChange={(event) => setChildAvatar(event.target.value)}
                  >
                    <option value="gau-rounded-pixel">gau-rounded-pixel</option>
                    <option value="gau-mario-pixel">gau-mario-pixel</option>
                    <option value="gau-roblox-pixel">gau-roblox-pixel</option>
                  </select>
                </label>
              </div>
              <button
                className="button primary"
                disabled={!session || busyKey === 'create-minor'}
                onClick={() => void handleCreateMinor()}
                type="button"
              >
                {busyKey === 'create-minor' ? 'Provisionando...' : 'Criar ou atualizar perfil infantojuvenil'}
              </button>
            </article>

            <article className="stageCard card">
              <h2>Equipe de cuidado</h2>
              <p className="subtle">
                O responsavel aprova a sua parte aqui. A liberacao completa continua dependente do admin.
              </p>
              {selectedMinor ? (
                <div className="stack">
                  <div className="miniCard highlight">
                    <span className="microLabel">Perfil selecionado</span>
                    <strong>{selectedMinor.name}</strong>
                    <span>
                      {selectedMinor.role} · {selectedMinor.ageBand}
                    </span>
                  </div>
                  {careTeamMemberships.length ? (
                    <div className="stack">
                      {careTeamMemberships.map((membership) => (
                        <div key={membership.id} className="miniCard">
                          <span className="microLabel">{membership.id}</span>
                          <strong>Status {membership.status}</strong>
                          <span>
                            Responsavel: {membership.parentApprovalStatus} · Admin: {membership.adminApprovalStatus}
                          </span>
                          <div className="ctaRow">
                            <button
                              className="button secondary"
                              disabled={busyKey === `parent-membership-${membership.id}`}
                              onClick={() =>
                                void handleParentMembershipAction(membership.id, {
                                  parentApprovalStatus: 'approved',
                                })
                              }
                              type="button"
                            >
                              Aprovar lado responsavel
                            </button>
                            <button
                              className="button ghost"
                              disabled={busyKey === `parent-membership-${membership.id}`}
                              onClick={() =>
                                void handleParentMembershipAction(membership.id, {
                                  status: 'revoked',
                                })
                              }
                              type="button"
                            >
                              Revogar pedido
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="emptyState">
                      Nenhum pedido clinico encontrado para este perfil.
                    </div>
                  )}
                </div>
              ) : (
                <div className="emptyState">
                  Selecione um perfil para acompanhar os pedidos de equipe de cuidado.
                </div>
              )}
            </article>

            <article className="stageCard card">
              <div className="spread">
                <div>
                  <h2>Relatorios e acoes do perfil</h2>
                  <p className="subtle">
                    Esta area resume progresso, catalogo de atividades e recompensas do menor selecionado.
                  </p>
                </div>
                <button
                  className="button secondary"
                  disabled={!selectedMinorId || !activities.length || busyKey === 'quick-checkin'}
                  onClick={() => void handleQuickCheckin()}
                  type="button"
                >
                  {busyKey === 'quick-checkin' ? 'Registrando...' : 'Registrar check-in rapido'}
                </button>
              </div>
              {selectedMinor ? (
                <div className="reportGrid">
                  <div className="miniCard highlight">
                    <span className="microLabel">Progresso acumulado</span>
                    <strong>{progressSummary?.totalPoints ?? 0} pontos</strong>
                    <span>{progressSummary?.completedActivities ?? 0} atividades concluidas</span>
                  </div>
                  <div className="miniCard">
                    <span className="microLabel">Recompensas destravadas</span>
                    <strong>
                      {rewardSummary?.items.filter((reward) => reward.unlocked).length ?? 0}
                    </strong>
                    <span>{rewardSummary?.availablePoints ?? 0} pontos disponiveis agora</span>
                  </div>
                  <div className="miniCard">
                    <span className="microLabel">Catalogo ativo</span>
                    <strong>{activities.length} atividades</strong>
                    <span>Primeira atividade: {activities[0]?.title ?? 'aguardando catalogo'}</span>
                  </div>
                </div>
              ) : (
                <div className="emptyState">
                  Selecione um perfil para abrir relatorios e acoes contextualizadas.
                </div>
              )}
              {selectedMinor ? (
                <div className="grid2">
                  <div className="stack">
                    <strong>Ultimos check-ins</strong>
                    {progressSummary?.latestEntries?.length ? (
                      <div className="stack">
                        {progressSummary.latestEntries.slice(0, 4).map((entry) => (
                          <div key={entry.id} className="miniCard">
                            <span className="microLabel">{formatDate(entry.performedAt)}</span>
                            <strong>{entry.activity?.title ?? 'Atividade sem titulo'}</strong>
                            <span>{entry.pointsEarned} pontos creditados</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="emptyState">
                        Ainda nao ha historico de progresso para este perfil.
                      </div>
                    )}
                  </div>
                  <div className="stack">
                    <strong>Recompensas e atividades</strong>
                    <div className="compactList">
                      {rewardSummary?.items.slice(0, 3).map((reward) => (
                        <div key={reward.id} className="miniCard">
                          <span className="microLabel">{reward.unlocked ? 'Disponivel' : 'Bloqueada'}</span>
                          <strong>{reward.title}</strong>
                          <span>{reward.cost} pontos · {reward.description}</span>
                        </div>
                      ))}
                      {activities.slice(0, 2).map((activity) => (
                        <div key={activity.id} className="miniCard">
                          <span className="microLabel">Atividade</span>
                          <strong>{activity.title}</strong>
                          <span>{activity.points} pontos · {activity.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </article>

            <article className="stageCard card">
              <h2>Permissoes explicitas do responsavel</h2>
              <p className="subtle">
                Registre aprovacoes auditaveis para OCR, presenca estruturada e vinculacao clinica do perfil selecionado.
              </p>
              {selectedMinor ? (
                <>
                  <div className="pillRow">
                    <button
                      className="pill"
                      disabled={!session || busyKey === 'approval-therapist_linking'}
                      onClick={() =>
                        void handleCreateParentApproval('therapist_linking', selectedMinor.id, {
                          channel: 'portal',
                          scope: 'care-team',
                        })
                      }
                      type="button"
                    >
                      Aprovar vinculacao clinica
                    </button>
                    <button
                      className="pill"
                      disabled={!session || busyKey === 'approval-document_ocr_capture'}
                      onClick={() =>
                        void handleCreateParentApproval('document_ocr_capture', selectedMinor.id, {
                          channel: 'portal',
                          capability: 'device-first-ocr',
                        })
                      }
                      type="button"
                    >
                      Aprovar OCR documental
                    </button>
                    <button
                      className="pill"
                      disabled={!session || busyKey === 'approval-presence_enabled'}
                      onClick={() =>
                        void handleCreateParentApproval('presence_enabled', selectedMinor.id, {
                          channel: 'portal',
                          capability: 'structured-presence',
                        })
                      }
                      type="button"
                    >
                      Aprovar presenca estruturada
                    </button>
                  </div>
                  {parentApprovals.length ? (
                    <div className="stack">
                      {parentApprovals.map((approval) => (
                        <div key={approval.id} className="miniCard">
                          <span className="microLabel">{approval.id}</span>
                          <strong>{slugToLabel(approval.approvalType)}</strong>
                          <span>
                            {approval.status} · decisao {approval.decision} · {formatDate(approval.decidedAt)}
                          </span>
                          <div className="ctaRow">
                            <span className="badge">{approval.targetId === selectedMinor.id ? 'perfil atual' : 'outro perfil'}</span>
                            {approval.status === 'active' ? (
                              <button
                                className="button ghost"
                                disabled={busyKey === `revoke-approval-${approval.id}`}
                                onClick={() => void handleRevokeParentApproval(approval.id, selectedMinor.id)}
                                type="button"
                              >
                                Revogar permissao
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="emptyState">
                      Nenhuma permissao explicita registrada para este perfil ainda.
                    </div>
                  )}
                </>
              ) : (
                <div className="emptyState">
                  Selecione um perfil para registrar permissoes auditaveis.
                </div>
              )}
            </article>

            <article className="stageCard card">
              <h2>Convites para terapeutas</h2>
              <p className="subtle">
                Use convites rastreaveis para puxar o profissional certo para o fluxo de `care-team`.
              </p>
              <div className="toolbar">
                <label className="field grow">
                  <span>Email do profissional</span>
                  <input
                    className="input"
                    value={inviteTargetEmail}
                    onChange={(event) => setInviteTargetEmail(event.target.value)}
                    placeholder="terapeuta@exemplo.com"
                  />
                </label>
                <button
                  className="button primary"
                  disabled={!session || !selectedMinor || busyKey === 'create-invite'}
                  onClick={() => void handleCreateInvite()}
                  type="button"
                >
                  {busyKey === 'create-invite' ? 'Criando...' : 'Enviar convite rastreavel'}
                </button>
              </div>
              {inviteInbox.length ? (
                <div className="stack">
                  {inviteInbox.map((invite) => (
                    <div key={invite.id} className="miniCard">
                      <span className="microLabel">{invite.id}</span>
                      <strong>{invite.targetEmail}</strong>
                      <span>
                        {slugToLabel(invite.inviteType)} · {invite.status} · {formatDate(invite.createdAt)}
                      </span>
                      <span>
                        Perfil: {String(invite.metadata?.minorName ?? 'sem nome')} · faixa{' '}
                        {String(invite.metadata?.ageBand ?? 'n/d')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emptyState">
                  Nenhum convite emitido ainda para terapeutas.
                </div>
              )}
            </article>
          </>
        ) : (
          <>
            <article className="stageCard card">
              <h2>Convites recebidos</h2>
              <p className="subtle">
                Convites aceitos aqui ja preenchem o contexto da familia e reduzem erro operacional na abertura do vinculo.
              </p>
              {inviteInbox.length ? (
                <div className="stack">
                  {inviteInbox.map((invite) => (
                    <div key={invite.id} className="miniCard">
                      <span className="microLabel">{invite.id}</span>
                      <strong>
                        {String(invite.metadata?.parentName ?? 'Familia Leggau')} ·{' '}
                        {String(invite.metadata?.minorName ?? 'perfil infantojuvenil')}
                      </strong>
                      <span>
                        {invite.targetEmail} · {invite.status} · {formatDate(invite.createdAt)}
                      </span>
                      <span>
                        Faixa {String(invite.metadata?.ageBand ?? 'n/d')} · papel {String(invite.metadata?.minorRole ?? 'child')}
                      </span>
                      <div className="ctaRow">
                        <button
                          className="button secondary"
                          disabled={!session || busyKey === `accept-invite-${invite.id}` || invite.status === 'accepted'}
                          onClick={() => void handleAcceptInvite(invite)}
                          type="button"
                        >
                          {busyKey === `accept-invite-${invite.id}`
                            ? 'Aceitando...'
                            : invite.status === 'accepted'
                              ? 'Convite aceito'
                              : 'Aceitar e carregar familia'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emptyState">
                  Nenhum convite direcionado ao seu email apareceu ainda. Voce ainda pode buscar a familia manualmente.
                </div>
              )}
            </article>

            <article className="stageCard card">
              <h2>Busca da familia</h2>
              <p className="subtle">
                Use o email do responsavel para localizar a familia e solicitar o vinculo clinico correto.
              </p>
              <div className="toolbar">
                <label className="field grow">
                  <span>Email do responsavel</span>
                  <input
                    className="input"
                    value={familyLookupEmail}
                    onChange={(event) => setFamilyLookupEmail(event.target.value)}
                    placeholder="familia@exemplo.com"
                  />
                </label>
                <button
                  className="button secondary"
                  disabled={busyKey === 'lookup-family'}
                  onClick={() => void handleLookupFamily()}
                  type="button"
                >
                  {busyKey === 'lookup-family' ? 'Buscando...' : 'Encontrar familia'}
                </button>
              </div>
              {lookupFamily?.minorProfiles?.length ? (
                <div className="tiles">
                  {lookupFamily.minorProfiles.map((minor) => (
                    <button
                      key={minor.id}
                      className={minor.id === lookupMinorId ? 'miniCard selected' : 'miniCard'}
                      onClick={() => setLookupMinorId(minor.id)}
                      type="button"
                    >
                      <span className="microLabel">{minor.role === 'adolescent' ? 'Adolescente' : 'Crianca'}</span>
                      <strong>{minor.name}</strong>
                      <span>
                        {minor.age} anos · {minor.ageBand}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </article>

            <article className="stageCard card">
              <h2>Solicitar vinculo clinico</h2>
              <p className="subtle">
                O backend cria um `care-team` pendente. Depois o responsavel aprova no shell dele e o admin fecha o gate final.
              </p>
              <div className="grid2">
                <div className="miniCard">
                  <span className="microLabel">Conta profissional</span>
                  <strong>{session?.user.displayName ?? 'Aguardando login'}</strong>
                  <span>{session?.user.email ?? 'Sem sessao ativa'}</span>
                  <span>
                    Admin approval:{' '}
                    {session?.requirements?.actorDependencies.therapistAdminApproved ? 'approved' : 'pending'}
                  </span>
                </div>
                <div className="miniCard">
                  <span className="microLabel">Familia alvo</span>
                  <strong>{lookupFamily?.parent?.name ?? 'Nenhuma familia localizada'}</strong>
                  <span>{lookupFamily?.parent?.email ?? 'Busque uma familia pelo email do responsavel.'}</span>
                  <span>{selectedLookupMinor ? `Perfil selecionado: ${selectedLookupMinor.name}` : 'Sem perfil selecionado'}</span>
                </div>
              </div>
              <label className="field">
                <span>Escopo do vinculo (JSON)</span>
                <textarea
                  className="textarea"
                  value={scopeDraft}
                  onChange={(event) => setScopeDraft(event.target.value)}
                />
              </label>
              <button
                className="button primary"
                disabled={!session || !lookupFamily || !lookupMinorId || busyKey === 'create-care-team'}
                onClick={() => void handleRequestCareTeam()}
                type="button"
              >
                {busyKey === 'create-care-team' ? 'Enviando...' : 'Solicitar vinculo com a familia'}
              </button>
              {careTeamMemberships.length ? (
                <div className="stack">
                  {careTeamMemberships.map((membership) => (
                    <div key={membership.id} className="miniCard">
                      <span className="microLabel">{membership.id}</span>
                      <strong>Status {membership.status}</strong>
                      <span>
                        Responsavel: {membership.parentApprovalStatus} · Admin: {membership.adminApprovalStatus}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>

            <article className="stageCard card">
              <h2>Contexto clinico visivel</h2>
              <p className="subtle">
                Esta visao resume o menor alvo e os gates atuais para ajudar antes do pedido clinico e depois da aprovacao.
              </p>
              <div className="grid3 responsive">
                <div className="miniCard">
                  <span className="microLabel">Familia alvo</span>
                  <strong>{lookupFamily?.parent?.name ?? 'Nenhuma familia carregada'}</strong>
                  <span>{lookupFamily?.parent?.email ?? 'Aceite um convite ou busque pelo email do responsavel.'}</span>
                </div>
                <div className="miniCard">
                  <span className="microLabel">Perfil alvo</span>
                  <strong>{selectedLookupMinor?.name ?? 'Nenhum perfil selecionado'}</strong>
                  <span>
                    {selectedLookupMinor
                      ? `${selectedLookupMinor.role} · ${selectedLookupMinor.ageBand}`
                      : 'Selecione um menor para o vinculo.'}
                  </span>
                </div>
                <div className="miniCard">
                  <span className="microLabel">Pedidos visiveis</span>
                  <strong>{careTeamMemberships.length}</strong>
                  <span>
                    {careTeamMemberships.some((membership) => membership.status === 'active')
                      ? 'Ao menos um vinculo ja esta ativo'
                      : 'Ainda aguardando gates de aprovacao'}
                  </span>
                </div>
              </div>
            </article>
          </>
        )}

        <article className="stageCard card">
          <h2>Sessoes persistidas</h2>
          {sessions.length ? (
            <div className="stack">
              {sessions.map((entry) => (
                <div key={entry.id} className="miniCard">
                  <span className="microLabel">{entry.id}</span>
                  <strong>{slugToLabel(entry.actorRole)}</strong>
                  <span>
                    criada em {formatDate(entry.createdAt)} · expira em {formatDate(entry.expiresAt)}
                  </span>
                  <div className="ctaRow">
                    <span className="badge">{entry.sessionStatus}</span>
                    <button
                      className="button ghost"
                      disabled={busyKey === `session-${entry.id}`}
                      onClick={() => void handleRevokeSession(entry.id)}
                      type="button"
                    >
                      Revogar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="emptyState">
              Nenhuma sessao ativa ainda.
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

function authModeClass(current: string, target: string) {
  return current === target ? 'pill active' : 'pill';
}
