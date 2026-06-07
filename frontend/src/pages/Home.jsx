import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PromptCard from '../components/PromptCard';
import api from '../api';
import s from '../styles/pages.module.css';

const CAT_META = {
  Couples:  { icon: '💑', grad: 'linear-gradient(135deg,#FF6B9D,#FF8A5B)' },
  Travel:   { icon: '✈️', grad: 'linear-gradient(135deg,#4D9FFF,#00D9FF)' },
  Music:    { icon: '🎵', grad: 'linear-gradient(135deg,#8A74F9,#A68EFF)' },
  Invite:   { icon: '🎉', grad: 'linear-gradient(135deg,#00E5A0,#4D9FFF)' },
  Love:     { icon: '❤️', grad: 'linear-gradient(135deg,#FF6B9D,#FF8FB5)' },
  Portrait: { icon: '🎨', grad: 'linear-gradient(135deg,#FF8A5B,#FF6B9D)' },
  Nature:   { icon: '🌿', grad: 'linear-gradient(135deg,#00E5A0,#4D9FFF)' },
  Women:    { icon: '👩', grad: 'linear-gradient(135deg,#B19CD9,#FF6B9D)' },
  Men:      { icon: '👨', grad: 'linear-gradient(135deg,#4D9FFF,#8A74F9)' },
  Other:    { icon: '✨', grad: 'linear-gradient(135deg,#8A74F9,#FF6B9D)' },
};
const getMeta = (cat) => CAT_META[cat] || { icon: '✨', grad: 'linear-gradient(135deg,#8A74F9,#FF6B9D)' };

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
  const [totalPrompts, setTotalPrompts]   = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    api.get('/prompt/categories').then((r) => setTopCategories(r.data)).catch(() => {});
    api.get('/prompt/trending?limit=6').then((r) => setTrending(r.data)).catch(() => {});
    api.get('/prompt/top?limit=1').then((r) => r.data[0] && setFeaturedPrompt(r.data[0])).catch(() => {});
    api.get('/prompt/top?limit=100').then((r) => setTotalPrompts(r.data.length)).catch(() => {});
  }, []);

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

  const clearAll = () => {
    setSearch(''); setSearchResults([]);
    setSelectedCat(null); setCatPrompts([]);
    setTopMode(false); setTopPrompts([]);
  };

  const showSearch    = search.trim().length > 0;
  const showSecondary = showSearch || selectedCat || topMode;
  const totalUses     = topCategories.reduce((acc, c) => acc + (c.total_used || 0), 0);

  return (
    <div className={s.page}>
      <Navbar />

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className={s.homeHero}>
        <div className={s.orb1} />
        <div className={s.orb2} />
        <div className={s.orb3} />

        <div className={s.heroContent}>
          <div className={s.heroBadge}>
            <span className={s.heroBadgeDot} />
            AI Photo Transformation Prompts
          </div>

          <h1 className={s.heroTitle}>
            Turn Any Photo Into
            <br />
            <span className={s.heroTitleGrad}>Stunning Art</span>
          </h1>

          <p className={s.heroSub}>
            Browse curated AI prompts for breathtaking before→after photo transformations.
            Human-ranked quality. Ready to generate instantly.
          </p>

          {/* Search bar */}
          <div className={s.heroSearch}>
            <svg className={s.heroSearchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className={s.heroSearchInput}
              placeholder="Search by style, mood, category… e.g. romantic, portrait"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedCat(null); setTopMode(false); }}
            />
            {search && (
              <button className={s.heroSearchClear} onClick={clearAll}>✕</button>
            )}
          </div>

          {/* Stats */}
          <div className={s.heroStats}>
            {[
              { num: totalPrompts ?? '—', label: 'Curated Prompts' },
              { num: topCategories.length || '—', label: 'Categories' },
              { num: totalUses > 0 ? totalUses.toLocaleString() : '—', label: 'Total Uses' },
            ].map((st) => (
              <div key={st.label} className={s.heroStat}>
                <span className={s.heroStatNum}>{st.num}</span>
                <span className={s.heroStatLabel}>{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CATEGORY PILLS ROW
      ══════════════════════════════════════ */}
      {topCategories.length > 0 && (
        <section className={s.catSection}>
          <div className={s.catPills}>
            <button
              className={`${s.catPill} ${topMode ? s.catPillActive : ''}`}
              style={topMode ? { background: 'linear-gradient(135deg,#8A74F9,#FF6B9D)', borderColor: 'transparent', color: '#fff' } : {}}
              onClick={handleTopPrompts}
            >
              <span>🏆</span> Top Prompts
            </button>
            {topCategories.map((item) => {
              const meta = getMeta(item.category);
              const active = selectedCat === item.category;
              return (
                <button
                  key={item.category}
                  className={`${s.catPill} ${active ? s.catPillActive : ''}`}
                  style={active ? { background: meta.grad, borderColor: 'transparent', color: '#fff' } : {}}
                  onClick={() => handleCategoryClick(item.category)}
                >
                  <span>{meta.icon}</span>
                  {item.category}
                  <span className={s.catPillCount}>{item.total_used.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          MAIN (hero default state)
      ══════════════════════════════════════ */}
      {!showSecondary && (
        <section className={s.homeMain}>

          {/* LEFT: trending grid */}
          <div className={s.homeLeft}>
            <div className={s.sectionHead}>
              <span className={s.sectionHeadTitle}>⚡ Trending Now</span>
              <button className={s.sectionHeadLink} onClick={handleTopPrompts}>View all →</button>
            </div>
            <div className={s.trendGrid}>
              {trending.map((p, i) => (
                <div
                  key={p.PromptId}
                  className={s.trendCard}
                  onClick={() => navigate(`/prompt/${p.PromptId}`)}
                >
                  <div className={s.trendCardImg}>
                    {p.FromURL
                      ? <img src={p.FromURL} alt={p.Categories} onError={(e) => { e.target.style.display = 'none'; }} />
                      : <span style={{ fontSize: 28, opacity: 0.25 }}>🖼️</span>
                    }
                    {p.ToURL && (
                      <div className={s.trendCardAfter}>
                        <img src={p.ToURL} alt="after" onError={(e) => { e.target.parentNode.style.display = 'none'; }} />
                      </div>
                    )}
                    <div className={s.trendCardOverlay}>
                      <span
                        className={s.trendCardBadge}
                        style={{ background: getMeta(p.Categories).grad }}
                      >
                        {getMeta(p.Categories).icon} {p.Categories}
                      </span>
                      <span className={s.trendCardUses}>▲ {(p.usedcount || 0).toLocaleString()}</span>
                    </div>
                    <div className={s.trendCardRank}>#{i + 1}</div>
                  </div>
                  <div className={s.trendCardBody}>
                    <div className={s.trendCardTitle}>Prompt #{p.PromptId}</div>
                    <div className={s.trendCardPreview}>
                      {(p.promptdescription || '').replace(/^"|"$/g, '').slice(0, 72)}…
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: featured + top categories */}
          <aside className={s.homeRight}>
            {featuredPrompt && (
              <div className={s.featuredCard} onClick={() => navigate(`/prompt/${featuredPrompt.PromptId}`)}>
                <div className={s.featuredLabel}>⭐ Featured</div>
                <div className={s.featuredImgs}>
                  {featuredPrompt.FromURL && (
                    <div className={s.featuredImg}>
                      <img src={featuredPrompt.FromURL} alt="before" onError={(e) => { e.target.style.display = 'none'; }} />
                      <span className={s.featuredImgLabel}>Before</span>
                    </div>
                  )}
                  <div className={s.featuredArrow}>→</div>
                  {featuredPrompt.ToURL && (
                    <div className={s.featuredImg}>
                      <img src={featuredPrompt.ToURL} alt="after" onError={(e) => { e.target.style.display = 'none'; }} />
                      <span className={s.featuredImgLabel}>After</span>
                    </div>
                  )}
                </div>
                <div className={s.featuredMeta}>
                  <span className={s.featuredCat} style={{ background: getMeta(featuredPrompt.Categories).grad }}>
                    {getMeta(featuredPrompt.Categories).icon} {featuredPrompt.Categories}
                  </span>
                  <span className={s.featuredUses}>▲ {(featuredPrompt.usedcount || 0).toLocaleString()} uses</span>
                </div>
                <div className={s.featuredBtn}>Try This Prompt →</div>
              </div>
            )}

            <div className={s.sideSection}>
              <div className={s.sideSectionTitle}>🔥 Top Categories</div>
              {topCategories.slice(0, 5).map((item, i) => {
                const meta = getMeta(item.category);
                return (
                  <button
                    key={item.category}
                    className={s.sideCatRow}
                    onClick={() => handleCategoryClick(item.category)}
                  >
                    <div className={s.sideCatIcon} style={{ background: meta.grad }}>{meta.icon}</div>
                    <div className={s.sideCatInfo}>
                      <span className={s.sideCatName}>{item.category}</span>
                      <span className={s.sideCatCount}>{item.total_used.toLocaleString()} uses</span>
                    </div>
                    <span className={s.sideCatRank}>#{i + 1}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        </section>
      )}

      {/* ══════════════════════════════════════
          SECONDARY — search / category / top
      ══════════════════════════════════════ */}
      {showSecondary && (
        <section className={s.secondary}>
          <div className={s.secHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={s.secTitle}>
                {showSearch
                  ? `🔍 Results for "${search}"`
                  : topMode
                    ? '🏆 Top 20 Prompts'
                    : `${getMeta(selectedCat).icon} ${selectedCat} Prompts`}
              </span>
              <span className={s.secCount}>
                {showSearch
                  ? searching ? '…' : `${searchResults.length} found`
                  : topMode ? topPrompts.length : catPrompts.length} results
              </span>
            </div>
            <button className={s.secClear} onClick={clearAll}>✕ Clear</button>
          </div>

          {(loadingCat || searching) && (
            <div className={s.secLoading}>
              <div className={s.secLoadingSpinner} />
              Searching…
            </div>
          )}

          {showSearch && !searching && (
            searchResults.length > 0 ? (
              <div className={s.grid}>
                {searchResults.map((p, i) => <PromptCard key={p.PromptId} prompt={p} rank={i + 1} />)}
              </div>
            ) : (
              <div className={s.secEmpty}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div>No prompts found for "<strong>{search}</strong>"</div>
                <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>Try: romantic, sunset, portrait, cinematic</div>
              </div>
            )
          )}

          {!showSearch && !loadingCat && (
            <div className={s.promptList}>
              {(topMode ? topPrompts : catPrompts).map((p, i) => (
                <div
                  key={p.PromptId}
                  className={s.promptRow}
                  onClick={() => navigate(`/prompt/${p.PromptId}`)}
                >
                  <div className={s.promptRowRank}>#{i + 1}</div>
                  <div className={s.promptRowThumb} style={{ background: getMeta(p.Categories).grad }}>
                    {p.FromURL
                      ? <img src={p.FromURL} alt={p.Categories} onError={(e) => { e.target.style.display = 'none'; }} />
                      : <span>🖼️</span>
                    }
                  </div>
                  <div className={s.promptRowBody}>
                    <div className={s.promptRowTitle}>
                      <span className={s.promptRowBadge} style={{ background: getMeta(p.Categories).grad }}>
                        {p.Categories}
                      </span>
                      Prompt #{p.PromptId}
                      {p.tags && (
                        <span className={s.promptRowTags}>
                          {p.tags.split(',').slice(0, 3).map((t) => (
                            <span key={t} className={s.promptRowTag}>{t.trim()}</span>
                          ))}
                        </span>
                      )}
                    </div>
                    <div className={s.promptRowPreview}>
                      {(p.promptdescription || '').replace(/"/g, '').slice(0, 120)}…
                    </div>
                  </div>
                  <div className={s.promptRowMeta}>
                    <span className={s.promptRowUses}>▲ {(p.usedcount || 0).toLocaleString()}</span>
                    <button className={s.promptRowBtn}>Try it →</button>
                  </div>
                </div>
              ))}
              {!loadingCat && !topMode && catPrompts.length === 0 && (
                <div className={s.secEmpty}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
                  <div>No prompts in <strong>{selectedCat}</strong> yet.</div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <Footer />
    </div>
  );
}
