import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import api from '../api';
import styles from './Admin.module.css';

const TABS = ['Dashboard', 'Prompts', 'Users'];

const EMPTY_FORM = {
  promptdescription: '',
  Categories: '',
  tags: '',
  FromURL: '',
  ToURL: '',
  usedcount: 0,
};

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]       = useState('Dashboard');
  const [stats, setStats]   = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [users, setUsers]   = useState([]);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Image generation states
  const [genLoading, setGenLoading]   = useState(false);
  const [genPreview, setGenPreview]   = useState(null);   // temp OpenAI URL
  const [uploadLoading, setUploadLoading] = useState(false);
  const [genError, setGenError]       = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (tab === 'Prompts') api.get('/admin/prompts').then((r) => setPrompts(r.data)).catch(() => {});
    if (tab === 'Users')   api.get('/admin/users').then((r) => setUsers(r.data)).catch(() => {});
  }, [tab]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
    setGenPreview(null);
    setGenError('');
  };

  // ── Generate image via OpenAI ──
  const handleGenerate = async () => {
    if (!form.promptdescription.trim()) {
      setGenError('Please enter prompt text first before generating.');
      return;
    }
    setGenError('');
    setGenLoading(true);
    setGenPreview(null);
    try {
      const r = await api.post('/admin/generate-image', { prompt: form.promptdescription });
      setGenPreview(r.data.imageUrl);
    } catch (err) {
      setGenError(err.response?.data?.error || 'Image generation failed. Check your OpenAI API key.');
    }
    setGenLoading(false);
  };

  // ── Upload preview to Cloudinary → autofill ToURL ──
  const handleUseImage = async () => {
    if (!genPreview) return;
    setUploadLoading(true);
    try {
      const r = await api.post('/admin/upload-to-cloudinary', { imageUrl: genPreview });
      setForm((f) => ({ ...f, ToURL: r.data.cloudinaryUrl }));
      setGenPreview(null);
    } catch (err) {
      setGenError(err.response?.data?.error || 'Cloudinary upload failed.');
    }
    setUploadLoading(false);
  };

  const handleSavePrompt = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        usedcount: parseInt(form.usedcount) || 0,
      };
      if (editId) {
        await api.put(`/admin/prompts/${editId}`, payload);
      } else {
        await api.post('/admin/prompts', payload);
      }
      resetForm();
      api.get('/admin/prompts').then((r) => setPrompts(r.data));
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    }
  };

  const startEdit = (p) => {
    setForm({
      promptdescription: p.promptdescription || '',
      Categories: p.Categories || '',
      tags: p.tags || '',
      FromURL: p.FromURL || '',
      ToURL: p.ToURL || '',
      usedcount: p.usedcount || 0,
    });
    setEditId(p.PromptId);
    setShowForm(true);
    setGenPreview(null);
    setGenError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePrompt = async (id) => {
    if (!confirm('Delete this prompt?')) return;
    await api.delete(`/admin/prompts/${id}`);
    setPrompts((p) => p.filter((x) => x.PromptId !== id));
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

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Admin Console</div>
          {TABS.map((t) => (
            <button
              key={t}
              className={`${styles.navItem} ${tab === t ? styles.navItemActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'Dashboard' ? '📊' : t === 'Prompts' ? '🖼️' : '👥'} {t}
            </button>
          ))}
        </aside>

        <main className={styles.main}>

          {/* ── Dashboard ── */}
          {tab === 'Dashboard' && stats && (
            <>
              <h2 className={styles.pageTitle}>Dashboard</h2>
              <div className={styles.metricsGrid}>
                {[
                  { label: 'Total Prompts',        value: stats.totalPrompts },
                  { label: 'Total Users',           value: stats.totalUsers },
                  { label: 'Premium Users',         value: stats.premiumUsers },
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

          {/* ── Prompts ── */}
          {tab === 'Prompts' && (
            <>
              <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Prompts</h2>
                {!showForm && (
                  <button className={styles.btnPrimary} onClick={() => { resetForm(); setShowForm(true); }}>
                    + Add Prompt
                  </button>
                )}
              </div>

              {/* Add / Edit Form */}
              {showForm && (
                <form className={styles.form} onSubmit={handleSavePrompt}>
                  <div className={styles.formTitle}>{editId ? '✏️ Edit Prompt' : '➕ New Prompt'}</div>

                  {/* Category + Tags row */}
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Category</label>
                      <input className={styles.input} value={form.Categories} onChange={set('Categories')} placeholder="e.g. Couples, Travel, Women" required />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Tags (comma separated)</label>
                      <input className={styles.input} value={form.tags} onChange={set('tags')} placeholder="portrait, traditional, outdoor" />
                    </div>
                  </div>

                  {/* Prompt description */}
                  <div className={styles.field}>
                    <label className={styles.label}>Prompt Description</label>
                    <textarea className={styles.textarea} value={form.promptdescription} onChange={set('promptdescription')} placeholder="Full prompt text used for AI image generation…" required />
                  </div>

                  {/* From URL (before image) */}
                  <div className={styles.field}>
                    <label className={styles.label}>From (Before) Image URL</label>
                    <input className={styles.input} value={form.FromURL} onChange={set('FromURL')} placeholder="https://res.cloudinary.com/…" />
                    {form.FromURL && (
                      <img src={form.FromURL} alt="from" className={styles.urlPreview} onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                  </div>

                  {/* To URL (after image) — AI generated */}
                  <div className={styles.field}>
                    <label className={styles.label}>To (After) Image URL</label>

                    {/* Generate button */}
                    {!genPreview && (
                      <button
                        type="button"
                        className={styles.btnGenerate}
                        onClick={handleGenerate}
                        disabled={genLoading}
                      >
                        {genLoading ? (
                          <><span className={styles.spinner} /> Generating image…</>
                        ) : (
                          '🤖 Generate Image with AI'
                        )}
                      </button>
                    )}

                    {genError && <div className={styles.genError}>{genError}</div>}

                    {/* Generated image preview */}
                    {genPreview && (
                      <div className={styles.genPreviewBox}>
                        <img src={genPreview} alt="Generated" className={styles.genPreviewImg} />
                        <div className={styles.genPreviewActions}>
                          <button type="button" className={styles.btnUse} onClick={handleUseImage} disabled={uploadLoading}>
                            {uploadLoading ? '⏳ Uploading…' : '✅ Use this Image'}
                          </button>
                          <button type="button" className={styles.btnRegenerate} onClick={handleGenerate} disabled={genLoading}>
                            {genLoading ? '⏳ Generating…' : '🔁 Regenerate'}
                          </button>
                          <button type="button" className={styles.btnCancel} onClick={() => { setGenPreview(null); setGenError(''); }}>
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show autofilled URL after upload */}
                    {form.ToURL && !genPreview && (
                      <div className={styles.toUrlSet}>
                        <span className={styles.toUrlCheck}>✅ Image uploaded to Cloudinary</span>
                        <img src={form.ToURL} alt="to" className={styles.urlPreview} onError={(e) => { e.target.style.display = 'none'; }} />
                        <input className={styles.input} value={form.ToURL} onChange={set('ToURL')} style={{ marginTop: 8 }} />
                        <button type="button" className={styles.btnRegenerateSmall} onClick={handleGenerate} disabled={genLoading}>
                          🔁 Regenerate new image
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Used count */}
                  <div className={styles.field} style={{ maxWidth: 200 }}>
                    <label className={styles.label}>Used Count</label>
                    <input className={styles.input} type="number" value={form.usedcount} onChange={set('usedcount')} min={0} />
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={styles.btnPrimary}>
                      {editId ? '💾 Update Prompt' : '💾 Save Prompt'}
                    </button>
                    <button type="button" className={styles.btnGhost} onClick={resetForm}>Cancel</button>
                  </div>
                </form>
              )}

              {/* Prompts table */}
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category</th>
                      <th>Tags</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Uses</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prompts.map((p) => (
                      <tr key={p.PromptId}>
                        <td className={styles.tdBold}>#{p.PromptId}</td>
                        <td><span className={styles.pill}>{p.Categories}</span></td>
                        <td style={{ fontSize: 11, color: 'var(--pf-text-3)' }}>{(p.tags || '').slice(0, 30)}</td>
                        <td>
                          {p.FromURL && <img src={p.FromURL} alt="from" className={styles.tableThumb} onError={(e) => { e.target.style.display = 'none'; }} />}
                        </td>
                        <td>
                          {p.ToURL && <img src={p.ToURL} alt="to" className={styles.tableThumb} onError={(e) => { e.target.style.display = 'none'; }} />}
                        </td>
                        <td>{p.usedcount || 0}</td>
                        <td>
                          <div className={styles.actions}>
                            <button className={styles.actBtn} onClick={() => startEdit(p)}>Edit</button>
                            <button className={styles.actBtn} style={{ color: 'var(--pf-coral)' }} onClick={() => deletePrompt(p.PromptId)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Users ── */}
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
