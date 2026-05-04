import React from 'react';
import styles from './Card.module.css';

export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  interactive = false,
  className = '',
  onClick,
  ...props
}) => {
  const classes = [
    styles.card,
    variant !== 'default' ? styles[variant] : '',
    styles[padding],
    interactive ? styles.interactive : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes} 
      onClick={interactive ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
};
