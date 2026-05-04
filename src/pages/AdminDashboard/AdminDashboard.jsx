/**
 * AdminDashboard.jsx — Teacher overview page (redesigned)
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ClipboardList, TrendingUp,
  Clock, CheckCircle2, ArrowRight, BookOpen, Presentation
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacher } from '../../contexts/TeacherContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import styles from './AdminDashboard.module.css';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
};

const getInitials = (name) =>
  name ? name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?';

const scoreColor = (s) =>
  s >= 8 ? 'var(--color-success)'
  : s >= 6 ? 'var(--color-warning)'
  : 'var(--color-error)';

const scoreBgColor = (s) =>
  s >= 8 ? 'var(--color-success-subtle)'
  : s >= 6 ? 'var(--color-warning-subtle)'
  : 'var(--color-error-subtle)';

/* ── Component ────────────────────────────────────────────────────────────── */
export const AdminDashboard = () => {
  const { user } = useAuth();
  const { assignments, getStudentProgress } = useTeacher();
  const { classes, students } = useUserManagement();
  const navigate = useNavigate();

  const today = new Date();
  const todayStr = today.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  /* ── Stats ── */
  const activeStudents = students.filter(s => s.isActive);
  
  const classAvg = useMemo(() => {
    let totalScore = 0;
    let count = 0;
    students.forEach(s => {
      const prog = getStudentProgress(s.id);
      Object.values(prog).forEach(p => {
        if (p.score !== undefined && p.score !== null) {
          totalScore += p.score;
          count++;
        }
      });
    });
    return count > 0 ? (totalScore / count).toFixed(1) : '—';
  }, [students, getStudentProgress]);

  /* ── Upcoming due ── */
  const upcoming = useMemo(() => {
    return assignments
      .filter(a => a.dueDate && new Date(a.dueDate) >= today)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4)
      .map(a => {
        // Find how many students submitted this assignment
        let submitCount = 0;
        let totalAssigned = 0;
        
        // Simplification: assume assignment is for all students in its course
        const eligibleStudents = students.filter(s => s.enrolledCourseIds?.includes(a.courseId));
        totalAssigned = eligibleStudents.length;

        eligibleStudents.forEach(s => {
          const prog = getStudentProgress(s.id);
          if (prog[a.id]?.submittedAt) submitCount++;
        });

        return {
          ...a,
          submitted: submitCount,
          total: totalAssigned,
        };
      });
  }, [assignments, students, getStudentProgress, today]);

  /* ── Recent submissions ── */
  const recentSubs = useMemo(() => {
    const list = [];
    students.forEach(s => {
      const prog = getStudentProgress(s.id) || {};
      Object.entries(prog).forEach(([hwId, data]) => {
        const assignment = assignments.find(a => a.id === hwId);
        if (assignment && data.submittedAt) {
          list.push({
            student: s,
            assignment,
            score: data.score,
            submittedAt: data.submittedAt,
          });
        }
      });
    });
    return list
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 5);
  }, [students, assignments, getStudentProgress]);

  const STATS = [
    { icon: Presentation, label: 'Lớp học',   value: classes.length,         color: 'var(--brand-500)' },
    { icon: Users,         label: 'Học viên',   value: activeStudents.length,  color: 'var(--color-primary)' },
    { icon: ClipboardList, label: 'Bài tập',    value: assignments.length,     color: 'var(--color-warning)' },
    { icon: TrendingUp,    label: 'Điểm TB',    value: classAvg !== '—' ? `${classAvg}/10` : '—', color: 'var(--color-success)' },
  ];

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroDate}>{todayStr}</p>
          <h1 className={styles.heroTitle}>Xin chào, {user?.name ?? 'cô'}! 👋</h1>
          <p className={styles.heroSub}>Đây là tổng quan lớp học hôm nay.</p>
        </div>
        <div className={styles.heroBadge}>
          <BookOpen size={48} strokeWidth={1.5} />
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className={styles.statsGrid}>
        {STATS.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: `${color}1a`, color }}>
              <Icon size={22} />
            </div>
            <div>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.bottomGrid}>

        {/* ── Upcoming ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Clock size={16} />
            <h2 className={styles.cardTitle}>Bài tập sắp đến hạn</h2>
          </div>
          <div className={styles.list}>
            {upcoming.length === 0 && (
              <p className={styles.empty}>Không có bài tập nào sắp đến hạn.</p>
            )}
            {upcoming.map(hw => {
              const pct = hw.total > 0 ? Math.round((hw.submitted / hw.total) * 100) : 0;
              return (
                <div key={hw.id} className={styles.upcomingItem}>
                  <div className={styles.upcomingMeta}>
                    <span className={styles.hwTitle}>{hw.title}</span>
                    <span className={styles.hwDue}>Hạn: {formatDate(hw.dueDate)}</span>
                  </div>
                  <div className={styles.upcomingRight}>
                    <span className={styles.submitCount}>
                      {hw.submitted}/{hw.total} học sinh
                    </span>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${pct}%`, background: pct === 100 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-primary)' : 'var(--color-warning)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className={styles.viewAll}
            onClick={() => navigate('/app/courses')}
          >
            Xem tất cả bài tập <ArrowRight size={14} />
          </button>
        </div>

        {/* ── Recent Submissions ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <CheckCircle2 size={16} />
            <h2 className={styles.cardTitle}>Nộp bài gần đây</h2>
          </div>
          <div className={styles.list}>
            {recentSubs.length === 0 && (
              <p className={styles.empty}>Chưa có học viên nào nộp bài.</p>
            )}
            {recentSubs.map((sub, i) => {
              const sColor = scoreColor(sub.score);
              const sBgColor = scoreBgColor(sub.score);
              return (
                <div key={i} className={styles.subItem}>
                  <div
                    className={styles.subAvatar}
                    style={{ background: sBgColor, color: sColor }}
                  >
                    {getInitials(sub.student.name)}
                  </div>
                  <div className={styles.subMeta}>
                    <span className={styles.subName}>{sub.student.name}</span>
                    <span className={styles.subHw}>{sub.assignment.title}</span>
                  </div>
                  <div className={styles.subRight}>
                    <span className={styles.subScore} style={{ color: sColor }}>
                      {sub.score}/10
                    </span>
                    <span className={styles.subTime}>{timeAgo(sub.submittedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className={styles.viewAll}
            onClick={() => navigate('/app/students')}
          >
            Xem tất cả học viên <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};
