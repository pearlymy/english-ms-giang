import React from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';
import styles from './Avatar.module.css';

export const Avatar = ({ 
  src, 
  alt = 'Avatar', 
  fallback, 
  size = 'md', 
  shape = 'circle',
  className = ''
}) => {
  const rootClasses = [
    styles.root, 
    styles[size], 
    styles[shape],
    className
  ].filter(Boolean).join(' ');

  return (
    <RadixAvatar.Root className={rootClasses}>
      <RadixAvatar.Image
        className={styles.image}
        src={src}
        alt={alt}
      />
      <RadixAvatar.Fallback className={styles.fallback} delayMs={600}>
        {fallback}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
};
