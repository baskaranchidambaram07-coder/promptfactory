import { useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './PromptCard.module.css';

const CATEGORY_GRADIENTS = {
  couples:     'linear-gradient(135deg, #FF6B9D 0%, #FF8FB5 100%)',
  travel:      'linear-gradient(135deg, #4D9FFF 0%, #00D9FF 100%)',
  music:       'linear-gradient(135deg, #8A74F9 0%, #A68EFF 100%)',
  invite:      'linear-gradient(135deg, #00E5A0 0%, #00D9FF 100%)',
  love:        'linear-gradient(135deg, #FF6B9D 0%, #FF8FB5 100%)',
  portrait:    'linear-gradient(135deg, #FF8A5B 0%, #FF6B9D 100%)',
  nature:      'linear-gradient(135deg, #00E5A0 0%, #4D9FFF 100%)',
  architecture:'linear-gradient(135deg, #8A74F9 0%, #4D9FFF 100%)',
};

const getGradient = (category) => {
  const key = (category || '').toLowerCase();
  return CATEGORY_GRADIENTS[key] || 'linear-gradient(135deg, #8A74F9 0%, #FF6B9D 100%)';
};

export default function PromptCard({ prompt, rank }) {
  const navigate = useNavigate();

  const handleClick = async () => {
    try { await api.post(`/prompt/${prompt.PromptId}/click`); } catch {}
    navigate(`/prompt/${prompt.PromptId}`);
  };

  const gradient = getGradient(prompt.Categories);
  const previewText = (prompt.promptdescription || '').replace(/"/g, '').slice(0, 80);

  return (
    <div className={styles.card} onClick={handleClick}>
      {rank && <span className={styles.rank}>#{rank}</span>}
      <span className={styles.badge} style={{ background: gradient, color: '#fff' }}>
        {prompt.Categories || 'General'}
      </span>
      <div className={styles.img}>
        {prompt.FromURL
          ? <img src={prompt.FromURL} alt={prompt.Categories} />
          : <span style={{ fontSize: 36, opacity: 0.3 }}>🖼️</span>
        }
      </div>
      <div className={styles.body}>
        <div className={styles.title}>{prompt.Categories} Prompt #{prompt.PromptId}</div>
        <div className={styles.preview}>{previewText}…</div>
        <div className={styles.tags}>
          <span className={styles.tag}>{prompt.Categories}</span>
        </div>
        <div className={styles.footer}>
          <span className={styles.clicks}>▲ {(prompt.usedcount || 0).toLocaleString()} uses</span>
          <span className={styles.tryBtn}>Try it out →</span>
        </div>
      </div>
    </div>
  );
}
