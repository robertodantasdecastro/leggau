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
    throw new Error(`Falha em ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
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

  const stats = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      ['Pais', overview.counts.parents],
      ['Criancas', overview.counts.children],
      ['Admins', overview.counts.admins],
      ['Profissionais', overview.counts.healthProfessionals],
      ['Downloads', overview.metrics.downloads],
      ['Instalacoes', overview.metrics.reportedInstallations],
    ];
  }, [overview]);

  async function loadDashboard(activeToken: string) {
    const [overviewResponse, realtimeResponse, billingResponse, usersResponse] =
      await Promise.all([
        apiRequest<AdminOverview>('/admin/overview', activeToken),
        apiRequest<Realtime>('/admin/realtime', activeToken),
        apiRequest<BillingOverview>('/admin/billing/overview', activeToken),
        apiRequest<Record<string, unknown>>('/admin/users', activeToken),
      ]);

    setOverview(overviewResponse);
    setRealtime(realtimeResponse);
    setBilling(billingResponse);
    setUsers(usersResponse);
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

  if (!token) {
    return (
      <div className="panel hero">
        <div>
          <h1>Leggau Admin</h1>
          <p className="muted">
            Painel operacional com visao de usuarios, servicos, VM e billing em
            sandbox.
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
        {error ? <p className="muted">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="panel hero">
        <div>
          <h1>Leggau Admin</h1>
          <p className="muted">
            Operacao unificada do app, do backend na VM e do billing sandbox.
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
          <p className="muted">Servicos monitorados a partir do backend.</p>
        </article>
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
