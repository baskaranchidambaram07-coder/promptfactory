import { useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './PromptCard.module.css';

const CATEGORY_COLORS = {
  travel: '#4D9FFF',
  music:  '#8A74F9',
  invite: '#00E5A0',
  love:   '#FF6B9D',
};

const CATEGORY_GRADIENTS = {
  travel: 'linear-gradient(135deg, #4D9FFF 0%, #00D9FF 100%)',
  music:  'linear-gradient(135deg, #8A74F9 0%, #A68EFF 100%)',
  invite: 'linear-gradient(135deg, #00E5A0 0%, #00D9FF 100%)',
  love:   'linear-gradient(135deg, #FF6B9D 0%, #FF8FB5 100%)',
};

export default function PromptCard({ prompt, rank }) {
  const navigate = useNavigate();

  const handleClick = async () => {
    try { await api.post(`/prompt/${prompt.id}/click`); } catch {}
    navigate(`/prompt/${prompt.id}`);
  };

  const color = CATEGORY_COLORS[prompt.category] || '#7C3AED';
  const gradient = CATEGORY_GRADIENTS[prompt.category] || 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)';

  return (
    <div className={styles.card} onClick={handleClick}>
      {rank && <span className={styles.rank}>#{rank}</span>}
      <span className={styles.badge} style={{ background: gradient, color: '#fff' }}>
        {prompt.category}
      </span>
      <div className={styles.img} style={{ background: `linear-gradient(135deg, #1A1D26, #21253A)` }}>
        {prompt.thumbnail_url
          ? <img src={prompt.thumbnail_url} alt={prompt.title} />
          : <span style={{ fontSize: 36, opacity: 0.4 }}>🖼️</span>
        }
      </div>
      <div className={styles.body}>
        <div className={styles.title}>{prompt.title}</div>
        <div className={styles.preview}>{prompt.text?.slice(0, 60)}…</div>
        <div className={styles.tags}>
          {(prompt.tags || []).slice(0, 3).map((t) => (
            <span key={t} className={styles.tag}>{t}</span>
          ))}
        </div>
        <div className={styles.footer}>
          <span className={styles.clicks}>▲ {(prompt.click_count || 0).toLocaleString()} clicks</span>
          <span className={styles.tryBtn}>Try it out →</span>
        </div>
      </div>
    </div>
  );
}
