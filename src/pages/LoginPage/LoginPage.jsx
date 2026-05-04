import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { BookOpen, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth, ROLE_HOME } from '../../contexts/AuthContext';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Where to go after login ── */
  const from = location.state?.from?.pathname ?? null;

  /* ── Field change ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Vui lòng nhập tên đăng nhập hoặc email.';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu.';
    return errs;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);

    if (!result.ok) {
      setApiError(result.error);
      return;
    }

    // Redirect: back to original page → role home
    navigate(from ?? ROLE_HOME[result.user.role] ?? '/app/dashboard', { replace: true });
  };

  return (
    <div className={styles.page}>
      {/* ── Left brand panel ── */}
      <div className={styles.brand}>
        <div className={styles.brandInner}>
          <Link to="/" className={styles.brandLogo}>
            <BookOpen size={32} />
            <span>HG English</span>
          </Link>

          <div className={styles.brandContent}>
            <h1 className={styles.brandTitle}>
              Học thật,<br />hiểu thật,<br />tiến thật.
            </h1>
            <p className={styles.brandSub}>
              Trung tâm anh ngữ cô Hương Giang — lớp nhỏ, chất lượng lớn.
            </p>

            <ul className={styles.brandList}>
              <li><span className={styles.brandDot} />Lớp nhỏ 5–8 học sinh</li>
              <li><span className={styles.brandDot} />Giáo viên tận tâm</li>
              <li><span className={styles.brandDot} />Kết quả thực tế</li>
            </ul>
          </div>

          <div className={styles.brandDecor} aria-hidden="true">
            <div className={styles.orb1} />
            <div className={styles.orb2} />
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          {/* Header */}
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Chào mừng trở lại</h2>
            <p className={styles.formSub}>Đăng nhập để tiếp tục học tập.</p>
          </div>

          {/* API error */}
          {apiError && (
            <div className={styles.apiError} role="alert">
              <AlertCircle size={16} />
              <span>{apiError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            {/* Email / Username */}
            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>Tên đăng nhập / Email</label>
              <div className={`${styles.inputWrap} ${errors.email ? styles.inputError : ''}`}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="login-email"
                  type="text"
                  name="email"
                  autoComplete="username"
                  placeholder="giang hoặc giang@hgenglish.vn"
                  value={form.email}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={loading}
                />
              </div>
              {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label htmlFor="login-password" className={styles.label}>Mật khẩu</label>
              <div className={`${styles.inputWrap} ${errors.password ? styles.inputError : ''}`}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={loading}
                />
              </div>
              {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
            </div>

            {/* Submit */}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : null}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.formFooter}>
            <Link to="/" className={styles.backLink}>← Về trang chủ</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
