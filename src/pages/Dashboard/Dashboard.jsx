import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useHomework } from '../../contexts/HomeworkContext';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { Card } from '../../design-system/components/Card/Card';
import styles from './Dashboard.module.css';

/* ── helpers ── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};
const isOverdue = (d) => new Date(d) < new Date();
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

/* ── HwRow — clean, minimal ── */
const HwRow = ({ assignment, best, attempts, unlocked, isPending, navigate }) => {
  const overdue = isPending && isOverdue(assignment.dueDate);
  const scoreColor = best >= 9 ? '#059669' : best >= 7 ? '#d97706' : '#dc2626';

  const handleClick = () =>
    navigate(
      isPending
        ? `/app/homework/${assignment.id}/attempt`
        : `/app/homework/${assignment.id}`
    );

  return (
    <div className={styles.hwRow}>
      <div className={styles.hwInfo}>
        <Text as="p" size="sm" weight="semibold" color="textPrimary"
          style={{ margin: 0 }}>
          {assignment.title}
        </Text>
        <Text as="p" size="xs" color="textSecondary"
          style={{ margin: 0 }}>
          {isPending
            ? `${overdue ? '⚠️ Quá hạn' : 'Hạn'}: ${fmtDate(assignment.dueDate)}`
            : `${best}/10 điểm · ${attempts.length} lần làm`}
        </Text>
      </div>

      <button
        className={`${styles.pill} ${isPending ? styles.pillPrimary : unlocked ? styles.pillGhost : styles.pillOutline
          }`}
        onClick={handleClick}
      >
        {isPending ? 'Làm ngay' : unlocked ? 'Xem đáp án' : 'Làm lại'}
      </button>
    </div>
  );
};

/* ── PanelCard — clean section ── */
const PanelCard = ({ title, badge, empty, children }) => (
  <Card padding="lg">
    <Stack gap="md">
      <div className={styles.sectionHeader}>
        <Text as="h2" size="md" weight="semibold" color="textPrimary"
          style={{ margin: 0 }}>
          {title}
        </Text>
        {badge != null && badge > 0 && (
          <span className={styles.countBadge}>{badge}</span>
        )}
      </div>
      {children ?? (
        <Text as="p" size="sm" color="textSecondary"
          style={{ margin: 0, textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
          {empty}
        </Text>
      )}
    </Stack>
  </Card>
);

/* ══════════════════════════════════════════
   Dashboard
══════════════════════════════════════════ */
export const Dashboard = () => {
  const { user } = useAuth();
  const { assignments, stats, getStatus, getBestScore, getAttempts, canView } = useHomework();
  const navigate = useNavigate();

  const firstName = user?.name?.split(' ').pop() ?? 'bạn';

  const progressPct = stats.total
    ? Math.round((stats.done / stats.total) * 100) : 0;

  const dueSoon = assignments
    .filter((a) => getStatus(a.id) === 'pending' && !isOverdue(a.dueDate))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const overdue = assignments.filter(
    (a) => getStatus(a.id) === 'pending' && isOverdue(a.dueDate)
  );

  const recentDone = assignments
    .filter((a) => getStatus(a.id) === 'submitted')
    .slice(0, 5);

  return (
    <div className={styles.page}>

      {/* ── Hero gradient banner ── */}
      <div className={styles.hero}>
        {/* Decorative blobs */}
        <div className={styles.blob1} />
        <div className={styles.blob2} />

        <div className={styles.heroTop}>
          <Stack gap="xs">
            <Text as="p" size="sm" weight="medium"
              style={{ margin: 0, color: 'rgba(255,255,255,0.72)' }}>
              {getGreeting()}, {firstName}!
            </Text>
            <Text as="h1" weight="bold"
              style={{
                margin: 0,
                color: '#fff',
                fontSize: '1.75rem',
                letterSpacing: '-0.4px',
                fontFamily: 'var(--font-family-base)',
              }}>
              Tổng quan học tập
            </Text>
          </Stack>

          <button
            className={styles.heroBtn}
            onClick={() => navigate('/app/homework')}
          >
            Tất cả bài tập →
          </button>
        </div>

        {/* Inline stat strip */}
        <div className={styles.heroStats}>
          {[
            { num: stats.total, label: 'Tổng bài' },
            { num: stats.done, label: 'Đã xong' },
            { num: stats.pending, label: 'Chưa làm' },
            { num: stats.avgScore != null ? `${stats.avgScore}` : '—', label: 'Điểm TB' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className={styles.statDiv} />}
              <div className={styles.statItem}>
                <span className={styles.statNum}>{s.num}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Progress bar */}
        <div className={styles.heroProgress}>
          <div className={styles.heroFill} style={{ width: `${progressPct}%` }} />
        </div>
        <Text as="p" size="xs"
          style={{ margin: 0, color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
          {stats.done}/{stats.total} bài hoàn thành — {progressPct}%
        </Text>
      </div>

      {/* ── Two-column panels ── */}
      <div className={styles.panels}>

        {/* LEFT */}
        <Stack gap="lg">
          {overdue.length > 0 && (
            <PanelCard title="Quá hạn" badge={overdue.length}>
              <Stack gap="xs">
                {overdue.map((a) => (
                  <HwRow key={a.id} assignment={a} isPending
                    best={getBestScore(a.id)} attempts={getAttempts(a.id)}
                    unlocked={canView(a.id)} navigate={navigate}
                  />
                ))}
              </Stack>
            </PanelCard>
          )}

          <PanelCard
            title="Sắp đến hạn"
            badge={dueSoon.length}
            empty="Không có bài tập nào sắp đến hạn 🎉"
          >
            {dueSoon.length > 0 && (
              <Stack gap="xs">
                {dueSoon.map((a) => (
                  <HwRow key={a.id} assignment={a} isPending
                    best={getBestScore(a.id)} attempts={getAttempts(a.id)}
                    unlocked={canView(a.id)} navigate={navigate}
                  />
                ))}
              </Stack>
            )}
          </PanelCard>
        </Stack>

        {/* RIGHT */}
        <Stack gap="lg">
          <PanelCard
            title="Đã hoàn thành gần đây"
            empty="Chưa có bài nào được hoàn thành."
          >
            {recentDone.length > 0 && (
              <Stack gap="xs">
                {recentDone.map((a) => (
                  <HwRow key={a.id} assignment={a} isPending={false}
                    best={getBestScore(a.id)} attempts={getAttempts(a.id)}
                    unlocked={canView(a.id)} navigate={navigate}
                  />
                ))}
              </Stack>
            )}
          </PanelCard>
        </Stack>

      </div>
    </div>
  );
};
