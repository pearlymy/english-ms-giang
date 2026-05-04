/**
 * AdminStudentDetail.jsx — Individual student progress (redesigned)
 * - Hero gradient with full student info
 * - 4 stat cards
 * - Assignment table: Chương | Bài tập | Điểm | Số lần | Hạn nộp | Ngày nộp
 *   sorted by dueDate desc; submitted rows first grouped logically
 */
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ClipboardList, Headphones,
  TrendingUp, CheckCircle2, Award, RefreshCw,
  Phone, Mail, BookOpen, Calendar,
} from 'lucide-react';
import { useTeacher } from '../../contexts/TeacherContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import styles from './AdminStudentDetail.module.css';

/* ── helpers ─────────────────────────────────────────────── */
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const getInitials = (name) =>
  name ? name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?';

const AVATAR_COLORS = [
  ['var(--brand-100)', 'var(--brand-700)'],
  ['#ede9fe', '#6d28d9'],
  ['#dcfce7', '#15803d'],
  ['#fce7f3', '#9d174d'],
];

const scoreColor = (s) =>
  s >= 8 ? 'var(--color-success)'
  : s >= 6 ? 'var(--color-warning)'
  : 'var(--color-error)';

/* ════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════ */
export const AdminStudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const {
    assignments, chapters,
    getStudentProgress,
  } = useTeacher();
  const { classes, students } = useUserManagement();

  const student = students.find(s => s.id === studentId);
  if (!student) return <div className={styles.page}>Không tìm thấy học viên.</div>;

  const progress = getStudentProgress(studentId); // { hwId: { score, attempts, submittedAt } }

  /* ── Class info ── */
  const cls = classes.find(c => c.id === student.classId);

  /* ── Build full assignment list from enrolled courses ── */
  const rows = useMemo(() => {
    // All assignments that have been explicitly assigned to the student's class
    const courseAssignments = assignments.filter(a => 
      a.assignedClassIds?.includes(student.classId)
    );

    return courseAssignments.map(hw => {
      const chapter = chapters.find(c => c.id === hw.chapterId);
      const prog = progress[hw.id];
      return {
        hw,
        chapterName: chapter?.name ?? '—',
        submitted: !!prog,
        score: prog?.score ?? null,
        attempts: prog?.attempts ?? 0,
        submittedAt: prog?.submittedAt ?? null,
        dueDate: hw.dueDate ?? null,
      };
    }).sort((a, b) => {
      // Sort: submitted rows by submittedAt desc; unsubmitted by dueDate desc
      if (a.submitted && b.submitted) {
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      }
      if (!a.submitted && !b.submitted) {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate) - new Date(a.dueDate);
      }
      // Submitted first
      return a.submitted ? -1 : 1;
    });
  }, [student, assignments, chapters, progress]);

  /* ── Stats ── */
  const submittedRows = rows.filter(r => r.submitted);
  const scores = submittedRows.map(r => r.score).filter(s => s !== null);
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const best = scores.length ? Math.max(...scores) : null;
  const retries = submittedRows.filter(r => r.attempts > 1).length;
  const pct = rows.length > 0 ? Math.round((submittedRows.length / rows.length) * 100) : 0;

  const initials = getInitials(student.name);
  const [avatarBg, avatarColor] = AVATAR_COLORS[students.indexOf(student) % AVATAR_COLORS.length];

  return (
    <div className={styles.page}>

      {/* ── Back button ── */}
      <button className={styles.backBtn} onClick={() => navigate('/app/students')}>
        <ChevronLeft size={16} /> Danh sách học viên
      </button>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatarRing}>
            <div className={styles.avatarLg} style={{ background: avatarBg, color: avatarColor }}>
              {initials}
            </div>
          </div>
        </div>

        <div className={styles.heroInfo}>
          <div className={styles.heroTopRow}>
            <h1 className={styles.heroName}>{student.name}</h1>
            <span className={`${styles.statusBadge} ${student.isActive ? styles.statusActive : styles.statusInactive}`}>
              {student.isActive ? 'Đang học' : 'Không hoạt động'}
            </span>
          </div>
          <p className={styles.heroUsername}>{student.username}</p>

          <div className={styles.heroContacts}>
            {student.email && (
              <span className={styles.heroContact}><Mail size={12} />{student.email}</span>
            )}
            {student.phone && (
              <span className={styles.heroContact}><Phone size={12} />{student.phone}</span>
            )}
            {cls && (
              <span className={styles.heroContact}><BookOpen size={12} />{cls.name}</span>
            )}
          </div>

          {/* Progress bar */}
          <div className={styles.heroProgress}>
            <div className={styles.heroProgressLabel}>
              <span>Tiến độ hoàn thành</span>
              <span className={styles.heroProgressPct}>{submittedRows.length}/{rows.length} bài · {pct}%</span>
            </div>
            <div className={styles.heroProgressBar}>
              <div
                className={styles.heroProgressFill}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className={styles.statValue}>{submittedRows.length}/{rows.length}</p>
            <p className={styles.statLabel}>Bài đã nộp</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{
            background: avg ? `${scoreColor(parseFloat(avg))}22` : 'var(--color-surface-alt)',
            color: avg ? scoreColor(parseFloat(avg)) : 'var(--color-text-tertiary)',
          }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <p className={styles.statValue} style={{ color: avg ? scoreColor(parseFloat(avg)) : undefined }}>
              {avg ? `${avg}/10` : '—'}
            </p>
            <p className={styles.statLabel}>Điểm trung bình</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(234,179,8,0.12)', color: '#ca8a04' }}>
            <Award size={18} />
          </div>
          <div>
            <p className={styles.statValue}>{best !== null ? `${best}/10` : '—'}</p>
            <p className={styles.statLabel}>Điểm cao nhất</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <RefreshCw size={18} />
          </div>
          <div>
            <p className={styles.statValue}>{retries}</p>
            <p className={styles.statLabel}>Lần làm lại</p>
          </div>
        </div>
      </div>

      {/* ── History Table ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Lịch sử làm bài</h2>

        <div className={styles.tableWrap}>
          {/* Header */}
          <div className={styles.tableHeader}>
            <span>Chương</span>
            <span>Bài tập</span>
            <span>Điểm</span>
            <span>Số lần làm</span>
            <span>Hạn nộp</span>
            <span>Ngày nộp</span>
          </div>

          {rows.length === 0 && (
            <div className={styles.empty}>Học viên chưa được giao bài nào.</div>
          )}

          {rows.map(({ hw, chapterName, submitted, score, attempts, submittedAt, dueDate }) => {
            const isOverdue = !submitted && dueDate && new Date(dueDate) < new Date();
            return (
              <div
                key={hw.id}
                className={`${styles.tableRow} ${!submitted ? styles.rowUnsubmitted : ''}`}
              >
                {/* Chương */}
                <span className={styles.cellChapter}>{chapterName}</span>

                {/* Bài tập */}
                <div className={styles.cellHw}>
                  <div className={styles.hwTypeIcon}>
                    {hw.type === 'listening'
                      ? <Headphones size={12} />
                      : <ClipboardList size={12} />
                    }
                  </div>
                  <span className={styles.hwTitle}>{hw.title}</span>
                  {hw.status === 'draft' && <span className={styles.draftTag}>Nháp</span>}
                </div>

                {/* Điểm */}
                <span
                  className={styles.cellScore}
                  style={{ color: submitted && score !== null ? scoreColor(score) : 'var(--color-text-tertiary)' }}
                >
                  {submitted && score !== null ? `${score}/10` : '—'}
                </span>

                {/* Số lần làm */}
                <span className={styles.cellAttempts}>
                  {submitted ? (
                    <span className={`${styles.attemptsBadge} ${attempts > 1 ? styles.attemptsRetry : ''}`}>
                      {attempts} lần
                    </span>
                  ) : '—'}
                </span>

                {/* Hạn nộp */}
                <span className={`${styles.cellDue} ${isOverdue ? styles.cellDueOverdue : ''}`}>
                  {dueDate ? (
                    <><Calendar size={11} />{formatDate(dueDate)}</>
                  ) : '—'}
                </span>

                {/* Ngày nộp */}
                <span className={styles.cellDate}>
                  {submitted ? formatDate(submittedAt) : (
                    <span className={styles.notSubmitted}>Chưa nộp</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
