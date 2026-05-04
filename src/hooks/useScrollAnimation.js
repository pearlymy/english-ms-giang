import { useEffect, useRef } from 'react';

/**
 * useScrollAnimation
 * Attaches an IntersectionObserver to a ref. When the element enters
 * the viewport, the class defined in global.css ('is-visible') is added,
 * triggering the CSS animation. The observer is then disconnected so
 * the animation only fires once.
 *
 * @param {Object} options - IntersectionObserver options
 * @param {number} [options.threshold=0.12] - Visibility threshold to trigger
 * @param {string} [options.rootMargin='0px 0px -40px 0px'] - Root margin
 * @returns {React.RefObject} - Attach to the element you want to animate
 */
export function useScrollAnimation(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
        ...options,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
