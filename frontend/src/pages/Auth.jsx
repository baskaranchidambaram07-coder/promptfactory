import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api';
import styles from './Auth.module.css';

export default function Auth() {
  const [params] = useSearchParams();
  const [isSignup, setIsSignup] = useState(params.get('mode') === 'signup');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isSignup ? '/auth/register' : '/auth/login';
      const payload = isSignup ? form : { email: form.email, password: form.password };
      const res = await api.post(endpoint, payload);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        {/* Left panel */}
        <div className={styles.left}>
          <Link to="/" className={styles.logo}>Prompt<span>Factory</span></Link>
          <h2 className={styles.leftH2}>The prompt library<br />marketing teams love.</h2>
          <p className={styles.leftSub}>Join enterprise teams discovering high-converting AI image prompts.</p>
          <div className={styles.feature}><div className={styles.featIcon} style={{ background: 'var(--pf-accent-glow)' }}>🔥</div><div><div className={styles.featTitle}>Human-ranked prompts</div><div className={styles.featDesc}>Every prompt ranked by real click engagement.</div></div></div>
          <div className={styles.feature}><div className={styles.featIcon} style={{ background: 'var(--pf-teal-dim)' }}>⚡</div><div><div className={styles.featTitle}>One-click generation</div><div className={styles.featDesc}>Generate directly with leading AI image models.</div></div></div>
          <div className={styles.feature}><div className={styles.featIcon} style={{ background: 'var(--pf-gold-dim)' }}>⭐</div><div><div className={styles.featTitle}>Premium 3-stage pipeline</div><div className={styles.featDesc}>Generate → Evaluate → Final Check for studio quality.</div></div></div>
        </div>

        {/* Right form */}
        <div className={styles.right}>
          <h2 className={styles.formTitle}>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
          <p className={styles.formSub}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button className={styles.switchBtn} onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          <button className={styles.googleBtn}>
            <div className={styles.googleG}>G</div>
            Continue with Google
          </button>

          <div className={styles.divider}>or continue with email</div>

          <form onSubmit={submit}>
            {isSignup && (
              <div className={styles.field}>
                <label className={styles.label}>Full name</label>
                <input className={styles.input} placeholder="Your name" value={form.name} onChange={set('name')} required />
              </div>
            )}
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input className={styles.input} type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submitBtn}>
              {isSignup ? 'Create Free Account' : 'Sign In'}
            </button>
          </form>

          <p className={styles.terms}>
            By signing up you agree to our <Link to="/legal/terms">Terms</Link> and <Link to="/legal/privacy">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
