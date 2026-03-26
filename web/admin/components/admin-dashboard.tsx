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
  services: Record<string, string>;
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
            onChange={(event) =>
              onChange({ allowedAudiences: event.target.value })
            }
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
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [realtime, setRealtime] = useState<Realtime | null>(null);
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [users, setUsers] = useState<Record<string, unknown> | null>(null);
  const [providers, setProviders] = useState<AuthProviderConfig[]>([]);
  const [providerForms, setProviderForms] = useState<
    Record<string, ProviderFormState>
  >({});
  const [providerSaving, setProviderSaving] = useState<Record<string, boolean>>({});
  const [providerErrors, setProviderErrors] = useState<Record<string, string | null>>(
    {},
  );
  const [mediaJobs, setMediaJobs] = useState<MediaVerificationJob[]>([]);

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

  async function loadDashboard(activeToken: string) {
    const [
      overviewResponse,
      realtimeResponse,
      billingResponse,
      usersResponse,
      providerResponse,
      mediaResponse,
    ] = await Promise.all([
      apiRequest<AdminOverview>('/admin/overview', activeToken),
      apiRequest<Realtime>('/admin/realtime', activeToken),
      apiRequest<BillingOverview>('/admin/billing/overview', activeToken),
      apiRequest<Record<string, unknown>>('/admin/users', activeToken),
      apiRequest<AuthProviderConfig[]>('/admin/auth/providers', activeToken),
      apiRequest<MediaVerificationJob[]>(
        '/admin/media-verification/jobs',
        activeToken,
      ),
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

  if (!token) {
    return (
      <div className="panel hero">
        <div>
          <h1>Leggau Admin</h1>
          <p className="muted">
            Painel operacional com visao de usuarios, seguranca, provedores de
            conta e verificacao documental.
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
        <div>
          <h1>Leggau Admin</h1>
          <p className="muted">
            Operacao unificada do app, do backend na VM, dos provedores sociais e
            dos testes de verificacao.
          </p>
        </div>
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
          <p className="muted">
            Neto: R$ {((billing?.totals.netCents ?? 0) / 100).toFixed(2)}
          </p>
        </article>
        <article className="card">
          <h2>API</h2>
          <p className="muted">{overview?.app.apiBaseUrl ?? apiBase}</p>
          <p className="muted">
            A mesma base agora serve auth multiactor, vinculos, consentimento,
            provedores sociais e verificacao de midia.
          </p>
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
                <td>{new Date(job.createdAt).toLocaleString('pt-BR')}</td>
                <td>{job.verificationType}</td>
                <td>{job.sampleKey ?? '-'}</td>
                <td>{job.status}</td>
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
      </section>

      <section className="panel">
        <h2>Usuarios</h2>
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
      </section>

      <section className="panel">
        <h2>Snapshot bruto</h2>
        <pre>{JSON.stringify(users, null, 2)}</pre>
      </section>
    </div>
  );
}
