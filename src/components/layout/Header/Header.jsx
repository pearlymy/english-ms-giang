import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TextField } from '../../../design-system/components/TextField/TextField';
import { Avatar } from '../../../design-system/components/Avatar/Avatar';
import { NotificationBadge } from '../../../design-system/components/Badge/Badge';
import { Dropdown } from '../../../design-system/components/Dropdown/Dropdown';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Header.module.css';

const getPageTitle = (pathname) => {
  if (pathname === '/app/dashboard')                                   return 'Tổng quan';
  if (pathname === '/app/homework')                                    return 'Bài tập';
  if (pathname === '/app/settings')                                    return 'Cài đặt';
  if (pathname.startsWith('/app/homework') && pathname.endsWith('/attempt')) return 'Làm bài';
  if (pathname.startsWith('/app/homework'))                            return 'Xem đáp án';
  // Admin routes
  if (pathname === '/app/courses')                                     return 'Khóa học & Bài tập';
  if (pathname.endsWith('/new-assignment'))                            return 'Tạo bài tập mới';
  if (pathname.endsWith('/edit'))                                      return 'Chỉnh sửa bài tập';
  if (pathname.startsWith('/app/courses'))                             return 'Chi tiết khóa học';
  if (pathname === '/app/students')                                    return 'Danh sách học viên';
  if (pathname.startsWith('/app/students'))                            return 'Chi tiết học viên';
  if (pathname === '/app/users')                                       return 'Quản lý Người dùng';
  return '';
};

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title = getPageTitle(location.pathname);

  // Generate initials from name (e.g. "Hương Giang" → "HG")
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : '?';

  const userItems = [
    { label: `${user?.name ?? 'Người dùng'} (${user?.role === 'admin' ? 'Admin' : 'Học sinh'})`, onClick: () => {} },
    { type: 'separator' },
    { label: 'Cài đặt', onClick: () => navigate('/app/settings') },
    { type: 'separator' },
    { label: 'Đăng xuất', onClick: () => { logout(); navigate('/'); } },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <TextField placeholder="Search courses, users..." />
        </div>

        <div className={styles.actions}>
          <button className={styles.iconBtn}>
            <NotificationBadge dot>
              <Bell size={20} />
            </NotificationBadge>
          </button>

          <Dropdown 
            trigger={
              <button className={styles.iconBtn} style={{ padding: 0 }}>
              <Avatar fallback={initials} size="sm" />
              </button>
            }
            items={userItems}
          />
        </div>
      </div>
    </header>
  );
};
