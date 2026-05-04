import React, { useState } from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card }   from '../../design-system/components/Card/Card';
import { Stack }  from '../../design-system/primitives/Stack';
import { Text }   from '../../design-system/primitives/Text';
import { useHomework } from '../../contexts/HomeworkContext';
import styles from './HomeworkResult.module.css';

/* ─────────────────────────────────────────────
   AnswerSection — unlocked detail view
   Handles the "Tất cả / Câu sai" filter toggle
───────────────────────────────────────────── */
const AnswerSection = ({ assignment, answers, score, total }) => {
  const [filter, setFilter] = useState('all');

  const wrongCount = total - score;

  /* Build indexed list then filter */
  const indexed = assignment.questions.map((q, i) => ({ q, i }));
  const displayed =
    filter === 'wrong'
      ? indexed.filter(({ q, i }) => answers[i] !== q.correctIdx)
      : indexed;

  return (
    <Stack gap="xl">

      {/* ── Header + filter bar ── */}
      <Stack direction="row" align="center" justify="space-between"
        style={{ paddingBottom: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>
        <Text as="h2" size="md" weight="semibold" color="textPrimary" style={{ margin: 0 }}>
          Chi tiết đáp án
        </Text>
        <div className={styles.filterBar}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({total})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'wrong' ? styles.filterActiveWrong : ''}`}
            onClick={() => setFilter('wrong')}
          >
            Câu sai ({wrongCount})
          </button>
        </div>
      </Stack>

      {/* ── Empty state when filtering wrong but all correct ── */}
      {filter === 'wrong' && wrongCount === 0 ? (
        <Card padding="lg" variant="outlined">
          <Stack align="center" gap="sm" style={{ padding: 'var(--spacing-lg) 0' }}>
            <Text as="p" size="sm" weight="semibold" color="textPrimary" style={{ margin: 0 }}>
              Tuyệt vời! Bạn không có câu nào sai.
            </Text>
            <Text as="p" size="xs" color="textSecondary" style={{ margin: 0 }}>
              Điểm {score}/{total} — hoàn hảo.
            </Text>
          </Stack>
        </Card>
      ) : (
        /* ── Question list — same visual style as AdminAssignmentOverview ── */
        <div className={styles.answerGroupCard}>
          <div className={styles.questionList}>
            {displayed.map(({ q, i }) => {
              const studentAns = answers[i];
              const isCorrect  = studentAns === q.correctIdx;

              return (
                <div key={q.id} className={styles.questionItem}>

                  {/* Question header: blue badge + text + Đúng/Sai tag */}
                  <div className={styles.questionHeader}>
                    <div className={styles.questionBadge}>{i + 1}</div>
                    <div className={styles.questionText}>
                      {(() => {
                        const lines = (q.text || '').split('\n');
                        return (
                          <>
                            <span>{lines[0]}</span>
                            {lines.slice(1).join('\n') && (
                              <span className={styles.qTextRestLines}>
                                {lines.slice(1).join('\n')}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <span className={isCorrect ? styles.resultTagCorrect : styles.resultTagWrong}>
                      {isCorrect ? 'Đúng' : 'Sai'}
                    </span>
                  </div>

                  {/* Options — 2-column grid */}
                  <div className={styles.optionsGrid}>
                    {q.options?.map((opt, idx) => {
                      const isStudentPick = studentAns === idx;
                      const isCorrectOpt  = q.correctIdx === idx;
                      return (
                        <div key={idx} className={`${styles.opt}
                          ${isCorrectOpt                   ? styles.optCorrect : ''}
                          ${isStudentPick && !isCorrectOpt ? styles.optWrong  : ''}
                        `}>
                          <span className={`${styles.optLetter}
                            ${isCorrectOpt                   ? styles.letterCorrect : ''}
                            ${isStudentPick && !isCorrectOpt ? styles.letterWrong   : ''}
                          `}>
                            {['A','B','C','D'][idx]}
                          </span>
                          <span className={styles.optText}>{opt}</span>
                          {isCorrectOpt && (
                            <CheckCircle size={15} className={styles.correctIcon} />
                          )}
                          {isStudentPick && !isCorrectOpt && (
                            <XCircle size={15} className={styles.wrongIcon} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation box */}
                  {q.explanation && (
                    <div className={styles.explanationBox}>
                      <Lightbulb size={15} className={styles.explanationIcon} />
                      <p className={styles.explanationText}>
                        <strong>Giải thích:</strong> {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Transcript — listening only ── */}
      {assignment.type === 'listening' && (
        <Stack gap="md">
          <Text as="h2" size="md" weight="semibold" color="textPrimary"
            style={{ margin: 0, paddingBottom: 'var(--spacing-sm)',
              borderBottom: '1px solid var(--color-border)' }}>
            Nội dung bài nghe
          </Text>
          <Text as="p" size="xs" color="textSecondary" style={{ margin: 0 }}>
            Đọc lại script để ôn tập sau khi nghe.
          </Text>

          {/* Single mode */}
          {(!assignment.audioMode || assignment.audioMode === 'single') && assignment.script && (
            <Card padding="md">
              <Stack gap="xs">
                {assignment.script.split('\n').map((line, i) => (
                  <Text key={i} as="p" size="sm" color="textPrimary"
                    style={{ margin: 0, lineHeight: 1.85 }}>
                    {line}
                  </Text>
                ))}
              </Stack>
            </Card>
          )}

          {/* Grouped mode */}
          {assignment.audioMode === 'grouped' && assignment.audioGroups?.map((group) => (
            <Card key={group.id} padding="md">
              <Stack gap="md">
                <Stack direction="row" align="center" justify="space-between">
                  <Text as="p" size="sm" weight="semibold" color="textPrimary"
                    style={{ margin: 0 }}>
                    {group.label}
                  </Text>
                  <Text as="span" size="xs" color="textSecondary">
                    Câu {group.questionIds.map((qid) => {
                      const idx = assignment.questions.findIndex(q => q.id === qid);
                      return idx + 1;
                    }).join(', ')}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  {group.script.split('\n').map((line, i) => (
                    <Text key={i} as="p" size="sm" color="textPrimary"
                      style={{ margin: 0, lineHeight: 1.85 }}>
                      {line}
                    </Text>
                  ))}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

    </Stack>
  );
};

/* ══════════════════════════════════════════
   HomeworkResult — page
══════════════════════════════════════════ */
export const HomeworkResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { assignments, getAttempts, canView } = useHomework();

  const assignment  = assignments.find((a) => a.id === id);
  const attempts    = getAttempts(id);
  const lastAttempt = attempts[attempts.length - 1];
  const unlocked    = canView(id);

  if (!assignment || !lastAttempt) {
    return (
      <div className={styles.page}>
        <Text as="p" color="textSecondary" style={{ margin: 0 }}>Không tìm thấy kết quả.</Text>
        <button className={styles.pillOutline} onClick={() => navigate('/app/homework')}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const { score, number: attemptNumber, answers } = lastAttempt;
  const total = assignment.questions?.length ?? 0;
  const pct   = total > 0 ? Math.round((score / total) * 100) : 0;

  const scoreMsg =
    score >= 9 ? 'Xuất sắc! Bạn nắm rất vững bài học.'
    : score >= 7 ? 'Khá tốt! Xem lại các câu sai để cải thiện.'
    : 'Hãy cố gắng hơn. Làm lại để mở khóa đáp án chi tiết.';

  return (
    <div className={styles.page}>

      {/* ── Score hero ── */}
      <div className={styles.hero}>
        <div className={styles.blob} />
        <Stack align="center" gap="md" style={{ position: 'relative' }}>
          <Text as="p" size="xs" weight="medium"
            style={{ margin: 0, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {assignment.title} · Lần {attemptNumber}
          </Text>
          <Stack direction="row" align="baseline" gap="xs">
            <Text weight="bold"
              style={{ color: '#fff', fontSize: '4rem', lineHeight: 1, fontFamily: 'var(--font-family-base)' }}>
              {score}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.5rem', fontFamily: 'var(--font-family-base)' }}>
              /{total}
            </Text>
          </Stack>
          <Text as="p" size="sm"
            style={{ margin: 0, color: 'rgba(255,255,255,0.8)', textAlign: 'center', maxWidth: 320 }}>
            {scoreMsg}
          </Text>
          <div className={styles.heroMeta}>
            <span className={styles.metaPill}>{pct}%</span>
            <span className={styles.metaPill}>{score} đúng</span>
            <span className={styles.metaPill}>{total - score} sai</span>
            <span className={`${styles.metaPill} ${unlocked ? styles.metaGreen : styles.metaMuted}`}>
              {unlocked ? 'Đáp án đã mở' : `Làm lại lần ${attemptNumber + 1} để mở khóa`}
            </span>
          </div>
        </Stack>
      </div>

      {/* ── Actions ── */}
      <Stack direction="row" gap="sm" style={{ flexWrap: 'wrap' }}>
        <button className={styles.pillOutline} onClick={() => navigate('/app/homework')}>
          Danh sách bài
        </button>
        {!unlocked && (
          <button className={styles.pillPrimary}
            onClick={() => navigate(`/app/homework/${id}/attempt`)}>
            Làm lại ngay
          </button>
        )}
      </Stack>

      {/* ── Unlocked: detail ── */}
      {unlocked ? (
        <AnswerSection
          assignment={assignment}
          answers={answers}
          score={score}
          total={total}
        />
      ) : (
        /* ── Locked state ── */
        <Card padding="lg" variant="outlined">
          <Stack align="center" gap="md" style={{ padding: 'var(--spacing-xl) 0' }}>
            <Text as="h3" size="md" weight="semibold" color="textPrimary" style={{ margin: 0 }}>
              Đáp án chưa được mở khóa
            </Text>
            <Text as="p" size="sm" color="textSecondary"
              style={{ margin: 0, textAlign: 'center', maxWidth: 380, lineHeight: 1.65 }}>
              {score >= 9
                ? 'Điểm của bạn đủ điều kiện. Tải lại trang để xem đáp án.'
                : `Làm lại lần ${attemptNumber + 1} để mở khóa đáp án và giải thích chi tiết.`}
            </Text>
            <button className={styles.pillPrimary}
              onClick={() => navigate(`/app/homework/${id}/attempt`)}>
              Làm lại ngay
            </button>
          </Stack>
        </Card>
      )}
    </div>
  );
};
