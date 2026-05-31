import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import api from '../api';
import styles from './Admin.module.css';

const TABS = ['Dashboard', 'Prompts', 'Users'];

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Dashboard');
  const [stats, setStats] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', text: '', negative_prompt: '', category: 'travel', tags: '', thumbnail_url: '', images: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (tab === 'Prompts') api.get('/admin/prompts').then((r) => setPrompts(r.data)).catch(() => {});
    if (tab === 'Users') api.get('/admin/users').then((r) => setUsers(r.data)).catch(() => {});
  }, [tab]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const savePrompt = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      images: form.images.split(',').map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (editId) {
        await api.put(`/admin/prompts/${editId}`, payload);
      } else {
        await api.post('/admin/prompts', payload);
      }
      setForm({ title: '', text: '', negative_prompt: '', category: 'travel', tags: '', thumbnail_url: '', images: '' });
      setEditId(null);
      api.get('/admin/prompts').then((r) => setPrompts(r.data));
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    }
  };

  const deletePrompt = async (id) => {
    if (!confirm('Delete this prompt?')) return;
    await api.delete(`/admin/prompts/${id}`);
    setPrompts((p) => p.filter((x) => x.id !== id));
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setForm({ title: p.title, text: p.text, negative_prompt: p.negative_prompt || '', category: p.category, tags: (p.tags || []).join(', '), thumbnail_url: p.thumbnail_url || '', images: (p.images || []).join(', ') });
  };

  const togglePremium = async (id) => {
    await api.patch(`/admin/users/${id}/premium`);
    api.get('/admin/users').then((r) => setUsers(r.data));
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers((u) => u.filter((x) => x.id !== id));
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Admin Console</div>
          {TABS.map((t) => (
            <button key={t} className={`${styles.navItem} ${tab === t ? styles.navItemActive : ''}`} onClick={() => setTab(t)}>
              {t === 'Dashboard' ? '📊' : t === 'Prompts' ? '🖼️' : '👥'} {t}
            </button>
          ))}
        </aside>

        <main className={styles.main}>
          {/* Dashboard */}
          {tab === 'Dashboard' && stats && (
            <>
              <h2 className={styles.pageTitle}>Dashboard</h2>
              <div className={styles.metricsGrid}>
                {[
                  { label: 'Total Prompts', value: stats.totalPrompts },
                  { label: 'Total Users', value: stats.totalUsers },
                  { label: 'Premium Users', value: stats.premiumUsers },
                  { label: 'Completed Generations', value: stats.completedRequests },
                ].map((m) => (
                  <div key={m.label} className={styles.metricCard}>
                    <div className={styles.metricLabel}>{m.label}</div>
                    <div className={styles.metricValue}>{(m.value || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Prompts */}
          {tab === 'Prompts' && (
            <>
              <h2 className={styles.pageTitle}>{editId ? 'Edit Prompt' : 'Add Prompt'}</h2>
              <form className={styles.form} onSubmit={savePrompt}>
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Title</label>
                    <input className={styles.input} value={form.title} onChange={set('title')} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Category</label>
                    <select className={styles.input} value={form.category} onChange={set('category')}>
                      {['travel', 'music', 'invite', 'love'].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Prompt Text</label>
                  <textarea className={styles.textarea} value={form.text} onChange={set('text')} required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Negative Prompt</label>
                  <textarea className={styles.textarea} style={{ minHeight: 60 }} value={form.negative_prompt} onChange={set('negative_prompt')} />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Tags (comma separated)</label>
                    <input className={styles.input} value={form.tags} onChange={set('tags')} placeholder="sunset, portrait, cinematic" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Thumbnail URL</label>
                    <input className={styles.input} value={form.thumbnail_url} onChange={set('thumbnail_url')} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Reference Image URLs (comma separated)</label>
                  <input className={styles.input} value={form.images} onChange={set('images')} />
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnPrimary}>{editId ? 'Update Prompt' : '+ Add Prompt'}</button>
                  {editId && <button type="button" className={styles.btnGhost} onClick={() => { setEditId(null); setForm({ title: '', text: '', negative_prompt: '', category: 'travel', tags: '', thumbnail_url: '', images: '' }); }}>Cancel</button>}
                </div>
              </form>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Category</th><th>Clicks</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {prompts.map((p) => (
                      <tr key={p.id}>
                        <td className={styles.tdBold}>{p.title}</td>
                        <td><span className={styles.pill} style={{ textTransform: 'capitalize' }}>{p.category}</span></td>
                        <td>{(p.click_count || 0).toLocaleString()}</td>
                        <td><span className={p.is_active ? styles.pillLive : styles.pillDraft}>{p.is_active ? 'Live' : 'Draft'}</span></td>
                        <td>
                          <div className={styles.actions}>
                            <button className={styles.actBtn} onClick={() => startEdit(p)}>Edit</button>
                            <button className={styles.actBtn} style={{ color: 'var(--pf-coral)' }} onClick={() => deletePrompt(p.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Users */}
          {tab === 'Users' && (
            <>
              <h2 className={styles.pageTitle}>Users</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Premium</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className={styles.tdBold}>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className={styles.pill}>{u.role}</span></td>
                        <td><span className={u.is_premium ? styles.pillLive : styles.pillDraft}>{u.is_premium ? '⭐ Yes' : 'No'}</span></td>
                        <td>
                          <div className={styles.actions}>
                            <button className={styles.actBtn} onClick={() => togglePremium(u.id)}>{u.is_premium ? 'Revoke' : 'Grant'} Premium</button>
                            <button className={styles.actBtn} style={{ color: 'var(--pf-coral)' }} onClick={() => deleteUser(u.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
