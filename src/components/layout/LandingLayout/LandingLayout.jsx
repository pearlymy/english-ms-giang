import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button } from '../../../design-system/components/Button/Button';
import { useAuth, ROLE_HOME } from '../../../contexts/AuthContext';
import styles from './LandingLayout.module.css';

const NAV_LINKS = [
  { to: '/#about',              label: 'Về cô Giang',  isAnchor: true },
  { to: '/lich-khai-giang',     label: 'Khóa học' },
  { to: '/#testimonials',       label: 'Học viên',     isAnchor: true },
];

export const LandingLayout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Role-aware destination
  const authDest = isAuthenticated ? (ROLE_HOME[user?.role] ?? '/app/dashboard') : '/dang-nhap';
  const authLabel = isAuthenticated ? (user?.role === 'admin' ? 'Dashboard' : 'Vào khóa học') : 'Đăng nhập';

  // Close menu on route navigation or outside click (via ESC)
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.layout}>
      {/* ===== NAVBAR ===== */}
      <nav className={styles.navbar}>
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          <BookOpen size={24} color="var(--color-primary)" />
          HG English
        </Link>

        {/* Desktop nav links */}
        <div className={styles.navLinks}>
          {NAV_LINKS.map(({ to, label, isAnchor }) =>
            isAnchor ? (
              <a key={to} href={to} className={styles.navLink}>{label}</a>
            ) : (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {label}
              </NavLink>
            )
          )}
          <Button variant="outline" onClick={() => navigate(authDest)}>
            {authLabel}
          </Button>
        </div>

        {/* Mobile hamburger button */}
        <button
          className={styles.hamburger}
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(v => !v)}
        >
          {/* Animated bars → X */}
          <span className={`${styles.bar} ${menuOpen ? styles.barTopOpen : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barMidOpen : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barBotOpen : ''}`} />
        </button>
      </nav>

      {/* ===== MOBILE DRAWER ===== */}
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropVisible : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}
      >
        <div className={styles.drawerInner}>
          {NAV_LINKS.map(({ to, label, isAnchor }) =>
            isAnchor ? (
              <a key={to} href={to} className={styles.drawerLink} onClick={closeMenu}>
                {label}
              </a>
            ) : (
              <Link key={to} to={to} className={styles.drawerLink} onClick={closeMenu}>
                {label}
              </Link>
            )
          )}
          <div className={styles.drawerCta}>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={() => { navigate(authDest); closeMenu(); }}
            >
              {authLabel}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>HG English</span>
        <span>© 2026 Hương Giang LMS. All rights reserved.</span>
        <span>📧 contact@hgenglish.vn</span>
      </footer>
    </div>
  );
};
