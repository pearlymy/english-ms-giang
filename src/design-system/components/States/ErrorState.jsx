import React from 'react';
import styles from './States.module.css';
import { Button } from '../Button/Button';
import { AlertCircle } from 'lucide-react';

export const ErrorState = ({ title = 'Something went wrong', description, retryAction }) => {
  return (
    <div className={styles.container}>
      <div className={`${styles.iconWrapper} ${styles.errorIcon}`}>
        <AlertCircle size={48} strokeWidth={1.5} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      
      {retryAction && (
        <div className={styles.actions}>
          <Button variant="outline" onClick={retryAction.onClick}>
            {retryAction.label || 'Try Again'}
          </Button>
        </div>
      )}
    </div>
  );
};
