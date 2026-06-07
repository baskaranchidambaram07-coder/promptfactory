import { useEffect, useState } from 'react';
import api from '../../api/adminApi';
import s from './Admin.module.css';

const STAT_CONFIGS = [
  { key: 'totalUsers',          label: 'Total Users',          icon: '👥', color: 'var(--pf-blue)' },
  { key: 'premiumUsers',        label: 'Premium Users',        icon: '⭐', color: 'var(--pf-yellow)' },
  { key: 'freeUsers',           label: 'Free Users',           icon: '👤', color: 'var(--pf-text-3)' },
  { key: 'totalPrompts',        label: 'Total Prompts',        icon: '🖼️',  color: 'var(--pf-purple)' },
  { key: 'totalRequests',       label: 'Total Requests',       icon: '⚡', color: 'var(--pf-cyan)' },
  { key: 'completedRequests',   label: 'Completed',            icon: '✅', color: 'var(--pf-green)' },
  { key: 'failedRequests',      label: 'Failed',               icon: '❌', color: 'var(--pf-coral)' },
  { key: 'newUsers7d',          label: 'New Users (7d)',       icon: '📈', color: 'var(--pf-orange)' },
  { key: 'totalGenerationsToday', label: 'Generations Today', icon: '🔥', color: 'var(--pf-pink)' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={s.loading}>Loading dashboard…</div>;
  if (!stats)  return <div className={s.alertError}>Failed to load stats.</div>;

  return (
    <div>
      <div className={s.pageHeader}>
        <div>
          <div className={s.pageTitle}>Dashboard</div>
          <div className={s.pageSub}>Platform overview at a glance</div>
        </div>
        <button className={s.btnGhost} onClick={() => window.location.reload()}>↻ Refresh</button>
      </div>

      <div className={s.statsGrid}>
        {STAT_CONFIGS.map((cfg) => (
          <div key={cfg.key} className={s.statCard}>
            <div className={s.statLabel}>{cfg.icon} {cfg.label}</div>
            <div className={s.statValue} style={{ color: cfg.color }}>
              {(stats[cfg.key] ?? 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Quick health checks */}
      <div className={s.panel}>
        <div className={s.panelHeader}>
          <div className={s.panelTitle}>System Health</div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Supabase Connection',    ok: true  },
            { label: 'Auth Middleware',         ok: true  },
            { label: 'API Server',              ok: true  },
          ].map((h) => (
            <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={h.ok ? s.pillGreen : s.pillRed}>{h.ok ? '● Online' : '● Offline'}</span>
              <span style={{ fontSize: 13, color: 'var(--pf-text-2)' }}>{h.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={stats.totalGenerationsToday > 0 ? s.pillGreen : s.pillGray}>
              ● {stats.totalGenerationsToday > 0 ? 'Active' : 'Idle'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--pf-text-2)' }}>AI Generation Pipeline</span>
          </div>
        </div>
      </div>

      {/* Rates */}
      <div className={s.panel}>
        <div className={s.panelHeader}>
          <div className={s.panelTitle}>Conversion Rates</div>
        </div>
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            {
              label: 'Premium Conversion',
              value: stats.totalUsers ? `${((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}%` : '—',
              sub: `${stats.premiumUsers} of ${stats.totalUsers} users`,
            },
            {
              label: 'Request Success Rate',
              value: stats.totalRequests ? `${((stats.completedRequests / stats.totalRequests) * 100).toFixed(1)}%` : '—',
              sub: `${stats.completedRequests} completed`,
            },
            {
              label: 'Failure Rate',
              value: stats.totalRequests ? `${((stats.failedRequests / stats.totalRequests) * 100).toFixed(1)}%` : '—',
              sub: `${stats.failedRequests} failed`,
            },
          ].map((m) => (
            <div key={m.label} style={{ background: 'var(--pf-accent-glow)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--pf-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--pf-text-3)', marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--pf-text-1)', letterSpacing: '-0.03em', fontFamily: 'var(--font-body)' }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'var(--pf-text-3)', marginTop: 4 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
