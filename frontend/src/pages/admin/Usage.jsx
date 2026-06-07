import { useState, useEffect, useCallback } from 'react';
import api from '../../api/adminApi';
import s from './Admin.module.css';

const STATUS_COLORS = {
  completed: 'pillGreen',
  failed:    'pillRed',
  pending:   'pillAmber',
  processing:'pill',
};

export default function Usage() {
  const [summary, setSummary]   = useState(null);
  const [requests, setRequests] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [statusFilter, setStatus] = useState('');
  const [loading, setLoading]   = useState(true);
  const [reqLoading, setReqLoading] = useState(true);
  const LIMIT = 30;

  useEffect(() => {
    api.get('/admin/usage').then((r) => setSummary(r.data)).catch(() => {});
  }, []);

  const loadRequests = useCallback((p = page) => {
    setReqLoading(true);
    const params = new URLSearchParams({ page: p, limit: LIMIT });
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/admin/requests?${params}`)
      .then((r) => { setRequests(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => { setReqLoading(false); setLoading(false); });
  }, [page, statusFilter]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className={s.pageHeader}>
        <div>
          <div className={s.pageTitle}>Usage Management</div>
          <div className={s.pageSub}>AI generation requests, daily usage, and top users</div>
        </div>
        <button className={s.btnGhost} onClick={() => { loadRequests(1); setPage(1); }}>↻ Refresh</button>
      </div>

      {/* Summary stats */}
      {summary && (
        <>
          <div className={s.statsGrid}>
            {[
              { label: 'Total Requests',     value: summary.totalRequests,     color: 'var(--pf-blue)' },
              { label: 'Completed',          value: summary.completedRequests, color: 'var(--pf-green)' },
              { label: 'Failed',             value: summary.failedRequests,    color: 'var(--pf-coral)' },
              { label: 'Pending',            value: summary.pendingRequests,   color: 'var(--pf-yellow)' },
            ].map((st) => (
              <div key={st.label} className={s.statCard}>
                <div className={s.statLabel}>{st.label}</div>
                <div className={s.statValue} style={{ color: st.color }}>{(st.value || 0).toLocaleString()}</div>
                {summary.totalRequests > 0 && (
                  <div className={s.statDelta}>{(((st.value || 0) / summary.totalRequests) * 100).toFixed(1)}%</div>
                )}
              </div>
            ))}
          </div>

          {/* Top users by usage */}
          {summary.topUsers?.length > 0 && (
            <div className={s.panel} style={{ marginBottom: 20 }}>
              <div className={s.panelHeader}>
                <div className={s.panelTitle}>Top Users by Daily Generations</div>
              </div>
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Plan</th><th>Daily Usage</th><th>Reset At</th></tr>
                  </thead>
                  <tbody>
                    {summary.topUsers.slice(0, 10).map((u) => (
                      <tr key={u.id}>
                        <td className={s.tdBold}>{u.name}</td>
                        <td className={s.tdMono}>{u.email}</td>
                        <td><span className={u.is_premium ? s.pillGreen : s.pillGray}>{u.is_premium ? '⭐ Premium' : 'Free'}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={s.tdBold}>{u.daily_generations_used}</span>
                            <div style={{ flex: 1, height: 6, background: 'var(--pf-border)', borderRadius: 3, maxWidth: 80 }}>
                              <div style={{
                                height: '100%',
                                borderRadius: 3,
                                width: `${Math.min(100, (u.daily_generations_used / (u.is_premium ? 20 : 3)) * 100)}%`,
                                background: u.daily_generations_used >= 3 ? 'var(--pf-coral)' : 'var(--pf-green)',
                              }} />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--pf-text-3)' }}>/ {u.is_premium ? '∞' : '3'}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--pf-text-3)' }}>
                          {u.daily_reset_at ? new Date(u.daily_reset_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Requests log */}
      <div className={s.panel}>
        <div className={s.panelHeader}>
          <div className={s.panelTitle}>Generation Requests Log</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['', 'completed', 'failed', 'pending', 'processing'].map((st) => (
              <button
                key={st || 'all'}
                className={statusFilter === st ? s.btnPrimary : s.btnGhost}
                style={{ padding: '5px 12px', fontSize: 12 }}
                onClick={() => { setStatus(st); setPage(1); }}
              >
                {st || 'All'}
              </button>
            ))}
          </div>
        </div>
        <div className={s.tableWrap}>
          {reqLoading ? (
            <div className={s.loading}>Loading requests…</div>
          ) : requests.length === 0 ? (
            <div className={s.empty}><div className={s.emptyIcon}>⚡</div>No requests found</div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr><th>User</th><th>Prompt (preview)</th><th>Status</th><th>Pipeline</th><th>Date</th></tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div>
                        <div className={s.tdBold} style={{ fontSize: 13 }}>{r.user?.name || '—'}</div>
                        <div className={s.tdMono} style={{ fontSize: 11, color: 'var(--pf-text-3)' }}>{r.user?.email || ''}</div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--pf-text-2)' }}>
                      {(r.prompt_text || '').slice(0, 100) || '—'}
                    </td>
                    <td><span className={s[STATUS_COLORS[r.status] || 'pill']}>{r.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--pf-text-3)' }}>
                      {r.ai_response?.pipeline || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--pf-text-3)', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className={s.pagination}>
            <span>Page {page} of {totalPages} · {total} requests</span>
            <div className={s.pageControls}>
              <button className={s.btnGhost} disabled={page <= 1} onClick={() => { setPage(p => p - 1); loadRequests(page - 1); }}>← Prev</button>
              <button className={s.btnGhost} disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); loadRequests(page + 1); }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
