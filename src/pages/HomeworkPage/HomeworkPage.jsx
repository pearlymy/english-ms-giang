import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, Clock, AlertCircle, Headphones, ChevronRight } from 'lucide-react';
import { Tabs } from '../../design-system/components/Tabs/Tabs';
import { Stack } from '../../design-system/primitives/Stack';
import { Text }  from '../../design-system/primitives/Text';
import { useHomework } from '../../contexts/HomeworkContext';
import styles from './HomeworkPage.module.css';

/* ── helpers ── */
const isOverdue = (d) => d && new Date(d) < new Date();
const fmtDate   = (d) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const daysLeft = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
};

/* ── Single assignment card ── */
const AssignRow = ({ a, status, best, attempts, unlocked, navigate }) => {
  const isPending = status === 'pending';
  const overdue   = isPending && isOverdue(a.dueDate);
  const isListen  = a.type === 'listening';
  const days      = isPending ? daysLeft(a.dueDate) : null;

  const handleClick = () =>
    navigate(
      isPending
        ? `/app/homework/${a.id}/attempt`
        : `/app/homework/${a.id}/result`
    );

  return (
    <div
      className={`${styles.card} ${overdue ? styles.cardOverdue : ''} ${!isPending ? styles.cardDone : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Left accent */}
      <div className={`${styles.cardAccent} ${
        isPending ? (overdue ? styles.accentRed : styles.accentBlue) : styles.accentGreen
      }`} />

      {/* Type icon */}
      <div className={`${styles.typeIcon} ${
        isPending ? (overdue ? styles.typeIconRed : styles.typeIconBlue) : styles.typeIconGreen
      }`}>
        {isPending
          ? (overdue ? <AlertCircle size={18} /> : <Clock size={18} />)
          : <CheckCircle2 size={18} />}
      </div>

      {/* Content */}
      <div className={styles.cardContent}>
        <div className={styles.cardTitle}>
          {isListen && <Headphones size={14} className={styles.listenIcon} />}
          <span>{a.title}</span>
        </div>
        <div className={styles.cardMeta}>
          {isPending ? (
            overdue
              ? <span className={styles.metaTagRed}><AlertCircle size={11} /> Quá hạn</span>
              : days !== null && days <= 3
                ? <span className={styles.metaTagAmber}><Clock size={11} /> Còn {days} ngày</span>
                : <span className={styles.metaTagNeutral}><Clock size={11} /> Hạn nộp: {fmtDate(a.dueDate)}</span>
          ) : (
            <>
              <span className={styles.metaTagGreen}><CheckCircle2 size={11} /> Đã nộp</span>
              <span className={styles.metaDot} />
              <span>{best ?? 0}/10 điểm</span>
              <span className={styles.metaDot} />
              <span>{attempts.length} lần làm</span>
            </>
          )}
        </div>
      </div>

      {/* Action */}
      <div className={styles.cardAction}>
        {isPending ? (
          <span className={`${styles.actionBtn} ${overdue ? styles.actionBtnRed : styles.actionBtnPrimary}`}>
            Làm ngay <ChevronRight size={14} />
          </span>
        ) : unlocked ? (
          <span className={`${styles.actionBtn} ${styles.actionBtnGhost}`}>
            Xem đáp án <ChevronRight size={14} />
          </span>
        ) : (
          <span className={`${styles.actionBtn} ${styles.actionBtnOutline}`}>
            Làm lại <ChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  );
};

/* ── Empty state ── */
const Empty = ({ isPending }) => (
  <div className={styles.empty}>
    <div className={styles.emptyIcon}>
      {isPending ? <BookOpen size={32} /> : <CheckCircle2 size={32} />}
    </div>
    <Text as="p" size="sm" weight="semibold" color="textPrimary" style={{ margin: 0 }}>
      {isPending ? 'Không có bài tập nào chưa làm!' : 'Chưa có bài tập nào đã hoàn thành.'}
    </Text>
    <Text as="p" size="xs" color="textSecondary" style={{ margin: '4px 0 0' }}>
      {isPending ? '🎉 Tuyệt vời! Bạn đã hoàn thành tất cả bài tập.' : 'Hãy làm các bài tập chưa hoàn thành trước nhé.'}
    </Text>
  </div>
);

/* ── Assignment list for a tab ── */
const AssignList = ({ assignments, navigate, getStatus, getBestScore, getAttempts, canView, isPending }) => {
  if (assignments.length === 0) return <Empty isPending={isPending} />;

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

  const helpers = { navigate, getStatus, getBestScore, getAttempts, canView };

  const pending = assignments.filter((a) => getStatus(a.id) === 'pending');
  const done    = assignments.filter((a) => getStatus(a.id) === 'submitted');

  const overdueCount = pending.filter((a) => isOverdue(a.dueDate)).length;

  /* Only 2 tabs: Chuưa làm first, Đã làm second */
  const tabs = [
    {
      value: 'pending',
      label: `Chưa làm (${pending.length})`,
      content: <AssignList assignments={pending} {...helpers} isPending={true} />,
    },
    {
      value: 'done',
      label: `Đã làm (${done.length})`,
      content: <AssignList assignments={done} {...helpers} isPending={false} />,
    },
  ];

  return (
    <div className={styles.page}>

      {/* ── Gradient hero ── */}
      <div className={styles.hero}>
        <div className={styles.blob} />
        <Stack gap="xs" style={{ position: 'relative' }}>
          <Text as="p" size="xs" weight="medium"
            style={{ margin: 0, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Học sinh
          </Text>
          <Text as="h1" weight="bold"
            style={{
              margin: 0, color: '#fff',
              fontSize: '1.5rem', letterSpacing: '-0.3px',
              fontFamily: 'var(--font-family-base)',
            }}>
            Bài tập về nhà
          </Text>
        </Stack>
        <div className={styles.heroMeta}>
          <span className={styles.metaPill}>
            <BookOpen size={12} /> {assignments.length} bài tổng
          </span>
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

      {/* ── Tab list ── */}
      <Tabs defaultValue="pending" tabs={tabs} />
    </div>
  );
};
