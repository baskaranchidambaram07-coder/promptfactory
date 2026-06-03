import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PromptCard from '../components/PromptCard';
import VideoTransition from '../components/VideoTransition';
import api from '../api';
import styles from './Home.module.css';

const CAT_ICONS = {
  Couples: '💑', Travel: '✈️', Music: '🎵', Invite: '🎉',
  Love: '❤️', Portrait: '🎨', Nature: '🌿', Women: '👩',
  Men: '👨', Other: '✨',
};

const CAT_GRADIENTS = {
  Couples:  'linear-gradient(135deg,#FF6B9D,#FF8FB5)',
  Travel:   'linear-gradient(135deg,#4D9FFF,#00D9FF)',
  Music:    'linear-gradient(135deg,#8A74F9,#A68EFF)',
  Invite:   'linear-gradient(135deg,#00E5A0,#00D9FF)',
  Love:     'linear-gradient(135deg,#FF6B9D,#FF8FB5)',
  Portrait: 'linear-gradient(135deg,#FF8A5B,#FF6B9D)',
  Nature:   'linear-gradient(135deg,#00E5A0,#4D9FFF)',
  Women:    'linear-gradient(135deg,#B19CD9,#FF6B9D)',
  Men:      'linear-gradient(135deg,#4D9FFF,#8A74F9)',
};

const getGradient = (cat) => CAT_GRADIENTS[cat] || 'linear-gradient(135deg,#8A74F9,#FF6B9D)';

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch]               = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);
  const [topCategories, setTopCategories] = useState([]);
  const [selectedCat, setSelectedCat]     = useState(null);
  const [catPrompts, setCatPrompts]       = useState([]);
  const [loadingCat, setLoadingCat]       = useState(false);
  const [trending, setTrending]           = useState([]);
  const [topMode, setTopMode]             = useState(false);
  const [topPrompts, setTopPrompts]       = useState([]);
  const [featuredPrompt, setFeaturedPrompt] = useState(null);
  const debounceRef = useRef(null);

  // Load top 5 categories + 4 trending + top prompt on mount
  useEffect(() => {
    api.get('/prompt/categories').then((r) => setTopCategories(r.data)).catch(() => {});
    api.get('/prompt/trending?limit=4').then((r) => setTrending(r.data)).catch(() => {});
    api.get('/prompt/top?limit=1').then((r) => r.data[0] && setFeaturedPrompt(r.data[0])).catch(() => {});
  }, []);

  // Debounced search — fires 400ms after user stops typing
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await api.get(`/prompt/search?q=${encodeURIComponent(search.trim())}`);
        setSearchResults(r.data);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const handleCategoryClick = async (cat) => {
    if (selectedCat === cat) { setSelectedCat(null); setCatPrompts([]); return; }
    setSelectedCat(cat);
    setTopMode(false);
    setSearch('');
    setSearchResults([]);
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
    setSearch('');
    setSearchResults([]);
    const r = await api.get('/prompt/top?limit=20').catch(() => ({ data: [] }));
    setTopPrompts(r.data);
  };

  // What to show in secondary section
  const showSearch    = search.trim().length > 0;
  const showSecondary = showSearch || selectedCat || topMode;

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
              style={selectedCat === item.category ? { background: getGradient(item.category), borderColor: 'transparent' } : {}}
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
            {featuredPrompt?.FromURL && featuredPrompt?.ToURL ? (
              <VideoTransition fromUrl={featuredPrompt.FromURL} toUrl={featuredPrompt.ToURL} />
            ) : (
              <>
                <span className={styles.videoIcon}>▶</span>
                <span className={styles.videoLabel}>Featured Prompt Showcase</span>
                <span className={styles.videoSub}>Short video — coming soon</span>
              </>
            )}
          </div>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className={styles.searchBar}
              placeholder="Search by tags, category or description…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedCat(null);
                setTopMode(false);
              }}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => { setSearch(''); setSearchResults([]); }}>✕</button>
            )}
          </div>
        </main>

        {/* ── RIGHT: Trending + Explore ── */}
        <aside className={styles.right}>
          <div className={styles.sectionLabel}>⚡ Trending Now</div>
          <div className={styles.trendingGrid}>
            {trending.map((p) => (
              <div key={p.PromptId} className={styles.trendingThumb} onClick={() => navigate(`/prompt/${p.PromptId}`)}>
                {p.FromURL
                  ? <img src={p.FromURL} alt={p.Categories} onError={(e) => { e.target.style.display = 'none'; }} />
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

      {/* ── SECONDARY: Search Results / Category / Top ── */}
      {showSecondary && (
        <section className={styles.secondary}>
          <div className={styles.secHeader}>
            <span className={styles.secTitle}>
              {showSearch
                ? `🔍 Results for "${search}"`
                : topMode
                  ? '🏆 Top 20 Prompts'
                  : `${CAT_ICONS[selectedCat] || '✨'} ${selectedCat} Prompts`}
            </span>
            <span className={styles.secCount}>
              {showSearch
                ? searching ? '…' : `${searchResults.length} found`
                : topMode ? topPrompts.length : catPrompts.length} results
            </span>
          </div>

          {(loadingCat || searching) && <div className={styles.loading}>Searching…</div>}

          {/* Search results as PromptCards grid */}
          {showSearch && !searching && (
            searchResults.length > 0 ? (
              <div className={styles.grid}>
                {searchResults.map((p, i) => (
                  <PromptCard key={p.PromptId} prompt={p} rank={i + 1} />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>No prompts found for "{search}".<br />Try searching for tags like "cartoon", "traditional", "portrait".</div>
            )
          )}

          {/* Category / Top prompts as rows */}
          {!showSearch && (
            <div className={styles.promptList}>
              {(topMode ? topPrompts : catPrompts).map((p, i) => (
                <div key={p.PromptId} className={styles.promptRow} onClick={() => navigate(`/prompt/${p.PromptId}`)}>
                  <div className={styles.promptRowRank}>#{i + 1}</div>
                  <div className={styles.promptRowThumb} style={{ background: getGradient(p.Categories) }}>
                    {p.FromURL
                      ? <img src={p.FromURL} alt={p.Categories} onError={(e) => { e.target.style.display = 'none'; }} />
                      : <span>🖼️</span>
                    }
                  </div>
                  <div className={styles.promptRowBody}>
                    <div className={styles.promptRowTitle}>
                      <span className={styles.promptRowBadge} style={{ background: getGradient(p.Categories) }}>
                        {p.Categories}
                      </span>
                      Prompt #{p.PromptId}
                      {p.tags && (
                        <span className={styles.promptRowTags}>
                          {p.tags.split(',').slice(0, 3).map((t) => (
                            <span key={t} className={styles.promptRowTag}>{t.trim()}</span>
                          ))}
                        </span>
                      )}
                    </div>
                    <div className={styles.promptRowPreview}>
                      {(p.promptdescription || '').replace(/"/g, '').slice(0, 120)}…
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
          )}
        </section>
      )}

      <Footer />
    </div>
  );
}
