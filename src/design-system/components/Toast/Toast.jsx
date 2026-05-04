import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import styles from './Toast.module.css';

/* ── Context ─────────────────────────────────────────── */
export const ToastContext = createContext(null);

/* ── Icons per variant ───────────────────────────────── */
const ICONS = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

/* ── Default duration (ms) ───────────────────────────── */
const DEFAULT_DURATION = 4000;
/** Exit animation must match --toast-exit-duration in CSS */
const EXIT_ANIMATION_MS = 200;

/* ── Provider ────────────────────────────────────────── */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  // Map of id → timeout handle so we can clear on manual dismiss
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    // Clear auto-dismiss timer if still pending
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
    // Trigger exit animation
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove from DOM after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const add = useCallback(
    ({ message, title, variant = 'info', duration = DEFAULT_DURATION }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts(prev => [...prev, { id, message, title, variant, exiting: false }]);

      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  /** Convenience methods — match the toast() API pattern */
  const api = {
    success: (message, opts) => add({ message, variant: 'success', ...opts }),
    error:   (message, opts) => add({ message, variant: 'error',   ...opts }),
    warning: (message, opts) => add({ message, variant: 'warning', ...opts }),
    info:    (message, opts) => add({ message, variant: 'info',    ...opts }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Portal-like container — always rendered at the bottom of the provider */}
      <div
        className={styles.container}
        aria-live="polite"
        aria-atomic="false"
        aria-label="Thông báo"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} data={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ── Individual Toast Item ───────────────────────────── */
function ToastItem({ data: { message, title, variant, exiting }, onDismiss }) {
  const Icon = ICONS[variant] ?? Info;

  return (
    <div
      role="alert"
      className={`${styles.toast} ${styles[variant]} ${exiting ? styles.exiting : ''}`}
    >
      {/* Coloured left accent */}
      <div className={styles.accent} />

      {/* Icon */}
      <div className={`${styles.iconWrap} ${styles[`icon_${variant}`]}`}>
        <Icon size={18} strokeWidth={2.5} />
      </div>

      {/* Text */}
      <div className={styles.body}>
        {title && <p className={styles.title}>{title}</p>}
        <p className={styles.message}>{message}</p>
      </div>

      {/* Close button */}
      <button
        className={styles.closeBtn}
        onClick={onDismiss}
        aria-label="Đóng thông báo"
      >
        <X size={14} />
      </button>
    </div>
  );
}
