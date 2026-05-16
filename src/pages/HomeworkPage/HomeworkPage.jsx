import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, Clock, AlertCircle,
  Headphones, Star, User, Calendar, AlarmClock,
} from 'lucide-react';
import { Tabs }       from '../../design-system/components/Tabs/Tabs';
import { Stack }      from '../../design-system/primitives/Stack';
import { Text }       from '../../design-system/primitives/Text';
import { useHomework } from '../../contexts/HomeworkContext';
import { hasTeacherGradedQuestions } from '../../data/homeworkData';
import styles from './HomeworkPage.module.css';

/* ── helpers ── */
const isOverdue = (d) => d && new Date(d) < new Date();
const fmtDate   = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const daysLeft  = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
};

/* map assignment type → display label */
const typeLabel = (a) => {
  if (a.type === 'listening') return 'Listening';
  if (a.type === 'test')      return 'Test';
  if (a.unitName)             return a.unitName;
  return 'Exercise';
};

/* ── type icon circle ── */
const TypeIcon = ({ a, status }) => {
  const isListen = a.type === 'listening';
  const isDone   = status === 'submitted';
  const overdue  = !isDone && isOverdue(a.dueDate);

  let cls = styles.iconCircleBlue;
  if (isDone)    cls = styles.iconCircleGreen;
  if (overdue)   cls = styles.iconCircleRed;

  return (
    <div className={`${styles.iconCircle} ${cls}`}>
      {isListen ? <Headphones size={20} /> : <BookOpen size={20} />}
    </div>
  );
};

/* ─────────────────────────────────────────────
   AssignRow — single homework row
───────────────────────────────────────────── */
const AssignRow = ({ a, status, best, attempts, unlocked, navigate }) => {
  const isPending = status === 'pending';
  const overdue   = isPending && isOverdue(a.dueDate);
  const days      = isPending ? daysLeft(a.dueDate) : null;
  const total     = a.questions?.length ?? 10;
  const answered  = isPending ? 0 : total; // simple: done = all answered
  const pct       = isPending ? 0 : 100;
  const hasScore  = best !== null && best !== undefined;
  
  const requiresTeacher = hasTeacherGradedQuestions(a);
  const lastAttempt = attempts?.[attempts.length - 1];
  const isTeacherGraded = lastAttempt?.gradedByTeacher === true && lastAttempt?.score !== undefined;
  const isFullyGraded = !requiresTeacher || isTeacherGraded;
  
  const bestScore10 = (hasScore)
    ? (typeof best === 'number' ? best.toFixed(1).replace(/\.0$/, '') : best)
    : 0;

  const goAttempt = (e) => { e.stopPropagation(); navigate(`/app/homework/${a.id}/attempt`); };
  const goResult  = (e) => { e.stopPropagation(); navigate(`/app/homework/${a.id}/result`); };

  return (
    <div className={`${styles.row} ${overdue ? styles.rowOverdue : ''}`}>

      {/* ── Left: icon ── */}
      <TypeIcon a={a} status={status} />

      {/* ── Center: info ── */}
      <div className={styles.rowBody}>
        {/* Title row */}
        <div className={styles.rowTitle}>
          <span>{a.title}</span>
          <span className={`${styles.typeTag} ${
            a.type === 'listening' ? styles.typeTagListen
            : a.type === 'test'   ? styles.typeTagTest
            : styles.typeTagRead
          }`}>
            {typeLabel(a)}
          </span>
        </div>

        {/* Meta row: teacher | date assigned | deadline/submitted */}
        <div className={styles.rowMeta}>
          <span className={styles.metaItem}>
            <User size={12} /> Giáo viên: Ms. Giang
          </span>
          {a.dueDate && (
            <>
              <span className={styles.metaDot} />
              <span className={styles.metaItem}>
                <Calendar size={12} /> Ngày giao: {fmtDate(a.assignedAt ?? a.dueDate)}
              </span>
              <span className={styles.metaDot} />
              <span className={`${styles.metaItem} ${overdue ? styles.metaRed : ''}`}>
                <AlarmClock size={12} />
                {isPending ? 'Hạn nộp:' : 'Ngày nộp:'} {fmtDate(a.dueDate)}
              </span>
            </>
          )}
        </div>

        {/* Progress bar — only for in-progress (partially answered) */}
        {!isPending && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.progressLabel}>{total}/{total} câu</span>
            <span className={styles.progressPct}>{pct}%</span>
          </div>
        )}
      </div>

      {/* ── Right: status + actions ── */}
      <div className={styles.rowAction}>
        {isPending ? (
          /* PENDING */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%', gap: 8, marginTop: 'auto', marginBottom: 'auto' }}>
            {overdue && (
              <span className={`${styles.statusBadge} ${styles.statusOverdue}`}>
                Quá hạn
              </span>
            )}
            <button className={`${styles.btn} ${overdue ? styles.btnDanger : styles.btnPrimary}`} onClick={goAttempt}>
              Làm ngay
            </button>
          </div>
        ) : hasScore && isFullyGraded ? (
          /* FULLY GRADED (Auto or Teacher) */
          <>
            <div className={styles.statusGraded}>
              <span className={styles.statusBadge} style={{ color: '#d97706', borderColor: '#fbbf24', background: '#fffbeb' }}>
                Đã chấm
              </span>
              <span className={styles.scoreRow}>
                <strong>{bestScore10}/10</strong> điểm
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className={`${styles.btn} ${styles.btnOutline}`} onClick={goResult}>
                Xem kết quả
              </button>
              {!unlocked && (
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={goAttempt}>
                  Làm lại
                </button>
              )}
            </div>
          </>
        ) : (
          /* SUBMITTED – waiting for teacher grading */
          <>
            <div className={styles.statusGraded}>
              <span className={styles.statusBadge} style={{ color: '#7c3aed', borderColor: '#d8b4fe', background: '#f3e8ff' }}>
                Chờ chấm
              </span>
              <span className={styles.scoreLabel}>Giáo viên đang chấm</span>
            </div>
            <button className={`${styles.btn} ${styles.btnOutline}`} onClick={goResult}>
              Xem bài đã nộp
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Empty state ── */
const Empty = ({ isPending }) => (
  <div className={styles.empty}>
    <div className={styles.emptyIcon}>
      {isPending ? <BookOpen size={28} /> : <CheckCircle2 size={28} />}
    </div>
    <Text as="p" size="sm" weight="semibold" color="textPrimary" style={{ margin: 0 }}>
      {isPending ? 'Không có bài tập nào chưa làm!' : 'Chưa có bài tập nào đã hoàn thành.'}
    </Text>
    <Text as="p" size="xs" color="textSecondary" style={{ margin: '4px 0 0' }}>
      {isPending ? '🎉 Tuyệt vời! Bạn đã hoàn thành tất cả bài tập.' : 'Hãy làm các bài tập chưa hoàn thành trước nhé.'}
    </Text>
  </div>
);

/* ── Tab content list ── */
const AssignList = ({ assignments, navigate, getStatus, getBestScore, getAttempts, canView }) => {
  if (assignments.length === 0) return <Empty isPending={assignments.length === 0} />;
  return (
    <Stack gap="sm">
      {assignments.map((a) => {
        const status = getStatus(a.id);
        return (
          <AssignRow
            key={a.id}
            a={a}
            status={status}
            best={getBestScore(a.id)}
            attempts={getAttempts(a.id)}
            unlocked={canView(a.id)}
            navigate={navigate}
          />
        );
      })}
    </Stack>
  );
};

/* ══════════════════════════════════════
   HomeworkPage
══════════════════════════════════════ */
export const HomeworkPage = () => {
  const { assignments, getStatus, getBestScore, getAttempts, canView } = useHomework();
  const navigate = useNavigate();

  const helpers  = { navigate, getStatus, getBestScore, getAttempts, canView };
  const pending  = assignments.filter((a) => getStatus(a.id) === 'pending');
  const done     = assignments.filter((a) => getStatus(a.id) === 'submitted');
  const overdueCount = pending.filter((a) => isOverdue(a.dueDate)).length;

  const tabs = [
    {
      value: 'pending',
      label: `Chưa làm (${pending.length})`,
      content: <AssignList assignments={pending} {...helpers} />,
    },
    {
      value: 'done',
      label: `Đã làm (${done.length})`,
      content: <AssignList assignments={done} {...helpers} />,
    },
  ];

  return (
    <div className={styles.page}>

      {/* ── Compact hero ── */}
      <div className={styles.hero}>
        <div className={styles.blob} />
        <Stack gap="xs" style={{ position: 'relative' }}>
          <Text as="p" size="xs" weight="medium"
            style={{ margin: 0, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Học sinh
          </Text>
          <Text as="h1" weight="bold"
            style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '-0.3px', fontFamily: 'var(--font-family-base)' }}>
            Bài tập về nhà
          </Text>
        </Stack>
        <div className={styles.heroMeta}>
          <span className={styles.metaPill}><BookOpen size={12} /> {assignments.length} bài tổng</span>
          <span className={`${styles.metaPill} ${pending.length > 0 ? styles.metaPillPending : ''}`}>
            <Clock size={12} /> {pending.length} chưa làm
          </span>
          <span className={`${styles.metaPill} ${done.length > 0 ? styles.metaPillDone : ''}`}>
            <CheckCircle2 size={12} /> {done.length} đã xong
          </span>
          {overdueCount > 0 && (
            <span className={`${styles.metaPill} ${styles.metaRed}`}>
              <AlertCircle size={12} /> {overdueCount} quá hạn
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="pending" tabs={tabs} />
    </div>
  );
};
