import React from 'react';
import styles from './States.module.css';
import { Button } from '../Button/Button';

export const EmptyState = ({ icon: Icon, title, description, primaryAction, secondaryAction }) => {
  return (
    <div className={styles.container}>
      {Icon && (
        <div className={styles.iconWrapper}>
          <Icon size={48} strokeWidth={1.5} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      
      {(primaryAction || secondaryAction) && (
        <div className={styles.actions}>
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button variant="primary" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
