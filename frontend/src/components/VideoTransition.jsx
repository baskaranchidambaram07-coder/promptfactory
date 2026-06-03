import { useState, useEffect } from 'react';
import styles from './VideoTransition.module.css';

export default function VideoTransition({ fromUrl, toUrl }) {
  const [show, setShow] = useState('from');

  useEffect(() => {
    if (!fromUrl || !toUrl) return;
    
    const timer = setTimeout(() => setShow('to'), 3000);
    return () => clearTimeout(timer);
  }, [fromUrl, toUrl]);

  if (!fromUrl || !toUrl) return null;

  return (
    <div className={styles.container}>
      <img
        src={fromUrl}
        alt="From"
        className={`${styles.image} ${show === 'from' ? styles.visible : styles.hidden}`}
      />
      <img
        src={toUrl}
        alt="To"
        className={`${styles.image} ${show === 'to' ? styles.visible : styles.hidden}`}
      />
    </div>
  );
}
