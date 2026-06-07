import { useState, useEffect, useCallback } from 'react';
import api from '../../api/adminApi';
import s from './Admin.module.css';

export default function Subscriptions() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');
  const [msg, setMsg]         = useState(null);
  const [stats, setStats]     = useState({ total: 0, premium: 0, free: 0 });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    api.get(`/admin/subscriptions?${params}`)
      .then((r) => {
        setUsers(r.data);
        const total = r.data.length;
        const premium = r.data.filter((u) => u.is_premium).length;
        setStats({ total, premium, free: total - premium });
      })
      .catch(() => flash('error', 'Failed to load subscriptions'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const togglePlan = async (id, name, current) => {
    const action = current ? `Downgrade "${name}" to Free?` : `Upgrade "${name}" to Premium?`;
    if (!confirm(action)) return;
    try {
      await api.patch(`/admin/subscriptions/${id}`, { is_premium: !current });
      flash('success', `${name} ${!current ? 'upgraded to Premium' : 'downgraded to Free'}`);
      load();
    } catch { flash('error', 'Update failed'); }
  };

  const bulkUpgrade = async () => {
    const free = users.filter((u) => !u.is_premium);
    if (!confirm(`Upgrade all ${free.length} free users to Premium?`)) return;
    try {
      await Promise.all(free.map((u) => api.patch(`/admin/subscriptions/${u.id}`, { is_premium: true })));
      flash('success', `${free.length} users upgraded`);
      load();
    } catch { flash('error', 'Bulk upgrade failed'); }
  };

  return (
    <div>
      <div className={s.pageHeader}>
        <div>
          <div className={s.pageTitle}>Subscription Management</div>
          <div className={s.pageSub}>Manage user plans and premium access</div>
        </div>
        <div className={s.actions}>
          <button className={s.btnGhost} onClick={bulkUpgrade}>⬆ Bulk Upgrade Free → Premium</button>
        </div>
      </div>

      {msg && <div className={msg.type === 'success' ? s.alertSuccess : s.alertError}>{msg.text}</div>}

      {/* Stats */}
      <div className={s.statsGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: stats.total, color: 'var(--pf-blue)' },
          { label: 'Premium', value: stats.premium, color: 'var(--pf-yellow)' },
          { label: 'Free', value: stats.free, color: 'var(--pf-text-3)' },
        ].map((st) => (
          <div key={st.label} className={s.statCard}>
            <div className={s.statLabel}>{st.label}</div>
            <div className={s.statValue} style={{ color: st.color }}>{st.value.toLocaleString()}</div>
            {stats.total > 0 && (
              <div className={s.statDelta}>{((st.value / stats.total) * 100).toFixed(1)}% of users</div>
            )}
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className={s.panel}>
        <div className={s.panelHeader}><div className={s.panelTitle}>Filter</div></div>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 10 }}>
          {['', 'premium', 'free'].map((f) => (
            <button
              key={f || 'all'}
              className={filter === f ? s.btnPrimary : s.btnGhost}
              onClick={() => setFilter(f)}
            >
              {f === '' ? 'All Users' : f === 'premium' ? '⭐ Premium' : '👤 Free'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={s.panel}>
        <div className={s.tableWrap}>
          {loading ? (
            <div className={s.loading}>Loading…</div>
          ) : users.length === 0 ? (
            <div className={s.empty}><div className={s.emptyIcon}>👥</div>No users found</div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Daily Usage</th>
                  <th>Role</th>
                  <th>Since</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className={s.tdBold}>{u.name}</td>
                    <td className={s.tdMono}>{u.email}</td>
                    <td>
                      <span className={u.is_premium ? s.pillGreen : s.pillGray}>
                        {u.is_premium ? '⭐ Premium' : 'Free'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {u.daily_generations_used} / {u.is_premium ? '∞' : '3'}
                    </td>
                    <td><span className={u.role === 'admin' ? s.pillAmber : s.pill}>{u.role}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--pf-text-3)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className={u.is_premium ? s.btnDanger : s.btnSm}
                        onClick={() => togglePlan(u.id, u.name, u.is_premium)}
                      >
                        {u.is_premium ? '⬇ Downgrade' : '⬆ Upgrade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
