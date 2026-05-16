/**
 * AdminStudentDetail.jsx — Individual student progress (redesigned)
 * Sprint 3: đọc bài đã giao từ class_assignments_{classId} (localStorage)
 * join với localAssignments_course-lop{gradeLevel} để lấy chi tiết bài.
 */
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ClipboardList, CheckCircle,
  TrendingUp, CheckCircle2, Award, RefreshCw,
  Phone, Mail, BookOpen, Calendar, AlertCircle,
} from 'lucide-react';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { calculate10PointScore } from '../../data/homeworkData';
import styles from './AdminStudentDetail.module.css';

/* ── localStorage helpers ── */
function readClassAssignmentRecords(classId) {
  try {
    const s = localStorage.getItem(`class_assignments_${classId}`);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function readCourseContent(gradeLevel) {
  try {
    if (!gradeLevel) return [];
    const s = localStorage.getItem(`localAssignments_course-lop${gradeLevel}`);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

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
  ['#dbeafe', '#1d4ed8'],
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

  const { classes, students } = useUserManagement();

  const student = students.find(s => s.id === studentId);
  if (!student) return <div className={styles.page}>Không tìm thấy học viên.</div>;

  /* ── Class info ── */
  const cls = classes.find(c => c.id === student.classId);

  /* ── Build assignment list từ localStorage Sprint 2 ── */
  const rows = useMemo(() => {
    const classId    = student.classId;
    const gradeLevel = cls?.gradeLevel;

    if (!classId) return [];

    // 1. Đọc danh sách bài đã giao cho lớp
    const assignmentRecords = readClassAssignmentRecords(classId);
    if (assignmentRecords.length === 0) return [];

    // 2. Đọc nội dung bài từ course-level
    const courseContent = readCourseContent(gradeLevel);
    const contentMap   = {};
    courseContent.forEach(a => { contentMap[a.id] = a; });

    // 3. Đọc submissions thực của học sinh từ localStorage
    const studentSubs = (() => {
      try {
        const raw = localStorage.getItem(`hw_submissions_${student.id}`);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })();
    // Group by assignmentId — lấy lần nộp tốt nhất (điểm cao nhất)
    const subMap = {};
    studentSubs.forEach(sub => {
      const cur = subMap[sub.assignmentId];
      if (!cur || (sub.score ?? 0) >= (cur.score ?? 0)) {
        subMap[sub.assignmentId] = sub;
      }
    });

    // 4. Join records với content + submission
    return assignmentRecords.map(record => {
      const content = contentMap[record.assignmentId];
      const sub     = subMap[record.assignmentId] ?? null;
      const allSubsForThis = studentSubs.filter(s => s.assignmentId === record.assignmentId);

      // Tính điểm hệ 10 đúng cách (giống trang học viên)
      let score10 = null;
      if (sub && content) {
        if (sub.gradedByTeacher && sub.score !== undefined) {
          score10 = sub.score;
        } else {
          const info = calculate10PointScore(content, sub.answers ?? [], sub);
          score10 = info.finalScore;
        }
      }

      return {
        id:          record.assignmentId,
        title:       content?.title ?? record.assignmentName ?? '—',
        type:        content?.isTest ? 'test' : 'exercise',
        unitName:    record.unitName ?? '—',
        deadline:    record.deadline ?? null,
        assignedAt:  record.assignedAt ?? null,
        isUnit:      record.isUnit ?? false,
        submitted:   !!sub,
        score:       sub?.score ?? null,
        score10,
        attempts:    allSubsForThis.length,
        submittedAt: sub?.submittedAt ?? null,
      };
    }).sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  }, [student, cls]);

  /* ── Stats ── */
  const submittedRows = rows.filter(r => r.submitted);
  const scores10 = submittedRows.map(r => r.score10).filter(s => s !== null);
  const avg  = scores10.length ? (scores10.reduce((a, b) => a + b, 0) / scores10.length).toFixed(1) : null;
  const best = scores10.length ? Math.max(...scores10) : null;
  const retries = submittedRows.filter(r => r.attempts > 1).length;
  const pct = rows.length > 0 ? Math.round((submittedRows.length / rows.length) * 100) : null;
  // pct === null có nghĩa là chưa được giao bài nào → hiển thị “—”

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
              {rows.length === 0 ? (
                <span className={styles.heroProgressPct} style={{ color: 'var(--color-text-tertiary)' }}>
                  Chưa giao bài
                </span>
              ) : (
                <span className={styles.heroProgressPct}>
                  {submittedRows.length}/{rows.length} bài · {pct}%
                </span>
              )}
            </div>
            <div className={styles.heroProgressBar}>
              <div
                className={styles.heroProgressFill}
                style={{ width: `${pct ?? 0}%` }}
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
            <p className={styles.statValue}>
              {rows.length === 0 ? '—' : `${submittedRows.length}/${rows.length}`}
            </p>
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

      {/* ── Bài tập được giao ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Bài tập được giao</h2>

        <div className={styles.tableWrap}>
          {/* Header */}
          <div className={styles.tableHeader}>
            <span>Unit</span>
            <span>Bài tập / Kiểm tra</span>
            <span>Loại</span>
            <span>Hạn nộp</span>
            <span>Điểm</span>
            <span>Trạng thái</span>
          </div>

          {rows.length === 0 && (
            <div className={styles.empty}>
              Học viên chưa được giao bài nào.{cls && ` Giao bài cho lớp "${cls.name}" trong trang Khóa học.`}
            </div>
          )}

          {rows.map((row) => {
            const isOverdue = !row.submitted && row.deadline && new Date(row.deadline) < new Date();
            return (
              <div
                key={row.id}
                className={`${styles.tableRow} ${!row.submitted ? styles.rowUnsubmitted : ''}`}
              >
                {/* Unit */}
                <span className={styles.cellChapter}>
                  {row.isUnit ? (
                    <span style={{ fontSize: 11, background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                      Cả Unit
                    </span>
                  ) : row.unitName}
                </span>

                {/* Bài tập */}
                <div className={styles.cellHw}>
                  <div className={styles.hwTypeIcon}>
                    {row.type === 'test' ? <CheckCircle size={12} /> : <ClipboardList size={12} />}
                  </div>
                  <span className={styles.hwTitle}>{row.title}</span>
                </div>

                {/* Loại */}
                <span className={styles.cellScore}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: row.type === 'test' ? '#d1fae5' : '#f5f3ff',
                    color: row.type === 'test' ? '#059669' : '#7c3aed',
                    padding: '2px 10px', borderRadius: 20,
                  }}>
                    {row.type === 'test' ? 'Kiểm tra' : 'Bài tập'}
                  </span>
                </span>

                {/* Hạn nộp */}
                <span className={`${styles.cellDue} ${isOverdue ? styles.cellDueOverdue : ''}`}>
                  {row.deadline ? (
                    <><Calendar size={11} />{formatDate(row.deadline)}</>
                  ) : '—'}
                </span>

                {/* Điểm */}
                <span className={styles.cellScore}>
                  {row.submitted && row.score10 !== null ? (
                    <span style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: row.score10 >= 8 ? '#059669' : row.score10 >= 6 ? '#d97706' : '#dc2626',
                    }}>
                      {Number.isInteger(row.score10) ? row.score10 : row.score10.toFixed(1)}/10
                    </span>
                  ) : row.submitted ? (
                    <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>Chờ chấm</span>
                  ) : (
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>—</span>
                  )}
                </span>

                {/* Trạng thái */}
                <span className={styles.cellDate}>
                  {row.submitted ? (
                    <span style={{ color: '#059669', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} /> Đã nộp
                    </span>
                  ) : isOverdue ? (
                    <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={13} /> Quá hạn
                    </span>
                  ) : (
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

