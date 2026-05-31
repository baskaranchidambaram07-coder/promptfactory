import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>Prompt<span>Factory</span></Link>
      <div className={styles.links}>
        <Link to="/" className={styles.link}>Explore</Link>
        <Link to="/video" className={styles.link}>Video</Link>
        <Link to="/contact" className={styles.link}>Contact</Link>
      </div>
      <div className={styles.cta}>
        {user ? (
          <>
            {user.is_premium && <span className={styles.premiumBadge}>⭐ Premium</span>}
            {user.role === 'admin' && <Link to="/admin" className={styles.btnGhost}>Admin</Link>}
            <button className={styles.btnGhost} onClick={logout}>Sign Out</button>
          </>
        ) : (
          <>
            <button className={styles.btnGhost} onClick={() => navigate('/auth')}>Sign In</button>
            <button className={styles.btnPrimary} onClick={() => navigate('/auth?mode=signup')}>Get Started</button>
          </>
        )}
      </div>
    </nav>
  );
}
