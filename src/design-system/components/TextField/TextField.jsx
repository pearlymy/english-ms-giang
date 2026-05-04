import React from 'react';
import styles from './TextField.module.css';

export const TextField = React.forwardRef(({
  label,
  helperText,
  variant = 'default',
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const containerClasses = [
    styles.container,
    variant !== 'default' ? styles[variant] : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        <input
          ref={ref}
          className={styles.input}
          disabled={disabled}
          {...props}
        />
      </div>
      {helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
});

TextField.displayName = 'TextField';
