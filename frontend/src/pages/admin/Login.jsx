import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import adminApi from '../../api/adminApi';
import s from './Admin.module.css';

export default function AdminLogin() {
  const { loginAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await adminApi.post('/admin/auth/login', form);
      loginAdmin(data.token, data.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left brand panel */}
      <div style={styles.brand}>
        <div style={styles.brandInner}>
          <div style={styles.logoMark}>PF</div>
          <div style={styles.brandTitle}>PromptFactory</div>
          <div style={styles.brandSub}>Admin Console</div>
          <div style={styles.divider} />
          <div style={styles.featureList}>
            {[
              '📊  Platform analytics & KPIs',
              '🖼️   Prompt & image management',
              '👥  User & subscription control',
              '🔑  LLM key vault',
              '⚡  Generation request logs',
            ].map((f) => (
              <div key={f} style={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div style={styles.loginPanel}>
        <form style={styles.form} onSubmit={submit} autoComplete="off">
          <div style={styles.formHeader}>
            <div style={styles.formTitle}>Sign in to Admin</div>
            <div style={styles.formSub}>Access is restricted to authorized personnel only.</div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={{ marginRight: 6 }}>⚠</span>{error}
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@promptfactory.io"
              value={form.email}
              onChange={set('email')}
              required
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...styles.input, paddingRight: 44 }}
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={set('password')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button style={loading ? { ...styles.btn, opacity: 0.7 } : styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>

          <div style={styles.hint}>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>🔒</span>
            {' '}Session expires after 8 hours of inactivity
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Inline styles (self-contained — no CSS module dependency) ── */
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: 'Inter, -apple-system, sans-serif',
    background: 'var(--bg-body)',
  },
  brand: {
    width: 380,
    flexShrink: 0,
    background: 'linear-gradient(160deg, #13133a 0%, #0d0d24 100%)',
    borderRight: '1px solid rgba(138,116,249,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 36px',
  },
  brandInner: { width: '100%' },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #8A74F9, #4D9FFF)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.03em',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f0f1f5',
    letterSpacing: '-0.03em',
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 13,
    color: 'rgba(240,241,245,0.45)',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    background: 'rgba(138,116,249,0.18)',
    margin: '28px 0',
  },
  featureList: { display: 'flex', flexDirection: 'column', gap: 12 },
  featureItem: {
    fontSize: 13,
    color: 'rgba(240,241,245,0.55)',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  loginPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    background: 'var(--bg-body)',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  formHeader: { marginBottom: 4 },
  formTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--pf-text-1)',
    letterSpacing: '-0.03em',
    marginBottom: 6,
  },
  formSub: {
    fontSize: 13,
    color: 'var(--pf-text-3)',
    lineHeight: 1.5,
  },
  errorBox: {
    padding: '10px 14px',
    borderRadius: 8,
    background: 'rgba(255,107,107,0.1)',
    border: '1px solid rgba(255,107,107,0.3)',
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--pf-text-2)',
    letterSpacing: '0.01em',
  },
  input: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid var(--pf-border)',
    background: 'var(--bg-input)',
    color: 'var(--pf-text-1)',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: '4px',
    lineHeight: 1,
  },
  btn: {
    padding: '11px 0',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #8A74F9, #4D9FFF)',
    color: '#fff',
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    transition: 'opacity 0.15s',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: 'var(--pf-text-3)',
    textAlign: 'center',
    marginTop: -8,
  },
};
