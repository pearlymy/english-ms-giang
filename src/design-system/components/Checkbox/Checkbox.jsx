import React from 'react';
import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';

export const Checkbox = ({ checked, onChange, disabled, label, className = '' }) => {
  return (
    <label className={`${styles.wrapper} ${disabled ? styles.disabled : ''} ${className}`}>
      <div className={`${styles.checkbox} ${checked ? styles.checked : ''}`}>
        {checked && <Check size={15} strokeWidth={3} className={styles.icon} />}
      </div>
      {label && <span className={styles.label}>{label}</span>}
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(e) => !disabled && onChange?.(e.target.checked)}
        disabled={disabled}
      />
    </label>
  );
};
