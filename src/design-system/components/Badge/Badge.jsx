import React from 'react';
import styles from './Badge.module.css';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const classes = [styles.badge, styles[variant], className].filter(Boolean).join(' ');
  
  return (
    <span className={classes}>
      {children}
    </span>
  );
};

export const NotificationBadge = ({ children, count, dot = false }) => {
  return (
    <div className={styles.notificationWrapper}>
      {children}
      {dot ? (
        <span className={styles.notificationDot} />
      ) : count !== undefined ? (
        <span className={styles.notificationBadge}>
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </div>
  );
};
