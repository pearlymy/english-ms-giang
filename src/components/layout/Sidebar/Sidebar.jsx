import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList,
  Settings, BookOpen, GraduationCap, Users, UserCog, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTeacher } from '../../../contexts/TeacherContext';
import styles from './Sidebar.module.css';

const STUDENT_NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/app/homework',  icon: ClipboardList,   label: 'Bài tập'   },
  { to: '/app/settings',  icon: Settings,        label: 'Cài đặt'   },
];

const ADMIN_NAV = [
  { to: '/app/dashboard',  icon: LayoutDashboard, label: 'Tổng quan',  end: true },
  { to: '/app/courses',    icon: GraduationCap,   label: 'Khóa học',   isCourseMenu: true },
  { to: '/app/students',   icon: Users,           label: 'Học viên'    },
  { to: '/app/users',      icon: UserCog,         label: 'Người dùng'  },
  { to: '/app/settings',   icon: Settings,        label: 'Cài đặt'     },
];

// Bottom nav chỉ hiện các mục quan trọng nhất (tối đa 4)
const STUDENT_BOTTOM_NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/app/homework',  icon: ClipboardList,   label: 'Bài tập'   },
  { to: '/app/settings',  icon: Settings,        label: 'Cài đặt'   },
];

const ADMIN_BOTTOM_NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/app/courses',   icon: GraduationCap,   label: 'Khóa học'  },
  { to: '/app/students',  icon: Users,           label: 'Học viên'  },
  { to: '/app/settings',  icon: Settings,        label: 'Cài đặt'   },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const NAV = user?.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;
  const BOTTOM_NAV = user?.role === 'admin' ? ADMIN_BOTTOM_NAV : STUDENT_BOTTOM_NAV;

  const { courses } = useTeacher();
  
  const isCoursesActive = location.pathname.startsWith('/app/courses');
  const [isCoursesOpen, setIsCoursesOpen] = useState(isCoursesActive);

  useEffect(() => {
    if (isCoursesActive) {
      setIsCoursesOpen(true);
    }
  }, [isCoursesActive]);

  const courseGroups = useMemo(() => {
    if (!courses) return {};
    const groups = {};
    courses.forEach(c => {
      const g = c.classGroup || 'Khác';
      if (!groups[g]) groups[g] = [];
      groups[g].push(c);
    });
    Object.keys(groups).forEach(g => {
      groups[g].sort((a, b) => (a.gradeLevel || 0) - (b.gradeLevel || 0));
    });
    return groups;
  }, [courses]);

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
                  <div 
                    className={`${styles.item} ${isCoursesActive && !isCoursesOpen ? styles.itemActive : ''}`}
                    onClick={() => {
                      if (!isCoursesOpen) {
                        navigate(to);
                      }
                      setIsCoursesOpen(!isCoursesOpen);
                    }}
                  >
                    <Icon size={17} />
                    {label}
                    <ChevronRight size={14} className={`${styles.chevron} ${isCoursesOpen ? styles.chevronOpen : ''}`} />
                  </div>
                  {isCoursesOpen && (
                    <div className={styles.subMenuWrap}>
                      {['Cấp 1', 'Cấp 2', 'Khác'].flatMap(groupName => {
                        if (!courseGroups[groupName] || courseGroups[groupName].length === 0) return [];
                        const dotColor = groupName === 'Cấp 1' ? '#3b82f6' : groupName === 'Cấp 2' ? '#7c3aed' : '#64748b';
                        return courseGroups[groupName].map(c => (
                          <NavLink
                            key={c.id}
                            to={`/app/courses/${c.id}`}
                            className={({ isActive }) => `${styles.subItem} ${isActive ? styles.subItemActive : ''}`}
                          >
                            <span className={styles.subItemDot} style={{ background: dotColor }} />
                            {c.name.includes('Lớp') ? `Lớp ${c.gradeLevel}` : c.name}
                          </NavLink>
                        ));
                      })}
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
