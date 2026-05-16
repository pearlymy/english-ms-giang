import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList,
  Settings, BookOpen, GraduationCap, Users, UserCog, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTeacher } from '../../../contexts/TeacherContext';
import { useUserManagement } from '../../../contexts/UserManagementContext';
import styles from './Sidebar.module.css';

const STUDENT_NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/app/homework', icon: ClipboardList, label: 'Bài tập' },
  { to: '/app/settings', icon: Settings, label: 'Cài đặt' },
];

const ADMIN_NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/app/courses', icon: GraduationCap, label: 'Khóa học', isCourseMenu: true },
  { to: '/app/students', icon: Users, label: 'Học viên' },
  { to: '/app/users', icon: UserCog, label: 'Người dùng' },
  { to: '/app/settings', icon: Settings, label: 'Cài đặt' },
];

const STUDENT_BOTTOM_NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/app/homework', icon: ClipboardList, label: 'Bài tập' },
  { to: '/app/settings', icon: Settings, label: 'Cài đặt' },
];

const ADMIN_BOTTOM_NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/app/courses', icon: GraduationCap, label: 'Khóa học' },
  { to: '/app/students', icon: Users, label: 'Học viên' },
  { to: '/app/settings', icon: Settings, label: 'Cài đặt' },
];

/* ── CourseNavItem: Link to a Course ─────────────────────── */
const CourseNavItem = ({ grade }) => {
  const isPrimary = grade <= 5;
  const dotColor = isPrimary ? '#3b82f6' : '#7c3aed';
  const dest = `/app/courses/course-lop${grade}`;

  return (
    <NavLink
      to={dest}
      className={({ isActive }) =>
        `${styles.gradeHeader} ${isActive ? styles.gradeHeaderOpen : ''}`
      }
      style={{ textDecoration: 'none', marginBottom: '2px' }}
    >
      <span className={styles.gradeHeaderDot} style={{ background: dotColor }} />
      <span className={styles.gradeHeaderLabel} style={{ fontWeight: 600 }}>
        Tiếng Anh Lớp {grade}
      </span>
    </NavLink>
  );
};

/* ── Sidebar ─────────────────────────────────────────────────────────── */
export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const NAV = user?.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;
  const BOTTOM_NAV = user?.role === 'admin' ? ADMIN_BOTTOM_NAV : STUDENT_BOTTOM_NAV;

  const { courses } = useTeacher();
  const { classes } = useUserManagement();

  const isCoursesActive = location.pathname.startsWith('/app/courses');
  const [isCoursesOpen, setIsCoursesOpen] = useState(isCoursesActive);

  useEffect(() => {
    if (isCoursesActive) setIsCoursesOpen(true);
  }, [isCoursesActive]);

  /* Nhóm classes theo gradeLevel, sắp xếp A→Z trong mỗi khối */
  const gradeGroups = useMemo(() => {
    if (!classes || classes.length === 0) return [];
    const map = new Map();
    classes.forEach(cls => {
      const g = cls.gradeLevel || 0;
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(cls);
    });
    map.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, 'vi')));
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([grade, clsList]) => ({ grade, clsList }));
  }, [classes]);

  /* Tìm grade đang active (từ URL) để auto-open đúng accordion */
  const activeGrade = useMemo(() => {
    if (!isCoursesActive) return null;
    const courseId = location.pathname.split('/app/courses/')[1];
    if (!courseId) return null;
    const activeClass = classes?.find(c => c.courseId === courseId);
    return activeClass?.gradeLevel ?? null;
  }, [location.pathname, classes, isCoursesActive]);

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className={styles.sidebar}>

        {/* ── Logo ── */}
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>
            <BookOpen size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span className={styles.logoText}>HG English</span>
        </div>

        {/* ── Nav ── */}
        <nav className={styles.nav}>
          {NAV.map(({ to, icon: Icon, label, end, isCourseMenu }) => {
            if (isCourseMenu) {
              return (
                <div key={to}>
                  {/* "Khóa học" top-level toggle */}
                  <div
                    className={`${styles.item} ${isCoursesActive && !isCoursesOpen ? styles.itemActive : ''}`}
                    onClick={() => {
                      if (!isCoursesOpen) navigate(to);
                      setIsCoursesOpen(v => !v);
                    }}
                  >
                    <Icon size={17} />
                    {label}
                    <ChevronRight
                      size={14}
                      className={`${styles.chevron} ${isCoursesOpen ? styles.chevronOpen : ''}`}
                    />
                  </div>

                  {/* List of courses derived from grade groups */}
                  {isCoursesOpen && (
                    <div className={styles.subMenuWrap}>
                      {gradeGroups.map(({ grade }) => (
                        <CourseNavItem
                          key={grade}
                          grade={grade}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `${styles.item} ${isActive ? styles.itemActive : ''}`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div className={styles.foot}>
          <NavLink
            to="/design-system"
            className={({ isActive }) =>
              `${styles.item} ${styles.itemSmall} ${isActive ? styles.itemActive : ''}`
            }
          >
            UI Kit
          </NavLink>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className={styles.bottomNav}>
        {BOTTOM_NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
            }
          >
            <Icon size={22} strokeWidth={isCoursesActive && to === '/app/courses' ? 2.5 : 2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};
