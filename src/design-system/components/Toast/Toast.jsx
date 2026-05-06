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

/* ── Default titles per variant ──────────────────────── */
const DEFAULT_TITLES = {
  success: 'Thành công',
  error:   'Lỗi',
  warning: 'Cảnh báo',
  info:    'Thông tin',
};

/* ── Default duration (ms) ───────────────────────────── */
const DEFAULT_DURATION = 4000;
/** Exit animation must match CSS exit animation duration */
const EXIT_ANIMATION_MS = 280;

/* ── Provider ────────────────────────────────────────── */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  // Map of id → timeout handle so we can clear on manual dismiss
  const timers = useRef({});
  // Map of id → pause state for hover
  const pausedAt = useRef({});
  const remaining = useRef({});

  const dismiss = useCallback((id) => {
    // Clear auto-dismiss timer if still pending
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
    delete pausedAt.current[id];
    delete remaining.current[id];
    // Trigger exit animation
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove from DOM after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const pauseTimer = useCallback((id) => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
      pausedAt.current[id] = Date.now();
    }
  }, []);

  const resumeTimer = useCallback((id) => {
    const pauseTime = pausedAt.current[id];
    const rem = remaining.current[id];
    if (pauseTime && rem) {
      const elapsed = Date.now() - pauseTime;
      const left = Math.max(rem - elapsed, 500);
      remaining.current[id] = left;
      delete pausedAt.current[id];
      timers.current[id] = setTimeout(() => dismiss(id), left);
    }
  }, [dismiss]);

  const add = useCallback(
    ({ message, title, variant = 'info', duration = DEFAULT_DURATION }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const autoTitle = title ?? DEFAULT_TITLES[variant];
      setToasts(prev => [...prev, { id, message, title: autoTitle, variant, duration, exiting: false }]);

      if (duration > 0) {
        remaining.current[id] = duration;
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
          <ToastItem
            key={t.id}
            data={t}
            onDismiss={() => dismiss(t.id)}
            onPause={() => pauseTimer(t.id)}
            onResume={() => resumeTimer(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ── Individual Toast Item ───────────────────────────── */
function ToastItem({ data: { message, title, variant, duration, exiting }, onDismiss, onPause, onResume }) {
  const Icon = ICONS[variant] ?? Info;

  return (
    <div
      role="alert"
      className={`${styles.toast} ${styles[variant]} ${exiting ? styles.exiting : ''}`}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
    >
      {/* Coloured left accent */}
      <div className={styles.accent} />

      {/* Icon with tinted background */}
      <div className={`${styles.iconWrap} ${styles[`icon_${variant}`]}`}>
        <Icon size={20} strokeWidth={2.2} />
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
        <X size={15} />
      </button>

      {/* Auto-dismiss progress bar */}
      {duration > 0 && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ '--toast-duration': `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}
