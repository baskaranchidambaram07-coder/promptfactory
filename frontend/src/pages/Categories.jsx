import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';
import s from '../styles/pages.module.css';

const CAT_META = {
  Couples:  { icon: '💑', grad: 'linear-gradient(135deg,#FF6B9D,#FF8A5B)', desc: 'Romantic transformations for couples & love stories' },
  Travel:   { icon: '✈️', grad: 'linear-gradient(135deg,#4D9FFF,#00D9FF)', desc: 'Wanderlust-inspired photo styles from around the world' },
  Music:    { icon: '🎵', grad: 'linear-gradient(135deg,#8A74F9,#A68EFF)', desc: 'Artistic styles inspired by music and performance' },
  Invite:   { icon: '🎉', grad: 'linear-gradient(135deg,#00E5A0,#4D9FFF)', desc: 'Creative styles for invitations and celebrations' },
  Love:     { icon: '❤️', grad: 'linear-gradient(135deg,#FF6B9D,#FF8FB5)', desc: 'Heartfelt and romantic visual transformations' },
  Portrait: { icon: '🎨', grad: 'linear-gradient(135deg,#FF8A5B,#FF6B9D)', desc: 'Professional portrait and studio-quality styles' },
  Nature:   { icon: '🌿', grad: 'linear-gradient(135deg,#00E5A0,#4D9FFF)', desc: 'Natural and organic outdoor scene transformations' },
  Women:    { icon: '👩', grad: 'linear-gradient(135deg,#B19CD9,#FF6B9D)', desc: 'Elegant and expressive styles for women' },
  Men:      { icon: '👨', grad: 'linear-gradient(135deg,#4D9FFF,#8A74F9)', desc: 'Bold and refined styles for men' },
  Other:    { icon: '✨', grad: 'linear-gradient(135deg,#8A74F9,#FF6B9D)', desc: 'Unique and experimental creative styles' },
};
const getMeta = (cat) => CAT_META[cat] || { icon: '✨', grad: 'linear-gradient(135deg,#8A74F9,#FF6B9D)', desc: 'Creative AI photo transformation styles' };

export default function Categories() {
  const navigate = useNavigate();
  const { name } = useParams();                        // optional — /categories/:name

  const [categories, setCategories]   = useState([]);
  const [activecat, setActiveCat]     = useState(name || null);
  const [catStyles, setCatStyles]     = useState([]);
  const [allStyles, setAllStyles]     = useState([]);  // needed for counts
  const [loadingCat, setLoadingCat]   = useState(false);
  const [loadingAll, setLoadingAll]   = useState(true);

  // Load category list + all styles (for per-cat counts)
  useEffect(() => {
    Promise.all([
      api.get('/prompt/categories').catch(() => ({ data: [] })),
      api.get('/prompt/').catch(() => ({ data: [] })),
    ]).then(([catRes, styleRes]) => {
      setCategories(catRes.data || []);
      setAllStyles(styleRes.data || []);
      setLoadingAll(false);

      // Auto-select first category if none in URL
      const firstCat = name || (catRes.data[0]?.category ?? null);
      if (firstCat) loadCategory(firstCat, styleRes.data || []);
    });
  }, []);

  // If URL changes (/categories/:name)
  useEffect(() => {
    if (name && name !== activecat && allStyles.length > 0) {
      loadCategory(name, allStyles);
    }
  }, [name, allStyles]);

  const loadCategory = (cat, pool = allStyles) => {
    setActiveCat(cat);
    setLoadingCat(true);
    const filtered = pool.filter((p) => p.Categories?.toLowerCase() === cat.toLowerCase());
    filtered.sort((a, b) => a.PromptId - b.PromptId);
    setCatStyles(filtered);
    setLoadingCat(false);
  };

  const handleSelectCat = (cat) => {
    navigate(`/categories/${encodeURIComponent(cat)}`, { replace: false });
    loadCategory(cat);
  };

  const handleStyleClick = async (style) => {
    try { await api.post(`/prompt/${style.PromptId}/click`); } catch {}
    navigate(`/prompt/${style.PromptId}`);
  };

  const activeMeta = getMeta(activecat);

  return (
    <div className={s.page}>
      <Navbar />

      {/* ── Page header ── */}
      <div className={s.catPageHeader}>
        <h1 className={s.catPageTitle}>Categories</h1>
        <p className={s.catPageSub}>
          Choose a category to explore its AI photo transformation styles
        </p>
      </div>

      <div className={s.catPageLayout}>

        {/* ── LEFT SIDEBAR — category list ── */}
        <aside className={s.catSidebar}>
          <div className={s.catSidebarLabel}>All Categories</div>
          {loadingAll ? (
            <div className={s.catSidebarLoading}>Loading…</div>
          ) : (
            categories.map((item) => {
              const meta  = getMeta(item.category);
              const count = allStyles.filter(
                (p) => p.Categories?.toLowerCase() === item.category.toLowerCase()
              ).length;
              const active = activecat?.toLowerCase() === item.category.toLowerCase();

              return (
                <button
                  key={item.category}
                  className={`${s.catSidebarItem} ${active ? s.catSidebarItemActive : ''}`}
                  onClick={() => handleSelectCat(item.category)}
                >
                  <div
                    className={s.catSidebarIcon}
                    style={{ background: active ? meta.grad : 'var(--pf-elevated)' }}
                  >
                    {meta.icon}
                  </div>
                  <div className={s.catSidebarInfo}>
                    <span className={s.catSidebarName}>{item.category}</span>
                    <span className={s.catSidebarCount}>{count} style{count !== 1 ? 's' : ''}</span>
                  </div>
                  {active && <span className={s.catSidebarArrow}>›</span>}
                </button>
              );
            })
          )}
        </aside>

        {/* ── RIGHT — styles grid ── */}
        <main className={s.catMain}>
          {activecat && (
            <>
              {/* Category hero strip */}
              <div className={s.catHeroStrip} style={{ background: activeMeta.grad }}>
                <span className={s.catHeroIcon}>{activeMeta.icon}</span>
                <div>
                  <div className={s.catHeroName}>{activecat}</div>
                  <div className={s.catHeroDesc}>{activeMeta.desc}</div>
                </div>
                <div className={s.catHeroBadge}>
                  {catStyles.length} style{catStyles.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Styles grid */}
              {loadingCat ? (
                <div className={s.loading}>Loading styles…</div>
              ) : catStyles.length === 0 ? (
                <div className={s.secEmpty}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{activeMeta.icon}</div>
                  <div>No styles in <strong>{activecat}</strong> yet.</div>
                </div>
              ) : (
                <div className={s.catStyleGrid}>
                  {catStyles.map((style, i) => (
                    <div
                      key={style.PromptId}
                      className={s.catStyleCard}
                      onClick={() => handleStyleClick(style)}
                    >
                      {/* Image with before→after hover */}
                      <div className={s.catStyleCardImg}>
                        {style.FromURL
                          ? <img src={style.FromURL} alt="before" className={s.catStyleImgBase} onError={(e) => { e.target.style.display = 'none'; }} />
                          : <span className={s.catStyleImgPlaceholder}>🖼️</span>
                        }
                        {style.ToURL && (
                          <img src={style.ToURL} alt="after" className={s.catStyleImgHover} onError={(e) => { e.target.style.display = 'none'; }} />
                        )}
                        <div className={s.catStyleCardTop}>
                          <span className={s.catStyleCardNum}>#{i + 1}</span>
                          {style.FromURL && style.ToURL && (
                            <span className={s.catStyleHoverHint}>Hover to preview</span>
                          )}
                        </div>
                        <div className={s.catStyleCardBottom}>
                          <span className={s.catStyleUses}>▲ {(style.usedcount || 0).toLocaleString()} uses</span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className={s.catStyleCardBody}>
                        <div className={s.catStyleCardTitle}>Style #{style.PromptId}</div>
                        <p className={s.catStyleCardDesc}>
                          {(style.promptdescription || '').replace(/^"|"$/g, '').slice(0, 85)}…
                        </p>
                        {style.tags && (
                          <div className={s.catStyleTags}>
                            {style.tags.split(',').slice(0, 3).map((t) => (
                              <span key={t} className={s.catStyleTag}>{t.trim()}</span>
                            ))}
                          </div>
                        )}
                        <div className={s.catStyleCardCta}>Try this style →</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!activecat && !loadingAll && (
            <div className={s.secEmpty}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
              <div>Select a category from the sidebar to browse styles.</div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
