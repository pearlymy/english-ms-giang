/**
 * AdminGradingQueue.jsx — Modern premium redesign
 * Lists all students in a class for a specific assignment,
 * showing grading status and letting the teacher jump straight to grading.
 */
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle2, ClipboardList, Users, Zap, Eye,
} from 'lucide-react';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { calculate10PointScore, hasTeacherGradedQuestions } from '../../data/homeworkData';
import styles from './AdminGradingQueue.module.css';

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const getInitials = (n) =>
  n ? n.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?';

const AVATAR_COLORS = [
  ['#ede9fe', '#6d28d9'], ['#dcfce7', '#15803d'], ['#dbeafe', '#1d4ed8'],
  ['#cffafe', '#0e7490'], ['#fef9c3', '#b45309'], ['#e0e7ff', '#3730a3'],
  ['#fce7f3', '#9d174d'], ['#ffedd5', '#c2410c'],
];

function readClassRecs(classId) {
  try {
    const r = localStorage.getItem(`class_assignments_${classId}`);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

function readCourseContent(gradeLevel) {
  try {
    const r = localStorage.getItem(`localAssignments_course-lop${gradeLevel}`);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

export const AdminGradingQueue = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { classes, students } = useUserManagement();

  const cls = classes.find(c => c.id === classId);
  const classStudents = students.filter(s => s.classId === classId);

  const recs = readClassRecs(classId);
  const rec = recs.find(r => r.assignmentId === assignmentId);
  const courseContent = readCourseContent(cls?.gradeLevel);
  const assignmentDef = courseContent.find(a => a.id === assignmentId);
  const title = assignmentDef?.title ?? rec?.assignmentName ?? 'Bài tập';

  const rows = useMemo(() => {
    return classStudents.map((s, i) => {
      let subs = [];
      try {
        const raw = localStorage.getItem(`hw_submissions_${s.id}`);
        if (raw) subs = JSON.parse(raw).filter(sub => sub.assignmentId === assignmentId);
      } catch {}

      let bestSub = null;
      subs.forEach(sub => {
        if (!bestSub || (sub.score ?? 0) >= (bestSub.score ?? 0)) bestSub = sub;
      });

      const hasManual = hasTeacherGradedQuestions(assignmentDef);
      let needsGrading = false;
      let displayScore = null;
      if (bestSub) {
        if (hasManual && !bestSub.gradedByTeacher) needsGrading = true;
        else if (bestSub.score == null) needsGrading = true;

        if (assignmentDef && bestSub.answers) {
          const info = calculate10PointScore(assignmentDef, bestSub.answers, bestSub);
          displayScore = info.finalScore;
        } else if (bestSub.gradedByTeacher && bestSub.score != null) {
          displayScore = bestSub.score;
        }
      }

      return {
        ...s,
        index: i,
        submitted: !!bestSub,
        needsGrading,
        score: displayScore,
        attempts: subs.length,
        submittedAt: bestSub?.submittedAt,
      };
    }).sort((a, b) => {
      if (a.needsGrading && !b.needsGrading) return -1;
      if (!a.needsGrading && b.needsGrading) return 1;
      if (a.submitted && !b.submitted) return -1;
      if (!a.submitted && b.submitted) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [classStudents, assignmentId, assignmentDef]);

  const needsGradingCount = rows.filter(r => r.needsGrading).length;
  const submittedCount    = rows.filter(r => r.submitted).length;
  const gradedCount       = rows.filter(r => r.submitted && !r.needsGrading).length;

  return (
    <div className={styles.page}>

      {/* ── Back ── */}
      <button className={styles.backBtn} onClick={() => navigate('/app/dashboard')}>
        <ChevronLeft size={14} /> Quay lại Dashboard
      </button>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroDecor} />
        <div className={styles.heroDecor2} />
        <div className={styles.heroContent}>
          <p className={styles.heroBreadcrumb}>Chấm bài · {cls?.name ?? '—'}</p>
          <h1 className={styles.heroTitle}>{title}</h1>
          <div className={styles.heroMeta}>
            <span className={styles.heroPill}>
              <Users size={11} /> {classStudents.length} học viên
            </span>
            <span className={styles.heroPill}>
              <CheckCircle2 size={11} /> {submittedCount} đã nộp
            </span>
            <span className={styles.heroPill}>
              <Eye size={11} /> {gradedCount} đã chấm
            </span>
            {needsGradingCount > 0 && (
              <span className={`${styles.heroPill} ${styles.heroPillAlert}`}>
                <Zap size={11} /> {needsGradingCount} cần chấm ngay
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Student list card ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleIcon}>
            <ClipboardList size={14} />
          </div>
          <h2 className={styles.cardTitle}>Danh sách học viên</h2>
          {needsGradingCount > 0 && (
            <span className={styles.cardBadge}>
              <Zap size={10} /> {needsGradingCount} cần chấm
            </span>
          )}
        </div>

        <div className={styles.tableWrap}>
          <div className={styles.dataTable}>
            <div
              className={styles.dataHeader}
              style={{ gridTemplateColumns: '2fr 1.4fr 0.7fr 1fr 1fr 110px' }}
            >
              <span>Học viên</span>
              <span>Thời gian nộp</span>
              <span style={{ textAlign: 'center' }}>Lần nộp</span>
              <span style={{ textAlign: 'center' }}>Trạng thái</span>
              <span style={{ textAlign: 'center' }}>Điểm số</span>
              <span style={{ textAlign: 'center' }}>Thao tác</span>
            </div>

            {rows.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}><Users size={22} strokeWidth={1.5} /></div>
                <p className={styles.emptyTitle}>Không có học viên trong lớp này</p>
                <p className={styles.emptyDesc}>Thêm học viên vào lớp để bắt đầu chấm bài</p>
              </div>
            ) : rows.map(row => {
              const [bg, color] = AVATAR_COLORS[row.index % AVATAR_COLORS.length];

              let statusNode;
              if (!row.submitted) {
                statusNode = (
                  <span className={styles.statusBadge} style={{ background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
                    Chưa nộp
                  </span>
                );
              } else if (row.needsGrading) {
                statusNode = (
                  <span className={styles.statusBadge} style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                    Cần chấm
                  </span>
                );
              } else {
                statusNode = (
                  <span className={styles.statusBadge} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                    Đã chấm
                  </span>
                );
              }

              const scoreColor = row.needsGrading
                ? '#f59e0b'
                : row.score != null
                  ? (row.score >= 8 ? '#16a34a' : row.score >= 5 ? '#d97706' : '#dc2626')
                  : '#9ca3af';

              return (
                <div
                  key={row.id}
                  className={`${styles.dataRow} ${row.needsGrading ? styles.rowNeedsGrading : ''}`}
                  style={{ gridTemplateColumns: '2fr 1.4fr 0.7fr 1fr 1fr 110px' }}
                >
                  {/* Student */}
                  <div className={styles.studentInfo}>
                    <div className={styles.avatar} style={{ background: bg, color }}>
                      {getInitials(row.name)}
                    </div>
                    <span className={styles.studentName}>{row.name}</span>
                  </div>

                  {/* Submit time */}
                  <span className={styles.dataCell}>{fmtDate(row.submittedAt)}</span>

                  {/* Attempts */}
                  <span className={styles.dataCell} style={{ textAlign: 'center' }}>
                    {row.attempts > 0 ? (
                      <span className={styles.attemptBadge}>{row.attempts}</span>
                    ) : '—'}
                  </span>

                  {/* Status */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {statusNode}
                  </div>

                  {/* Score */}
                  <span className={styles.scoreCell} style={{ color: scoreColor }}>
                    {row.needsGrading
                      ? <span className={styles.pendingLabel}>Chờ chấm</span>
                      : row.score != null ? `${row.score}/10` : '—'}
                  </span>

                  {/* Action */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      className={`${styles.actionBtn} ${(!row.needsGrading && row.submitted) ? styles.actionBtnOutline : ''}`}
                      disabled={!row.submitted}
                      onClick={() => row.submitted && navigate(`/app/grading/${classId}/${assignmentId}/${row.id}`)}
                      title={!row.submitted ? 'Chưa nộp bài' : row.needsGrading ? 'Chấm bài ngay' : 'Xem lại bài'}
                    >
                      {row.needsGrading ? 'Chấm bài' : 'Xem'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
