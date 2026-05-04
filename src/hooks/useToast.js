import { useContext } from 'react';
import { ToastContext } from '../design-system/components/Toast/Toast';

/**
 * useToast — access the toast API from any component inside ToastProvider.
 *
 * @returns {{
 *   success: (message: string, opts?: object) => string,
 *   error:   (message: string, opts?: object) => string,
 *   warning: (message: string, opts?: object) => string,
 *   info:    (message: string, opts?: object) => string,
 *   dismiss: (id: string) => void,
 * }}
 *
 * @example
 * const toast = useToast();
 * toast.success('Đăng ký thành công!');
 * toast.error('Có lỗi xảy ra', { title: 'Lỗi kết nối', duration: 6000 });
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within <ToastProvider>.');
  }
  return ctx;
}
