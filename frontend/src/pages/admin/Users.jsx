import { useState, useEffect, useCallback } from 'react';
import api from '../../api/adminApi';
import s from './Admin.module.css';

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('');
  const [premFilter, setPrem]   = useState('');
  const [editing, setEditing]   = useState(null);   // user object being edited
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);   // { type: 'success'|'error', text }

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)     params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (premFilter) params.set('premium', premFilter);
    api.get(`/admin/users?${params}`)
      .then((r) => setUsers(r.data))
      .catch(() => flash('error', 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [search, roleFilter, premFilter]);

  useEffect(() => { load(); }, [load]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const openEdit = (u) => {
    setEditing(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, is_premium: u.is_premium });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${editing.id}`, editForm);
      flash('success', 'User updated successfully');
      setEditing(null);
      load();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Update failed');
    }
    setSaving(false);
  };

  const togglePremium = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/premium`);
      load();
    } catch { flash('error', 'Failed to update premium status'); }
  };

  const resetUsage = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/reset-usage`);
      flash('success', 'Daily usage reset');
      load();
    } catch { flash('error', 'Failed to reset usage'); }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      flash('success', 'User deleted');
      load();
    } catch (err) { flash('error', err.response?.data?.error || 'Delete failed'); }
  };

  return (
    <div>
      <div className={s.pageHeader}>
        <div>
          <div className={s.pageTitle}>User Management</div>
          <div className={s.pageSub}>{users.length} users found</div>
        </div>
      </div>

      {msg && <div className={msg.type === 'success' ? s.alertSuccess : s.alertError}>{msg.text}</div>}

      {/* Filters */}
      <div className={s.panel}>
        <div className={s.panelHeader}>
          <div className={s.panelTitle}>Filters</div>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className={s.searchInput}
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className={s.select} style={{ width: 140 }} value={roleFilter} onChange={(e) => setRole(e.target.value)}>
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select className={s.select} style={{ width: 160 }} value={premFilter} onChange={(e) => setPrem(e.target.value)}>
            <option value="">All Plans</option>
            <option value="true">Premium Only</option>
            <option value="false">Free Only</option>
          </select>
          <button className={s.btnGhost} onClick={load}>Apply</button>
        </div>
      </div>

      {/* Edit drawer */}
      {editing && (
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <div className={s.panelTitle}>Edit User — {editing.email}</div>
            <button className={s.btnGhost} onClick={() => setEditing(null)}>✕ Cancel</button>
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label}>Name</label>
              <input className={s.input} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Email</label>
              <input className={s.input} type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Role</label>
              <select className={s.select} value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>Plan</label>
              <select className={s.select} value={editForm.is_premium ? 'true' : 'false'} onChange={(e) => setEditForm((f) => ({ ...f, is_premium: e.target.value === 'true' }))}>
                <option value="false">Free</option>
                <option value="true">Premium</option>
              </select>
            </div>
          </div>
          <div className={s.formFooter}>
            <button className={s.btnPrimary} onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button className={s.btnGhost} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={s.panel}>
        <div className={s.tableWrap}>
          {loading ? (
            <div className={s.loading}>Loading users…</div>
          ) : users.length === 0 ? (
            <div className={s.empty}><div className={s.emptyIcon}>👥</div>No users found</div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Daily Usage</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className={s.tdBold}>{u.name}</td>
                    <td className={s.tdMono}>{u.email}</td>
                    <td>
                      <span className={u.role === 'admin' ? s.pillAmber : s.pill}>{u.role}</span>
                    </td>
                    <td>
                      <span className={u.is_premium ? s.pillGreen : s.pillGray}>
                        {u.is_premium ? '⭐ Premium' : 'Free'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--pf-text-2)' }}>
                        {u.daily_generations_used} / {u.is_premium ? '∞' : '3'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--pf-text-3)', whiteSpace: 'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={s.actions}>
                        <button className={s.btnSm} onClick={() => openEdit(u)}>Edit</button>
                        <button className={s.btnSm} onClick={() => togglePremium(u.id)}>
                          {u.is_premium ? 'Revoke' : 'Upgrade'}
                        </button>
                        <button className={s.btnSm} onClick={() => resetUsage(u.id)}>Reset Usage</button>
                        <button className={s.btnDanger} onClick={() => deleteUser(u.id, u.name)}>Delete</button>
                      </div>
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
