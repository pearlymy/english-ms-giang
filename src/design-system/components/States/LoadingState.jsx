import React from 'react';
import styles from './States.module.css';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ variant = 'spinner', text = 'Loading...', height = '200px' }) => {
  if (variant === 'skeleton') {
    return <div className={styles.skeleton} style={{ height }} />;
  }

  return (
    <div className={styles.container} style={{ height }}>
      <Loader2 size={32} className={styles.spinner} />
      {text && <p className={styles.description}>{text}</p>}
    </div>
  );
};
