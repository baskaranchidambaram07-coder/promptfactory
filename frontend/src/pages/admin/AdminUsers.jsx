import { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import s from './Admin.module.css';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'manager' };

const ROLE_BADGE = {
  admin:   { cls: s.pillAmber, label: '🛡 Admin'   },
  manager: { cls: s.pill,      label: '👤 Manager' },
};

export default function AdminUsers() {
  const { adminUser } = useAdminAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.get('/admin/admin-users')
      .then((r) => setUsers(r.data))
      .catch(() => flash('error', 'Failed to load admin users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (u) => {
    setEditId(u.id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (editId && !payload.password) delete payload.password; // keep existing pwd
      if (editId) {
        await adminApi.put(`/admin/admin-users/${editId}`, payload);
        flash('success', 'Account updated');
      } else {
        await adminApi.post('/admin/admin-users', payload);
        flash('success', 'Account created');
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Save failed');
    }
    setSaving(false);
  };

  const toggle = async (u) => {
    const action = u.is_active ? 'Deactivate' : 'Activate';
    if (!confirm(`${action} "${u.name}"?`)) return;
    try {
      await adminApi.patch(`/admin/admin-users/${u.id}/toggle`);
      flash('success', `${u.name} ${u.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) { flash('error', err.response?.data?.error || 'Failed'); }
  };

  const del = async (u) => {
    if (!confirm(`Permanently delete "${u.name}"? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/admin/admin-users/${u.id}`);
      flash('success', `${u.name} deleted`);
      load();
    } catch (err) { flash('error', err.response?.data?.error || 'Delete failed'); }
  };

  return (
    <div>
      <div className={s.pageHeader}>
        <div>
          <div className={s.pageTitle}>Admin Portal Users</div>
          <div className={s.pageSub}>Manage who can access this admin console — admins and managers</div>
        </div>
        <button className={s.btnPrimary} onClick={openAdd}>+ Add Account</button>
      </div>

      {msg && <div className={msg.type === 'success' ? s.alertSuccess : s.alertError}>{msg.text}</div>}

      {/* Role legend */}
      <div className={s.panel} style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { role: 'Admin', icon: '🛡', desc: 'Full access — can manage admin users, all modules' },
            { role: 'Manager', icon: '👤', desc: 'Operational access — prompts, images, users, subscriptions, usage, LLM keys' },
          ].map((r) => (
            <div key={r.role} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pf-text-1)' }}>{r.role}</div>
                <div style={{ fontSize: 12, color: 'var(--pf-text-3)' }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <div className={s.panelTitle}>{editId ? 'Edit Account' : 'New Admin Account'}</div>
            <button className={s.btnGhost} onClick={() => setShowForm(false)}>✕ Cancel</button>
          </div>
          <form onSubmit={save}>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label}>Full Name</label>
                <input className={s.input} placeholder="John Smith" value={form.name} onChange={set('name')} required />
              </div>
              <div className={s.field}>
                <label className={s.label}>Email</label>
                <input className={s.input} type="email" placeholder="john@promptfactory.io" value={form.email} onChange={set('email')} required />
              </div>
              <div className={s.field}>
                <label className={s.label}>
                  Password {editId && <span style={{ fontWeight: 400, color: 'var(--pf-text-3)' }}>(leave blank to keep existing)</span>}
                </label>
                <input
                  className={s.input}
                  type="password"
                  placeholder={editId ? '••••••••' : 'Min 8 characters'}
                  value={form.password}
                  onChange={set('password')}
                  required={!editId}
                  minLength={editId ? 0 : 8}
                  autoComplete="new-password"
                />
              </div>
              <div className={s.field}>
                <label className={s.label}>Role</label>
                <select className={s.select} value={form.role} onChange={set('role')}>
                  <option value="manager">👤 Manager</option>
                  <option value="admin">🛡 Admin</option>
                </select>
              </div>
            </div>
            <div className={s.formFooter}>
              <button type="submit" className={s.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Update Account' : 'Create Account'}
              </button>
              <button type="button" className={s.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className={s.panel}>
        <div className={s.tableWrap}>
          {loading ? (
            <div className={s.loading}>Loading…</div>
          ) : users.length === 0 ? (
            <div className={s.empty}><div className={s.emptyIcon}>🛡</div>No admin accounts found</div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === adminUser?.id;
                  const badge = ROLE_BADGE[u.role] || ROLE_BADGE.manager;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            background: u.role === 'admin' ? 'rgba(255,217,61,0.15)' : 'var(--pf-accent-glow)',
                            border: '1px solid var(--pf-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13,
                          }}>
                            {u.role === 'admin' ? '🛡' : '👤'}
                          </div>
                          <span className={s.tdBold}>{u.name}</span>
                          {isSelf && (
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(77,159,255,0.15)', color: 'var(--pf-blue)', fontWeight: 700 }}>
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={s.tdMono}>{u.email}</td>
                      <td><span className={badge.cls}>{badge.label}</span></td>
                      <td>
                        <span className={u.is_active ? s.pillGreen : s.pillRed}>
                          {u.is_active ? '● Active' : '● Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--pf-text-3)', whiteSpace: 'nowrap' }}>
                        {u.last_login ? new Date(u.last_login).toLocaleString() : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--pf-text-3)', whiteSpace: 'nowrap' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className={s.actions}>
                          <button className={s.btnSm} onClick={() => openEdit(u)}>Edit</button>
                          {!isSelf && (
                            <>
                              <button className={s.btnSm} onClick={() => toggle(u)}>
                                {u.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button className={s.btnDanger} onClick={() => del(u)}>Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
