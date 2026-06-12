import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.logo}>Prompt<span>Factory</span></div>
      <div className={styles.links}>
        <Link to="/contact" className={styles.link}>Contact</Link>
        <Link to="/legal/terms" className={styles.link}>Terms</Link>
        <Link to="/legal/privacy" className={styles.link}>Privacy</Link>
        <Link to="/legal/refund" className={styles.link}>Refund Policy</Link>
        <Link to="/video" className={styles.link}>Video — Coming Soon</Link>
      </div>
      <span className={styles.copy}>© {new Date().getFullYear()} PromptFactory Inc.</span>
    </footer>
  );
}
