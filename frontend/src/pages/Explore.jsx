import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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

const PAGE_SIZE = 12;

export default function Explore() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [allPrompts, setAllPrompts]     = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCat]  = useState(searchParams.get('cat') || '');
  const [sort, setSort]                 = useState('id');   // 'id' | 'popular'
  const [page, setPage]                 = useState(1);

  // Load everything once
  useEffect(() => {
    Promise.all([
      api.get('/prompt/').catch(() => ({ data: [] })),
      api.get('/prompt/categories').catch(() => ({ data: [] })),
    ]).then(([promptsRes, catsRes]) => {
      setAllPrompts(promptsRes.data || []);
      setCategories(catsRes.data || []);
      setLoading(false);
    });
  }, []);

  // Sync URL params
  useEffect(() => {
    const params = {};
    if (search)         params.q = search;
    if (activeCategory) params.cat = activeCategory;
    setSearchParams(params, { replace: true });
  }, [search, activeCategory]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...allPrompts];
    if (activeCategory) {
      list = list.filter((p) => p.Categories?.toLowerCase() === activeCategory.toLowerCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.promptdescription || '').toLowerCase().includes(q) ||
          (p.Categories || '').toLowerCase().includes(q) ||
          (p.tags || '').toLowerCase().includes(q) ||
          String(p.PromptId).includes(q),
      );
    }
    if (sort === 'id') list.sort((a, b) => a.PromptId - b.PromptId);
    else               list.sort((a, b) => (b.usedcount || 0) - (a.usedcount || 0));
    return list;
  }, [allPrompts, activeCategory, search, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCat = (cat) => {
    setActiveCat((prev) => (prev === cat ? '' : cat));
    setPage(1);
  };
  const handleSearch = (v) => { setSearch(v); setPage(1); };

  return (
    <div className={s.page}>
      <Navbar />

      {/* ── Page header ── */}
      <div className={s.exploreHeader}>
        <div className={s.exploreHeaderInner}>
          <h1 className={s.exploreTitle}>Explore Styles</h1>
          <p className={s.exploreSub}>
            {loading ? '…' : `${allPrompts.length} curated AI photo transformation styles`}
          </p>
        </div>

        {/* Search */}
        <div className={s.exploreSearch}>
          <svg className={s.exploreSearchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className={s.exploreSearchInput}
            placeholder="Search styles…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {search && (
            <button className={s.exploreSearchClear} onClick={() => handleSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className={s.exploreFilters}>
        {/* Category pills */}
        <div className={s.exploreCatPills}>
          <button
            className={`${s.exploreCatPill} ${!activeCategory ? s.exploreCatPillActive : ''}`}
            onClick={() => handleCat('')}
          >
            All
          </button>
          {categories.map((item) => {
            const meta = getMeta(item.category);
            const active = activeCategory === item.category;
            return (
              <button
                key={item.category}
                className={`${s.exploreCatPill} ${active ? s.exploreCatPillActive : ''}`}
                style={active ? { background: meta.grad, borderColor: 'transparent', color: '#fff' } : {}}
                onClick={() => handleCat(item.category)}
              >
                {meta.icon} {item.category}
                <span className={s.explorePillCount}>{item.total_used}</span>
              </button>
            );
          })}
        </div>

        {/* Sort + result count */}
        <div className={s.exploreSortRow}>
          <span className={s.exploreResultCount}>
            {filtered.length} style{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className={s.exploreSortBtns}>
            <button
              className={`${s.exploreSortBtn} ${sort === 'id' ? s.exploreSortBtnActive : ''}`}
              onClick={() => { setSort('id'); setPage(1); }}
            >
              Sequential
            </button>
            <button
              className={`${s.exploreSortBtn} ${sort === 'popular' ? s.exploreSortBtnActive : ''}`}
              onClick={() => { setSort('popular'); setPage(1); }}
            >
              Most Popular
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className={s.exploreBody}>
        {loading ? (
          <div className={s.loading}>Loading styles…</div>
        ) : paged.length === 0 ? (
          <div className={s.secEmpty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div>No styles found{search ? ` for "${search}"` : ''}{activeCategory ? ` in ${activeCategory}` : ''}.</div>
          </div>
        ) : (
          <div className={s.exploreGrid}>
            {paged.map((p) => (
              <ExploreCard key={p.PromptId} prompt={p} onNavigate={navigate} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={s.explorePagination}>
            <button
              className={s.explorePageBtn}
              disabled={page <= 1}
              onClick={() => { setPage((n) => n - 1); window.scrollTo(0, 0); }}
            >
              ← Prev
            </button>
            <div className={s.explorePageNums}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`${s.explorePageNum} ${n === page ? s.explorePageNumActive : ''}`}
                  onClick={() => { setPage(n); window.scrollTo(0, 0); }}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              className={s.explorePageBtn}
              disabled={page >= totalPages}
              onClick={() => { setPage((n) => n + 1); window.scrollTo(0, 0); }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

/* ── Card component ── */
function ExploreCard({ prompt, onNavigate }) {
  const meta = getMeta(prompt.Categories);

  const handleClick = async () => {
    try { await api.post(`/prompt/${prompt.PromptId}/click`); } catch {}
    onNavigate(`/prompt/${prompt.PromptId}`);
  };

  return (
    <div className={s.exploreCard} onClick={handleClick}>
      {/* Image area with before/after hover */}
      <div className={s.exploreCardImg}>
        {prompt.FromURL
          ? <img src={prompt.FromURL} alt={prompt.Categories} className={s.exploreCardImgBase} onError={(e) => { e.target.style.display = 'none'; }} />
          : <span className={s.exploreCardImgPlaceholder}>🖼️</span>
        }
        {prompt.ToURL && (
          <img src={prompt.ToURL} alt="after" className={s.exploreCardImgHover} onError={(e) => { e.target.style.display = 'none'; }} />
        )}
        <div className={s.exploreCardOverlay}>
          <span className={s.exploreCardId}>#{prompt.PromptId}</span>
          <span className={s.exploreCardCat} style={{ background: meta.grad }}>
            {meta.icon} {prompt.Categories}
          </span>
        </div>
        {prompt.FromURL && prompt.ToURL && (
          <div className={s.exploreCardHint}>Hover to preview</div>
        )}
      </div>

      {/* Body */}
      <div className={s.exploreCardBody}>
        <div className={s.exploreCardTitle}>
          <span className={s.exploreCardCatBadge} style={{ background: meta.grad }}>
            {prompt.Categories}
          </span>
          Style #{prompt.PromptId}
        </div>
        <p className={s.exploreCardDesc}>
          {(prompt.promptdescription || '').replace(/^"|"$/g, '').slice(0, 90)}…
        </p>
        {prompt.tags && (
          <div className={s.exploreCardTags}>
            {prompt.tags.split(',').slice(0, 4).map((t) => (
              <span key={t} className={s.exploreCardTag}>{t.trim()}</span>
            ))}
          </div>
        )}
        <div className={s.exploreCardFooter}>
          <span className={s.exploreCardUses}>▲ {(prompt.usedcount || 0).toLocaleString()} uses</span>
          <span className={s.exploreCardBtn}>Try it →</span>
        </div>
      </div>
    </div>
  );
}
