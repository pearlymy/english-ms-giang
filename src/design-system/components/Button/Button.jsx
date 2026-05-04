import React from 'react';
import styles from './Button.module.css';

export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
  ...props
}) => {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (loading || disabled) return;
    if (onClick) onClick(e);
  };

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <span className={styles.spinner}>↻</span>}
      {children}
    </button>
  );
};
