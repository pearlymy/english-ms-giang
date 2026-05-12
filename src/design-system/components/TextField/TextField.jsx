import React from 'react';
import { Lock } from 'lucide-react';
import styles from './TextField.module.css';

/**
 * TextField — Design System component
 *
 * Props:
 *  label       — nhãn hiển thị
 *  required    — hiện dấu * màu đỏ bên cạnh label
 *  error       — string: hiện border đỏ + message lỗi bên dưới
 *  helperText  — string: text phụ bên dưới (khi không có lỗi)
 *  readOnly    — boolean: field chỉ đọc, hiện icon khóa
 *  variant     — 'default' | 'error' | 'success' (backwards compat)
 *  disabled    — boolean
 */
export const TextField = React.forwardRef(({
  label,
  required = false,
  error,
  helperText,
  variant = 'default',
  disabled = false,
  readOnly = false,
  className = '',
  ...props
}, ref) => {
  const hasError = !!error;
  const containerClasses = [
    styles.container,
    hasError ? styles.error : '',
    !hasError && variant !== 'default' ? styles[variant] : '',
    readOnly ? styles.readOnly : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
          {readOnly && (
            <span className={styles.readOnlyBadge}>
              <Lock size={10} /> Tự động sinh
            </span>
          )}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <input
          ref={ref}
          className={styles.input}
          disabled={disabled}
          readOnly={readOnly}
          {...props}
        />
      </div>
      {(hasError || helperText) && (
        <span className={hasError ? styles.errorText : styles.helperText}>
          {hasError ? error : helperText}
        </span>
      )}
    </div>
  );
});

TextField.displayName = 'TextField';
