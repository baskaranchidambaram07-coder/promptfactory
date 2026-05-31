import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PromptCard from '../components/PromptCard';
import api from '../api';
import styles from './Home.module.css';

const CATEGORIES = ['travel', 'music', 'invite', 'love'];

const CAT_ICONS = { travel: '✈️', music: '🎵', invite: '🎉', love: '❤️' };

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [allCategoryMode, setAllCategoryMode] = useState(false);
  const [topMode, setTopMode] = useState(false);

  const [trending, setTrending] = useState([]);
  const [categoryPrompts, setCategoryPrompts] = useState([]);
  const [onePerCategory, setOnePerCategory] = useState([]);
  const [topPrompts, setTopPrompts] = useState([]);

  // Load 4 trending for right panel
  useEffect(() => {
    api.get('/prompt/trending?limit=4').then((r) => setTrending(r.data)).catch(() => {});
  }, []);

  // Secondary section logic
  useEffect(() => {
    if (topMode) {
      api.get('/prompt/top?limit=20').then((r) => setTopPrompts(r.data)).catch(() => {});
      return;
    }
    if (allCategoryMode) {
      api.get('/prompt/by-category').then((r) => setOnePerCategory(r.data)).catch(() => {});
      return;
    }
    if (selectedCategory) {
      api.get(`/prompt?category=${selectedCategory}`).then((r) => setCategoryPrompts(r.data)).catch(() => {});
    }
  }, [selectedCategory, allCategoryMode, topMode]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setAllCategoryMode(false);
    setTopMode(false);
  };

  const handleAllCategory = () => {
    setAllCategoryMode(true);
    setSelectedCategory(null);
    setTopMode(false);
  };

  const handleTopPrompts = () => {
    setTopMode(true);
    setAllCategoryMode(false);
    setSelectedCategory(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  const showSecondary = selectedCategory || allCategoryMode || topMode;

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── Primary 3-column section ── */}
      <div className={styles.threeCol}>

        {/* Left — categories */}
        <aside className={styles.left}>
          <p className={styles.sectionLabel}>Categories</p>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.catBtn} ${selectedCategory === cat ? styles.catBtnActive : ''}`}
              onClick={() => handleCategorySelect(cat)}
            >
              <span>{CAT_ICONS[cat]}</span>
              <span className={styles.catName}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
            </button>
          ))}
          <button
            className={`${styles.catBtn} ${allCategoryMode ? styles.catBtnActive : ''} ${styles.allCatBtn}`}
            onClick={handleAllCategory}
          >
            <span>🗂️</span>
            <span className={styles.catName}>All Category</span>
          </button>
        </aside>

        {/* Middle — search + video */}
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
              placeholder="Search prompts — try 'travel sunset' or 'love portrait'"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </main>

        {/* Right — trending images + explore button */}
        <aside className={styles.right}>
          <p className={styles.sectionLabel}>Trending Now</p>
          <div className={styles.trendingGrid}>
            {trending.map((p) => (
              <div
                key={p.id}
                className={styles.trendingThumb}
                onClick={() => navigate(`/prompt/${p.id}`)}
              >
                {p.thumbnail_url
                  ? <img src={p.thumbnail_url} alt={p.title} />
                  : <span className={styles.thumbPlaceholder}>🖼️</span>
                }
                <span className={styles.thumbTitle}>{p.title}</span>
              </div>
            ))}
          </div>
          <button className={styles.exploreBtn} onClick={handleTopPrompts}>
            Explore Top 10 Prompts →
          </button>
        </aside>
      </div>

      {/* ── Secondary section ── */}
      {showSecondary && (
        <section className={styles.secondary}>
          {topMode && (
            <>
              <div className={styles.secHeader}>
                <span className={styles.secTitle}>🏆 Top 20 Prompts</span>
              </div>
              <div className={styles.grid}>
                {topPrompts.map((p, i) => <PromptCard key={p.id} prompt={p} rank={i + 1} />)}
              </div>
            </>
          )}

          {allCategoryMode && (
            <>
              <div className={styles.secHeader}>
                <span className={styles.secTitle}>🗂️ All Categories</span>
              </div>
              <div className={styles.grid}>
                {onePerCategory.map((p) => <PromptCard key={p.id} prompt={p} />)}
              </div>
            </>
          )}

          {selectedCategory && !allCategoryMode && !topMode && (
            <>
              <div className={styles.secHeader}>
                <span className={styles.secTitle}>
                  {CAT_ICONS[selectedCategory]} {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Prompts
                </span>
              </div>
              <div className={styles.grid}>
                {categoryPrompts.map((p, i) => <PromptCard key={p.id} prompt={p} rank={i + 1} />)}
                {categoryPrompts.length === 0 && (
                  <p className={styles.empty}>No prompts found in this category yet.</p>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <Footer />
    </div>
  );
}
