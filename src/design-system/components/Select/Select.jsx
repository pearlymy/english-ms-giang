import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';
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
  const [closing, setClosing] = useState(false);
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

  // Detect mobile — but NOT inside a modal (dialog)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const insideModal = containerRef.current?.closest('[role="dialog"]');
    if (insideModal) { setIsMobile(false); return; }
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [open]);

  // Animated close for mobile bottom sheet
  const closingRef = useRef(false);
  const closeSheet = useCallback(() => {
    if (!isMobile) { setOpen(false); return; }
    if (closingRef.current) return; // prevent double-close
    closingRef.current = true;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setOpen(false);
      closingRef.current = false;
    }, 250);
  }, [isMobile]);

  // Close on outside click (desktop only)
  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, isMobile]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open, isMobile]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') closeSheet(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, closeSheet]);

  const handleSelect = (val) => {
    onChange?.(val);
    // Close immediately (no animation) to avoid state conflicts
    setClosing(false);
    setOpen(false);
    closingRef.current = false;
    document.body.style.overflow = '';
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

      {/* Panel — desktop: dropdown / mobile: bottom sheet */}
      {open && !isMobile && (
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

      {/* Mobile bottom sheet — portal to body */}
      {open && isMobile && createPortal(
        <>
          <div
            className={`${styles.sheetBackdrop} ${closing ? styles.sheetBackdropClosing : ''}`}
            onClick={closeSheet}
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          />
          <div
            className={`${styles.sheet} ${closing ? styles.sheetClosing : ''}`}
            role="listbox"
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            <button className={styles.sheetClose} onClick={closeSheet} type="button">
              <X size={22} strokeWidth={2.5} />
            </button>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <span className={styles.sheetTitle}>{label || 'Chọn'}</span>
            </div>
            <div className={styles.sheetOptions}>
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
                          mobile
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
                    mobile
                  />
                );
              })}
            </div>
          </div>
        </>,
        document.body
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

function SelectOption({ item, selected, onSelect, mobile }) {
  return (
    <div
      role="option"
      aria-selected={selected}
      className={`${styles.option} ${selected ? styles.optionSelected : ''} ${mobile ? styles.optionMobile : ''}`}
      onClick={() => onSelect(item.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(item.value)}
      tabIndex={0}
    >
      <span>{item.label}</span>
      {selected && <Check size={14} className={styles.checkIcon} />}
    </div>
  );
}
