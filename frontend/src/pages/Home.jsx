import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';
import styles from './Home.module.css';

const CAT_ICONS = {
  Couples: '💑', Travel: '✈️', Music: '🎵', Invite: '🎉',
  Love: '❤️', Portrait: '🎨', Nature: '🌿', Other: '✨',
};

const CAT_GRADIENTS = {
  Couples: 'linear-gradient(135deg,#FF6B9D,#FF8FB5)',
  Travel:  'linear-gradient(135deg,#4D9FFF,#00D9FF)',
  Music:   'linear-gradient(135deg,#8A74F9,#A68EFF)',
  Invite:  'linear-gradient(135deg,#00E5A0,#00D9FF)',
  Love:    'linear-gradient(135deg,#FF6B9D,#FF8FB5)',
  Portrait:'linear-gradient(135deg,#FF8A5B,#FF6B9D)',
  Nature:  'linear-gradient(135deg,#00E5A0,#4D9FFF)',
};

const getGradient = (cat) => CAT_GRADIENTS[cat] || 'linear-gradient(135deg,#8A74F9,#FF6B9D)';

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [topCategories, setTopCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [catPrompts, setCatPrompts] = useState([]);
  const [loadingCat, setLoadingCat] = useState(false);
  const [trending, setTrending] = useState([]);
  const [topMode, setTopMode] = useState(false);
  const [topPrompts, setTopPrompts] = useState([]);

  // Load top 5 categories and 4 trending on mount
  useEffect(() => {
    api.get('/prompt/categories').then((r) => setTopCategories(r.data)).catch(() => {});
    api.get('/prompt/trending?limit=4').then((r) => setTrending(r.data)).catch(() => {});
  }, []);

  // Fetch prompts when category selected
  const handleCategoryClick = async (cat) => {
    if (selectedCat === cat) { setSelectedCat(null); setCatPrompts([]); return; }
    setSelectedCat(cat);
    setTopMode(false);
    setLoadingCat(true);
    try {
      const r = await api.get(`/prompt?category=${cat}`);
      setCatPrompts(r.data);
    } catch {}
    setLoadingCat(false);
  };

  const handleTopPrompts = async () => {
    setTopMode(true);
    setSelectedCat(null);
    const r = await api.get('/prompt/top?limit=20').catch(() => ({ data: [] }));
    setTopPrompts(r.data);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.threeCol}>

        {/* ── LEFT: Top 5 Categories ── */}
        <aside className={styles.left}>
          <div className={styles.sectionLabel}>🔥 Top Categories</div>
          {topCategories.map((item, i) => (
            <button
              key={item.category}
              className={`${styles.catBtn} ${selectedCat === item.category ? styles.catBtnActive : ''}`}
              style={selectedCat === item.category ? { background: getGradient(item.category) } : {}}
              onClick={() => handleCategoryClick(item.category)}
            >
              <span className={styles.catRank}>#{i + 1}</span>
              <span className={styles.catIcon}>{CAT_ICONS[item.category] || '✨'}</span>
              <div className={styles.catInfo}>
                <span className={styles.catName}>{item.category}</span>
                <span className={styles.catCount}>{item.total_used.toLocaleString()} uses</span>
              </div>
              {selectedCat === item.category && <span className={styles.catArrow}>▾</span>}
            </button>
          ))}
        </aside>

        {/* ── MIDDLE: Video + Search ── */}
        <main className={styles.middle}>
          <div className={styles.videoPlaceholder}>
            <span className={styles.videoIcon}>▶</span>
            <span className={styles.videoLabel}>Featured Prompt Showcase</span>
            <span className={styles.videoSub}>Short video — coming soon</span>
          </div>
          <form className={styles.searchWrap} onSubmit={handleSearch}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className={styles.searchBar}
              placeholder="Search prompts — try 'couples portrait' or 'travel sunset'…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </main>

        {/* ── RIGHT: Trending + Explore ── */}
        <aside className={styles.right}>
          <div className={styles.sectionLabel}>⚡ Trending Now</div>
          <div className={styles.trendingGrid}>
            {trending.map((p) => (
              <div key={p.PromptId} className={styles.trendingThumb} onClick={() => navigate(`/prompt/${p.PromptId}`)}>
                {p.FromURL
                  ? <img src={p.FromURL} alt={p.Categories} />
                  : <span className={styles.thumbPlaceholder}>🖼️</span>
                }
                <span className={styles.thumbTitle}>{p.Categories} #{p.PromptId}</span>
              </div>
            ))}
          </div>
          <button className={styles.exploreBtn} onClick={handleTopPrompts}>
            Explore Top 20 Prompts →
          </button>
        </aside>
      </div>

      {/* ── SECONDARY: Category Prompts or Top Prompts ── */}
      {(selectedCat || topMode) && (
        <section className={styles.secondary}>
          <div className={styles.secHeader}>
            <span className={styles.secTitle}>
              {topMode
                ? '🏆 Top 20 Prompts'
                : `${CAT_ICONS[selectedCat] || '✨'} ${selectedCat} Prompts`}
            </span>
            <span className={styles.secCount}>
              {topMode ? topPrompts.length : catPrompts.length} results
            </span>
          </div>

          {loadingCat && <div className={styles.loading}>Loading…</div>}

          <div className={styles.promptList}>
            {(topMode ? topPrompts : catPrompts).map((p, i) => (
              <div
                key={p.PromptId}
                className={styles.promptRow}
                onClick={() => navigate(`/prompt/${p.PromptId}`)}
              >
                <div className={styles.promptRowRank}>#{i + 1}</div>
                <div
                  className={styles.promptRowThumb}
                  style={{ background: getGradient(p.Categories) }}
                >
                  {p.FromURL
                    ? <img src={p.FromURL} alt={p.Categories} />
                    : <span>🖼️</span>
                  }
                </div>
                <div className={styles.promptRowBody}>
                  <div className={styles.promptRowTitle}>
                    <span className={styles.promptRowBadge} style={{ background: getGradient(p.Categories) }}>
                      {p.Categories}
                    </span>
                    Prompt #{p.PromptId}
                  </div>
                  <div className={styles.promptRowPreview}>
                    {(p.promptdescription || '').replace(/"/g, '').slice(0, 100)}…
                  </div>
                </div>
                <div className={styles.promptRowMeta}>
                  <span className={styles.promptRowUses}>▲ {(p.usedcount || 0).toLocaleString()}</span>
                  <button className={styles.promptRowBtn}>Try it →</button>
                </div>
              </div>
            ))}

            {!loadingCat && !topMode && catPrompts.length === 0 && (
              <div className={styles.empty}>No prompts found in {selectedCat} yet.</div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
