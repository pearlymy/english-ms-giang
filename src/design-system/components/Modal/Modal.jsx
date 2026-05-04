import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import { Button } from '../Button/Button';

export const Modal = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  contentClassName = '',
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={`${styles.content} ${contentClassName}`}>
          {title && <Dialog.Title className={styles.title}>{title}</Dialog.Title>}
          {description && (
            <Dialog.Description className={styles.description}>
              {description}
            </Dialog.Description>
          )}
          
          <div style={{ marginTop: title || description ? '16px' : '0' }}>
            {children}
          </div>

          {(primaryAction || secondaryAction) && (
            <div className={styles.actions}>
              {secondaryAction && (
                <Dialog.Close asChild>
                  <Button variant="outline" onClick={secondaryAction.onClick}>
                    {secondaryAction.label}
                  </Button>
                </Dialog.Close>
              )}
              {primaryAction && (
                <Button variant={primaryAction.danger ? 'danger' : 'primary'} onClick={primaryAction.onClick}>
                  {primaryAction.label}
                </Button>
              )}
            </div>
          )}

          <Dialog.Close asChild>
            <button className={styles.closeButton} aria-label="Close">
              <X size={20} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
