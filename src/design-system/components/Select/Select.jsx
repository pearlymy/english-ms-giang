import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from './Select.module.css';

/**
 * Select (LOV — List of Values)
 *
 * Custom dropdown select that matches the design system.
 * Motion follows MOTION_SYSTEM.md:
 *   - Panel: fade + slide (motion.duration.normal = 180ms, easing.enter)
 *   - Item highlight: motion.duration.fast = 120ms, easing.standard
 *
 * @param {string}   label        - Field label
 * @param {string}   placeholder  - Placeholder text
 * @param {Array}    options       - [{ value, label, group? }] or grouped [{ group, items:[{value,label}] }]
 * @param {string}   value        - Controlled value
 * @param {Function} onChange     - (value) => void
 * @param {boolean}  disabled
 * @param {string}   helperText
 * @param {string}   errorText
 */
export const Select = ({
  label,
  placeholder = '— Chọn —',
  options = [],
  value,
  onChange,
  disabled = false,
  helperText,
  errorText,
  id: externalId,
  className = '',
}) => {
  const autoId = useId();
  const id = externalId ?? autoId;
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Find display label for current value
  const selectedLabel = (() => {
    for (const opt of options) {
      if (opt.group) {
        const found = opt.items?.find(i => i.value === value);
        if (found) return found.label;
      } else if (opt.value === value) {
        return opt.label;
      }
    }
    return null;
  })();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = (val) => {
    onChange?.(val);
    setOpen(false);
  };

  const hasError = !!errorText;

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${hasError ? styles.hasError : ''} ${disabled ? styles.disabled : ''} ${className}`}
    >
      {label && (
        <label htmlFor={id} className={styles.label}>{label}</label>
      )}

      {/* Trigger */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''} ${hasError ? styles.triggerError : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className={selectedLabel ? styles.triggerValue : styles.triggerPlaceholder}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
        />
      </button>

      {/* Panel */}
      {open && (
        <div className={styles.panel} role="listbox">
          {options.map((opt, i) => {
            if (opt.group) {
              return (
                <div key={i} className={styles.group}>
                  <div className={styles.groupLabel}>{opt.group}</div>
                  {opt.items?.map((item) => (
                    <SelectOption
                      key={item.value}
                      item={item}
                      selected={item.value === value}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              );
            }
            return (
              <SelectOption
                key={opt.value}
                item={opt}
                selected={opt.value === value}
                onSelect={handleSelect}
              />
            );
          })}
        </div>
      )}

      {/* Helper / Error */}
      {(helperText || errorText) && (
        <span className={`${styles.helperText} ${hasError ? styles.errorText : ''}`}>
          {errorText ?? helperText}
        </span>
      )}
    </div>
  );
};

function SelectOption({ item, selected, onSelect }) {
  return (
    <div
      role="option"
      aria-selected={selected}
      className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
      onClick={() => onSelect(item.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(item.value)}
      tabIndex={0}
    >
      <span>{item.label}</span>
      {selected && <Check size={14} className={styles.checkIcon} />}
    </div>
  );
}
