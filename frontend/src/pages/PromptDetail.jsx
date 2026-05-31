import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import api from '../api';
import styles from './PromptDetail.module.css';

export default function PromptDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    api.get(`/prompt/${id}`).then((r) => setPrompt(r.data)).catch(() => {});
  }, [id]);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!user) return alert('Please sign in to generate images.');
    if (!file) return alert('Please upload a reference image.');
    setGenerating(true);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('prompt_id', prompt.id);
      const res = await api.post('/prompt/generate', form);
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  if (!prompt) return <div className={styles.loading}>Loading…</div>;

  const dailyUsed = user?.daily_generations_used || 0;
  const dailyLimit = user?.is_premium ? '∞' : 3;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.layout}>

        {/* Left */}
        <div className={styles.left}>
          <div className={styles.breadcrumb}>
            <Link to="/">Explore</Link> <span>/</span>
            <span style={{ textTransform: 'capitalize' }}>{prompt.category}</span> <span>/</span>
            {prompt.title}
          </div>

          <h1 className={styles.h1}>{prompt.title}</h1>

          <div className={styles.tags}>
            <span className={styles.tagAccent} style={{ textTransform: 'capitalize' }}>{prompt.category}</span>
            <span className={styles.tagAccent}>▲ {(prompt.click_count || 0).toLocaleString()} clicks</span>
            {(prompt.tags || []).map((t) => <span key={t} className={styles.tag}>{t}</span>)}
          </div>

          {/* Reference images */}
          {prompt.images?.length > 0 && (
            <div className={styles.refSection}>
              <div className={styles.boxLabel}>Reference Images</div>
              <div className={styles.refGrid}>
                {prompt.images.map((img, i) => (
                  <div
                    key={i}
                    className={`${styles.refImg} ${activeImg === i ? styles.refImgActive : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt={`ref-${i}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full prompt */}
          <div className={styles.promptBox}>
            <div className={styles.boxLabel}>Full Prompt</div>
            <button className={styles.copyBtn} onClick={() => copy(prompt.text)}>
              {copied ? '✓ Copied' : '⎘ Copy'}
            </button>
            <p className={styles.promptText}>{prompt.text}</p>
          </div>

          {/* Negative prompt */}
          {prompt.negative_prompt && (
            <div className={styles.promptBox}>
              <div className={styles.boxLabel}>Negative Prompt</div>
              <button className={styles.copyBtn} onClick={() => copy(prompt.negative_prompt)}>⎘ Copy</button>
              <p className={styles.promptText} style={{ color: 'var(--pf-coral)' }}>{prompt.negative_prompt}</p>
            </div>
          )}
        </div>

        {/* Right — generate panel */}
        <div className={styles.right}>
          <div className={styles.rightTitle}>Generate Image</div>
          <div className={styles.rightSub}>Use this prompt to create a unique image</div>

          {/* Pipeline display */}
          {user?.is_premium ? (
            <div className={styles.premiumBanner}>
              <span>⭐</span>
              <div>
                <div className={styles.premiumTitle}>3-Stage Premium Pipeline</div>
                <div className={styles.premiumDesc}>Generate → Evaluate → Final Check</div>
              </div>
            </div>
          ) : (
            <div className={styles.freeBanner}>
              <span>⚡</span>
              <div>
                <div className={styles.freeTitle}>Free Tier — Single Stage</div>
                <div className={styles.freeDesc}>Upgrade to Premium for 3-stage pipeline</div>
              </div>
            </div>
          )}

          {/* Upload */}
          <label className={styles.uploadBox}>
            <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files[0])} />
            {file ? (
              <span className={styles.uploadLabel}>📎 {file.name}</span>
            ) : (
              <>
                <span style={{ fontSize: 22 }}>📎</span>
                <span className={styles.uploadLabel}>Upload reference image</span>
                <span className={styles.uploadSub}>PNG, JPG up to 10MB</span>
              </>
            )}
          </label>

          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? '⏳ Generating…' : '⚡ Generate Image'}
          </button>

          {/* Daily usage */}
          {user && !user.is_premium && (
            <div className={styles.usageWrap}>
              <div className={styles.usageLabel}>
                <span>Daily usage</span>
                <span>{dailyUsed} / {dailyLimit} used</span>
              </div>
              <div className={styles.usageBar}>
                <div className={styles.usageFill} style={{ width: `${(dailyUsed / 3) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={styles.resultBox}>
              <div className={styles.boxLabel}>Generated Output</div>
              <img src={result.output_url} alt="Generated" className={styles.resultImg} />
              <a href={result.output_url} download className={styles.downloadBtn}>⬇ Download</a>
            </div>
          )}

          {!user && (
            <div className={styles.signInBox}>
              <div className={styles.rightTitle} style={{ fontSize: 13 }}>Save to your Library</div>
              <div className={styles.rightSub}>Sign in to save prompts and track generations</div>
              <Link to="/auth" className={styles.generateBtn} style={{ display: 'block', textAlign: 'center', marginTop: 12 }}>
                Sign In with Google
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
