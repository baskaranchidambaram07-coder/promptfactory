import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import s from '../styles/pages.module.css';

export default function VideoComingSoon() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setJoined(true);
  };

  return (
    <div className={s.page}>
      <Navbar />
      <div className={s.hero}>
        <div className={s.badgeGold}>🎬 Coming Soon</div>
        <h1 className={s.heroH1}>Video Prompts<br />Are Next.</h1>
        <p className={s.sub}>The same human-ranked quality you trust for images — coming to Sora, Runway, and Kling-powered video generation.</p>

        <div className={s.features}>
          {[
            { icon: '🎥', title: 'Multi-model video', desc: 'Sora, Runway Gen-3, Kling' },
            { icon: '⭐', title: '3-stage pipeline',  desc: 'Generate, evaluate, refine' },
            { icon: '📊', title: 'Human-click ranked', desc: 'Same trust model as images' },
          ].map((f) => (
            <div key={f.title} className={s.feat}>
              <div className={s.featIcon}>{f.icon}</div>
              <div className={s.featTitle}>{f.title}</div>
              <div className={s.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>

        {joined ? (
          <div className={s.successMsg}>✓ You're on the waitlist! We'll notify you when video launches.</div>
        ) : (
          <form className={s.emailRow} onSubmit={submit}>
            <input
              type="email"
              className={s.emailInput}
              placeholder="your@work.com — get early access"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className={s.notifyBtn}>Notify Me</button>
          </form>
        )}
        <p className={s.waitlistNote}>No spam, unsubscribe anytime</p>
      </div>
      <Footer />
    </div>
  );
}
