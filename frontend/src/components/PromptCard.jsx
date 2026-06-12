import { useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './PromptCard.module.css';

const CAT_GRADIENTS = {
  Couples:  'linear-gradient(135deg,#FF6B9D,#FF8FB5)',
  Travel:   'linear-gradient(135deg,#4D9FFF,#00D9FF)',
  Music:    'linear-gradient(135deg,#8A74F9,#A68EFF)',
  Invite:   'linear-gradient(135deg,#00E5A0,#00D9FF)',
  Love:     'linear-gradient(135deg,#FF6B9D,#FF8FB5)',
  Portrait: 'linear-gradient(135deg,#FF8A5B,#FF6B9D)',
  Nature:   'linear-gradient(135deg,#00E5A0,#4D9FFF)',
  Women:    'linear-gradient(135deg,#B19CD9,#FF6B9D)',
};

const getGradient = (cat) => CAT_GRADIENTS[cat] || 'linear-gradient(135deg,#8A74F9,#FF6B9D)';

export default function PromptCard({ prompt, rank }) {
  const navigate = useNavigate();

  const handleClick = async () => {
    try { await api.post(`/prompt/${prompt.PromptId}/click`); } catch {}
    navigate(`/prompt/${prompt.PromptId}`);
  };

  const gradient  = getGradient(prompt.Categories);
  const mainImage = prompt.FromURL || prompt.ToURL;
  const previewText = (prompt.promptdescription || '').replace(/"/g, '').slice(0, 80);

  return (
    <div className={styles.card} onClick={handleClick}>
      {rank && <span className={styles.rank}>#{rank}</span>}
      <span className={styles.badge} style={{ background: gradient }}>
        {prompt.Categories || 'General'}
      </span>

      {/* Main image from FromURL */}
      <div className={styles.img}>
        {mainImage
          ? <img src={mainImage} alt={prompt.Categories} onError={(e) => { e.target.style.display = 'none'; }} />
          : <span className={styles.imgPlaceholder}>🖼️</span>
        }
        {/* ToURL overlay on hover */}
        {prompt.ToURL && prompt.FromURL && (
          <img
            src={prompt.ToURL}
            alt="after"
            className={styles.imgHover}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.title}>
          {prompt.Categories} #{prompt.PromptId}
        </div>
        <div className={styles.preview}>{previewText}…</div>
        <div className={styles.tags}>
          <span className={styles.tag}>{prompt.Categories}</span>
          {prompt.ToURL && <span className={styles.tag}>Before/After</span>}
        </div>
        <div className={styles.footer}>
          <span className={styles.clicks}>▲ {(prompt.usedcount || 0).toLocaleString()} uses</span>
          <span className={styles.tryBtn}>Try it out →</span>
        </div>
      </div>
    </div>
  );
}
