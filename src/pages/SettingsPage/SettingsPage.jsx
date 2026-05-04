import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../design-system/components/Card/Card';
import { Tabs } from '../../design-system/components/Tabs/Tabs';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import styles from './SettingsPage.module.css';

/* ── Profile Tab ── */
const ProfileTab = ({ user }) => {
  return (
    <Stack gap="lg">
      {/* ── Identity card (avatar + name) ── */}
      <Card padding="lg">
        <div className={styles.profileHeader}>
          <div className={styles.avatarCircle}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className={styles.profileMeta}>
            <Text as="p" size="lg" weight="bold" color="textPrimary" style={{ margin: 0 }}>
              {user?.name || 'Học sinh'}
            </Text>
            <span className={styles.rolePill}>
              {user?.role === 'admin' ? 'Giáo viên / Quản trị' : 'Học viên'}
            </span>
          </div>
        </div>
      </Card>

      {/* ── Editable info ── */}
      <Card padding="lg">
        <Stack gap="lg">
          <Text as="h3" size="sm" weight="semibold" color="textSecondary"
            style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Thông tin liên hệ
          </Text>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Họ và tên</label>
              <input type="text" className={styles.input} value={user?.name || ''} readOnly />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email liên hệ</label>
              <input type="email" className={styles.input} value={user?.email || ''} readOnly />
            </div>
          </div>
          <Text as="p" size="xs" color="textSecondary" style={{ margin: 0 }}>
            Thông tin được quản lý bởi hệ thống. Liên hệ giáo viên nếu cần cập nhật.
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
};

/* ── Password Tab ── */
const PasswordTab = () => {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.next.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (form.next !== form.confirm) {
      setError('Mật khẩu mới và xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  return (
    <Stack gap="lg">

      {/* ── Tips card ── */}
      <Card padding="lg">
        <Stack gap="sm">
          <Text as="h3" size="sm" weight="semibold" color="textSecondary"
            style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Lưu ý bảo mật
          </Text>
          <ul className={styles.tipList}>
            <li>Sử dụng ít nhất 6 ký tự, nên dùng 8 ký tự trở lên</li>
            <li>Kết hợp chữ hoa, chữ thường và số</li>
            <li>Không sử dụng lại mật khẩu đã dùng trước đó</li>
          </ul>
        </Stack>
      </Card>

      {/* ── Form card ── */}
      <Card padding="lg">
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <Text as="h3" size="sm" weight="semibold" color="textSecondary"
              style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Đổi mật khẩu
            </Text>

            {/* Current password — full width */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Mật khẩu hiện tại</label>
              <input
                type="password" name="current" required
                value={form.current} onChange={handleChange}
                className={styles.input}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            {/* New + confirm — 2-col grid */}
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Mật khẩu mới</label>
                <input
                  type="password" name="next" required
                  value={form.next} onChange={handleChange}
                  className={styles.input}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Xác nhận mật khẩu mới</label>
                <input
                  type="password" name="confirm" required
                  value={form.confirm} onChange={handleChange}
                  className={`${styles.input} ${error ? styles.inputError : ''}`}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <Text as="p" size="sm" style={{ margin: 0, color: '#dc2626' }}>
                {error}
              </Text>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <button type="submit" className={styles.pillPrimary} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
              </button>
              {success && (
                <Text as="span" size="sm" weight="semibold"
                  style={{ color: '#059669', marginLeft: 16 }}>
                  Cập nhật thành công!
                </Text>
              )}
            </div>
          </Stack>
        </form>
      </Card>

    </Stack>
  );
};

/* ══════════════════════════════════════════
   SettingsPage
══════════════════════════════════════════ */
export const SettingsPage = () => {
  const { user, logout } = useAuth();

  const tabs = [
    {
      value: 'profile',
      label: 'Hồ sơ cá nhân',
      content: <ProfileTab user={user} />,
    },
    {
      value: 'security',
      label: 'Bảo mật & Mật khẩu',
      content: <PasswordTab />,
    },
  ];

  return (
    <div className={styles.page}>
      {/* ── Gradient hero ── */}
      <div className={styles.hero}>
        <div className={styles.blob} />
        <Stack direction="row" align="center" justify="space-between" style={{ position: 'relative' }}>
          <Stack gap="xs">
            <Text as="p" size="xs" weight="medium"
              style={{ margin: 0, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Tài khoản
            </Text>
            <Text as="h1" weight="bold"
              style={{
                margin: 0, color: '#fff',
                fontSize: '1.5rem', letterSpacing: '-0.3px',
                fontFamily: 'var(--font-family-base)',
              }}>
              Cài đặt hệ thống
            </Text>
          </Stack>
          <button className={styles.heroBtn} onClick={logout}>
            Đăng xuất
          </button>
        </Stack>
      </div>

      {/* ── Tab content ── */}
      <div className={styles.content}>
        <Tabs defaultValue="profile" tabs={tabs} />
      </div>
    </div>
  );
};
