import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api';
import s from '../styles/pages.module.css';

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
    <div className={s.pageCenter}>
      <Link to="/" className={s.backHome}>← Back to home</Link>
      <div className={s.authWrap}>

        {/* Left — branding panel */}
        <div className={s.splitLeft}>
          <Link to="/" className={s.authLogo}>Prompt<span>Factory</span></Link>
          <h2 className={s.leftH2}>The prompt library<br />marketing teams love.</h2>
          <p className={s.leftSub}>Join enterprise teams discovering high-converting AI image prompts.</p>
          <div className={s.feature}><div className={s.featIcon} style={{ background: 'var(--pf-accent-glow)' }}>🔥</div><div><div className={s.featTitle}>Human-ranked prompts</div><div className={s.featDesc}>Every prompt ranked by real click engagement.</div></div></div>
          <div className={s.feature}><div className={s.featIcon} style={{ background: 'var(--pf-teal-dim)' }}>⚡</div><div><div className={s.featTitle}>One-click generation</div><div className={s.featDesc}>Generate directly with leading AI image models.</div></div></div>
          <div className={s.feature}><div className={s.featIcon} style={{ background: 'var(--pf-gold-dim)' }}>⭐</div><div><div className={s.featTitle}>Premium 3-stage pipeline</div><div className={s.featDesc}>Generate → Evaluate → Final Check for studio quality.</div></div></div>
        </div>

        {/* Right — form panel */}
        <div className={s.splitRight}>
          <h2 className={s.formTitle}>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
          <p className={s.formSub}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button className={s.switchBtn} onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          <button className={s.googleBtn}>
            <div className={s.googleG}>G</div>
            Continue with Google
          </button>

          <div className={s.divider}>or continue with email</div>

          <form onSubmit={submit}>
            {isSignup && (
              <div className={s.field}>
                <label className={s.label}>Full name</label>
                <input className={s.input} placeholder="Your name" value={form.name} onChange={set('name')} required />
              </div>
            )}
            <div className={s.field}>
              <label className={s.label}>Email</label>
              <input className={s.input} type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className={s.field}>
              <label className={s.label}>Password</label>
              <input className={s.input} type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
            </div>
            {error && <p className={s.error}>{error}</p>}
            <button type="submit" className={s.submitBtn}>
              {isSignup ? 'Create Free Account' : 'Sign In'}
            </button>
          </form>

          <p className={s.terms}>
            By signing up you agree to our <Link to="/legal/terms">Terms</Link> and <Link to="/legal/privacy">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
