import { useState, useEffect } from 'react';
import api from '../../api/adminApi';
import s from './Admin.module.css';

const PROVIDERS = [
  { value: 'openai',     label: 'OpenAI',         icon: '🤖', hint: 'sk-...' },
  { value: 'anthropic',  label: 'Anthropic',       icon: '🧠', hint: 'sk-ant-...' },
  { value: 'stability',  label: 'Stability AI',    icon: '🎨', hint: 'sk-...' },
  { value: 'replicate',  label: 'Replicate',       icon: '🔄', hint: 'r8_...' },
  { value: 'custom',     label: 'Custom Provider', icon: '⚙️',  hint: 'Custom key' },
];

const EMPTY = { provider: 'openai', api_key: '', notes: '' };

export default function LLMKeys() {
  const [keys, setKeys]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editKey, setEditKey]   = useState(null);   // key object being edited
  const [form, setForm]         = useState(EMPTY);
  const [reveal, setReveal]     = useState({});     // { [id]: bool }
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/llm-keys')
      .then((r) => setKeys(r.data))
      .catch(() => flash('error', 'Failed to load keys'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const openAdd = () => {
    setEditKey(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (key) => {
    setEditKey(key);
    setForm({ provider: key.provider, api_key: '', notes: key.notes || '' });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.api_key && !editKey) return flash('error', 'API key is required');
    setSaving(true);
    try {
      const payload = { provider: form.provider, notes: form.notes };
      if (form.api_key) payload.api_key = form.api_key;
      await api.post('/admin/llm-keys', payload);
      flash('success', `${form.provider} key ${editKey ? 'updated' : 'saved'}`);
      setShowForm(false);
      setEditKey(null);
      load();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Save failed');
    }
    setSaving(false);
  };

  const toggleActive = async (id) => {
    try {
      await api.patch(`/admin/llm-keys/${id}/toggle`);
      load();
    } catch { flash('error', 'Toggle failed'); }
  };

  const deleteKey = async (id, provider) => {
    if (!confirm(`Delete the ${provider} key? AI features using this key will stop working.`)) return;
    try {
      await api.delete(`/admin/llm-keys/${id}`);
      flash('success', `${provider} key deleted`);
      load();
    } catch { flash('error', 'Delete failed'); }
  };

  const providerInfo = (v) => PROVIDERS.find((p) => p.value === v) || { label: v, icon: '🔑' };

  // Which providers are missing a key
  const configuredProviders = new Set(keys.map((k) => k.provider));
  const missingProviders = PROVIDERS.filter((p) => !configuredProviders.has(p.value));

  return (
    <div>
      <div className={s.pageHeader}>
        <div>
          <div className={s.pageTitle}>LLM Key Management</div>
          <div className={s.pageSub}>Securely store API keys for AI providers. Keys are masked after saving.</div>
        </div>
        <button className={s.btnPrimary} onClick={openAdd}>+ Add Key</button>
      </div>

      {msg && <div className={msg.type === 'success' ? s.alertSuccess : s.alertError}>{msg.text}</div>}

      {/* Missing providers notice */}
      {missingProviders.length > 0 && (
        <div className={s.panel} style={{ marginBottom: 20 }}>
          <div className={s.panelHeader}>
            <div className={s.panelTitle}>⚠️ Keys Not Configured</div>
          </div>
          <div style={{ padding: '14px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {missingProviders.map((p) => (
              <button
                key={p.value}
                className={s.btnGhost}
                onClick={() => { setForm({ provider: p.value, api_key: '', notes: '' }); setEditKey(null); setShowForm(true); }}
              >
                {p.icon} Add {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <div className={s.panelTitle}>{editKey ? `Edit ${editKey.provider} Key` : 'Add New Key'}</div>
            <button className={s.btnGhost} onClick={() => setShowForm(false)}>✕ Cancel</button>
          </div>
          <form onSubmit={save}>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label}>Provider</label>
                <select
                  className={s.select}
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                  disabled={!!editKey}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                  ))}
                </select>
              </div>
              <div className={s.field}>
                <label className={s.label}>
                  API Key {editKey && <span style={{ fontWeight: 400, color: 'var(--pf-text-3)' }}>(leave blank to keep existing)</span>}
                </label>
                <input
                  className={s.input}
                  type="password"
                  placeholder={editKey ? '••••••••••••••••' : providerInfo(form.provider).hint}
                  value={form.api_key}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
              <div className={s.fieldFull}>
                <label className={s.label}>Notes (optional)</label>
                <input
                  className={s.input}
                  placeholder="e.g. Production key, rate limit 60rpm"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ padding: '0 20px 8px', fontSize: 12, color: 'var(--pf-text-3)' }}>
              🔒 Keys are stored securely in Supabase and never returned in full after saving.
            </div>
            <div className={s.formFooter}>
              <button type="submit" className={s.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : editKey ? 'Update Key' : 'Save Key'}
              </button>
              <button type="button" className={s.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div className={s.loading}>Loading keys…</div>
      ) : keys.length === 0 ? (
        <div className={s.panel}>
          <div className={s.empty}>
            <div className={s.emptyIcon}>🔑</div>
            No keys configured yet. Add your first provider key above.
          </div>
        </div>
      ) : (
        keys.map((key) => {
          const info = providerInfo(key.provider);
          return (
            <div key={key.id} className={s.keyCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: 'var(--pf-accent-glow)', border: '1px solid var(--pf-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {info.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className={s.keyProvider}>{info.label}</div>
                  <div className={s.keyMasked}>
                    {reveal[key.id] ? key.api_key : '••••••••••••••••'}
                  </div>
                  {key.notes && <div className={s.keyNotes}>{key.notes}</div>}
                  <div style={{ fontSize: 11, color: 'var(--pf-text-3)', marginTop: 3 }}>
                    Updated {new Date(key.updated_at || key.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <span className={key.is_active ? s.pillGreen : s.pillRed}>
                  {key.is_active ? '● Active' : '● Inactive'}
                </span>
                <button className={s.btnSm} onClick={() => openEdit(key)}>Edit</button>
                <button className={s.btnSm} onClick={() => toggleActive(key.id)}>
                  {key.is_active ? 'Disable' : 'Enable'}
                </button>
                <button className={s.btnDanger} onClick={() => deleteKey(key.id, key.provider)}>Delete</button>
              </div>
            </div>
          );
        })
      )}

      {/* Documentation */}
      <div className={s.panel} style={{ marginTop: 20 }}>
        <div className={s.panelHeader}><div className={s.panelTitle}>Provider Documentation</div></div>
        <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {PROVIDERS.map((p) => (
            <div key={p.value} style={{ background: 'var(--pf-accent-glow)', border: '1px solid var(--pf-border)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pf-text-1)', marginBottom: 4 }}>{p.icon} {p.label}</div>
              <div style={{ fontSize: 11, color: 'var(--pf-text-3)' }}>Key format: <code style={{ fontFamily: 'monospace', background: 'var(--pf-border)', padding: '1px 4px', borderRadius: 3 }}>{p.hint}</code></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
