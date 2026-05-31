import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './VideoComingSoon.module.css';

export default function VideoComingSoon() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // In production: POST to /api/waitlist
    setJoined(true);
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.hero}>
        <div className={styles.badge}>🎬 Coming Soon</div>
        <h1 className={styles.h1}>Video Prompts<br />Are Next.</h1>
        <p className={styles.sub}>The same human-ranked quality you trust for images — coming to Sora, Runway, and Kling-powered video generation.</p>

        <div className={styles.features}>
          {[
            { icon: '🎥', title: 'Multi-model video', desc: 'Sora, Runway Gen-3, Kling' },
            { icon: '⭐', title: '3-stage pipeline', desc: 'Generate, evaluate, refine' },
            { icon: '📊', title: 'Human-click ranked', desc: 'Same trust model as images' },
          ].map((f) => (
            <div key={f.title} className={styles.feat}>
              <div className={styles.featIcon}>{f.icon}</div>
              <div className={styles.featTitle}>{f.title}</div>
              <div className={styles.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>

        {joined ? (
          <div className={styles.successMsg}>✓ You're on the waitlist! We'll notify you when video launches.</div>
        ) : (
          <form className={styles.emailRow} onSubmit={submit}>
            <input
              type="email"
              className={styles.emailInput}
              placeholder="your@work.com — get early access"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className={styles.notifyBtn}>Notify Me</button>
          </form>
        )}
        <p className={styles.waitlistNote}>No spam, unsubscribe anytime</p>
      </div>
      <Footer />
    </div>
  );
}
