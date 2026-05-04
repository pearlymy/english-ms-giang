import React from 'react';
import styles from './Divider.module.css';

export const Divider = ({ orientation = 'horizontal', className = '' }) => {
  return (
    <div 
      className={`${styles.divider} ${styles[orientation]} ${className}`} 
      role="separator" 
      aria-orientation={orientation}
    />
  );
};
