import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card }   from '../../design-system/components/Card/Card';
import { Stack }  from '../../design-system/primitives/Stack';
import { Text }   from '../../design-system/primitives/Text';
import { useHomework } from '../../contexts/HomeworkContext';
import { calculate10PointScore, hasTeacherGradedQuestions } from '../../data/homeworkData';
import styles from './HomeworkResult.module.css';

/* ─────────────────────────────────────────────
   normalizeQuestion — same logic as HomeworkAttempt
   Converts optA/B/C/D + content (manual editor)
   to options[] + text that the UI expects
───────────────────────────────────────────── */
const normalizeQuestion = (q) => {
  if (!q) return q;

  // Luôn resolve text từ content/question nếu chưa có
  const text = q.text ?? q.content ?? q.question ?? '';

  // Nếu đã có options[] (từ file Excel/parser): bổ sung text + correctIndex còn thiếu
  if (Array.isArray(q.options) && q.options.length > 0) {
    return {
      ...q,
      text,
      correctIndex: q.correctIndex
        ?? (typeof q.detectedAnswer === 'string' && ['A','B','C','D'].includes(q.detectedAnswer)
          ? ['A','B','C','D'].indexOf(q.detectedAnswer)
          : ['A','B','C','D'].indexOf(q.answer) !== -1
            ? ['A','B','C','D'].indexOf(q.answer)
            : null),
    };
  }

  // Manual format: optA/optB/optC/optD + content
  const opts = [q.optA, q.optB, q.optC, q.optD].filter(Boolean);
  return {
    ...q,
    text,
    options: opts.length > 0 ? opts : null,
    correctIndex: q.correctIndex ?? (['A','B','C','D'].indexOf(q.answer) !== -1
      ? ['A','B','C','D'].indexOf(q.answer)
      : null),
  };
};

/**
 * normalizeAssignment — phải giống hệt HomeworkAttempt để index answers[] khớp questions[].
 * Flatten listening sub-questions thành câu riêng lẻ.
 */
const normalizeAssignment = (a) => {
  if (!a) return a;
  const flatQuestions = [];
  (a.questions ?? []).forEach(q => {
    if (q.type === 'listening' && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
      q.subQuestions.forEach((sq, idx) => {
        let options = null;
        if (sq.type === 'multiple_choice' && sq.options && typeof sq.options === 'object') {
          options = ['A','B','C','D']
            .map(l => sq.options[l] ? `${l}. ${sq.options[l]}` : null)
            .filter(Boolean);
        } else if (sq.type === 'true_false') {
          options = ['Đúng', 'Sai'];
        }
        flatQuestions.push({
          id: sq.id ?? `${q.id}_sq${idx}`,
          type: sq.type === 'fill_blank' ? 'fill_in' : sq.type,
          text: sq.content ?? sq.text ?? '',
          options,
          correctIndex: sq.answer
            ? (options
              ? options.findIndex(o => o.startsWith(sq.answer + '.') || o === sq.answer)
              : null)
            : null,
          answer: sq.answer ?? '',
          explanation: sq.explanation ?? '',
          audioUrl: q.audioUrl ?? null,
          audioFile: q.audioFile ?? null,
          contentType: 'audio',
          _listeningParentId: q.id,
          _listeningSubIdx: idx,
          _listeningLabel: q.content ?? `Bài nghe ${q.id}`,
        });
      });
    } else {
      flatQuestions.push(normalizeQuestion(q));
    }
  });
  return { ...a, questions: flatQuestions };
};

/* ── Question type classification (same as AdminGradingDetail) ── */
const TEACHER_GRADED_TYPES = new Set([
  'short_answer', 'writing', 'essay', 'text_answer', 'long_answer'
]);
const isTeacherGradedType = (q) => {
  if (!q) return false;
  const t = (q.type || q.questionType || '').toLowerCase();
  if (TEACHER_GRADED_TYPES.has(t)) return true;
  if (t === 'listening' || t === 'fill_in') return false;
  if (!Array.isArray(q.options) || q.options.length === 0) {
    const hasCorrect =
      q.correctIdx != null || q.correctIndex != null ||
      q.answer != null || q.detectedAnswer != null;
    return !hasCorrect;
  }
  return false;
};

/* ─────────────────────────────────────────────
   AnswerSection — unlocked detail view
   Handles the "Tất cả / Câu sai" filter toggle
───────────────────────────────────────────── */
const AnswerSection = ({ assignment, answers, score, total, attempt }) => {
  const [filter, setFilter] = useState('all');

  /* ── Compute per-question correctness once (reused for count + filter) ── */
  const checkCorrect = (q, studentAns) => {
    const t = (q.type || '').toLowerCase();
    if (t === 'short_answer' || t === 'likert' || t === 'writing' || t === 'essay' || t === 'text_answer' || t === 'long_answer') return null; // teacher graded
    if (t === 'matching') {
      const pairs = q.pairs ?? [];
      const obj = (typeof studentAns === 'object' && !Array.isArray(studentAns) && studentAns) ? studentAns : {};
      return pairs.length > 0 && pairs.every(p => obj[p.left] === p.right);
    }
    if (t === 'fill_blank' || t === 'fill_in') {
      const correctText = (q.detectedAnswer || q.answer || '').toString().trim().toLowerCase();
      return typeof studentAns === 'string' && studentAns.trim().toLowerCase() === correctText;
    }
    if (t === 'true_false') return studentAns === (q.detectedAnswer || q.answer);
    if (t === 'multiple_response') {
      const correctArr = Array.isArray(q.detectedAnswer) ? q.detectedAnswer : Array.isArray(q.answer) ? q.answer : [];
      const studentArr = Array.isArray(studentAns) ? studentAns : [];
      return correctArr.length === studentArr.length && correctArr.every(v => studentArr.includes(v));
    }
    if (t === 'ordering') {
      const correctArr = Array.isArray(q.orderItems) && q.orderItems.length > 0 ? q.orderItems : Array.isArray(q.detectedAnswer) ? q.detectedAnswer : [];
      const studentArr = Array.isArray(studentAns) ? studentAns : [];
      return correctArr.length === studentArr.length && correctArr.every((v, idx) => studentArr[idx] === v);
    }
    // default: multiple_choice index
    return studentAns === q._correctIdx;
  };

  /* Build indexed list — normalize each question first */
  const indexed = assignment.questions.map((q, i) => {
    const nq = normalizeQuestion(q);
    const _correctIdx =
      nq.correctIndex !== undefined && nq.correctIndex !== null ? nq.correctIndex
      : nq.correctIdx  !== undefined && nq.correctIdx  !== null ? nq.correctIdx
      : typeof nq.detectedAnswer === 'string' && ['A','B','C','D'].includes(nq.detectedAnswer)
        ? ['A','B','C','D'].indexOf(nq.detectedAnswer)
        : typeof nq.answer === 'string' && ['A','B','C','D'].includes(nq.answer)
          ? ['A','B','C','D'].indexOf(nq.answer)
          : null;
    return { q: { ...nq, _correctIdx }, i };
  });

  const wrongCount = indexed.filter(({ q, i }) => {
    const result = checkCorrect(q, answers[i]);
    return result === false; // null = teacher graded = not counted as wrong
  }).length;

  const displayed =
    filter === 'wrong'
      ? indexed.filter(({ q, i }) => checkCorrect(q, answers[i]) === false)
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
            Tất cả ({assignment.questions.length})
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
              let isCorrect = false;

              if (q.type === 'short_answer' || q.type === 'likert') {
                isCorrect = false; // Luôn hiển thị sai màu trắng/xám để báo chờ chấm
              } else if (q.type === 'matching') {
                const pairs = q.pairs ?? [];
                const studentObj = (typeof studentAns === 'object' && studentAns !== null && !Array.isArray(studentAns)) ? studentAns : {};
                isCorrect = pairs.length > 0 && pairs.every(p => studentObj[p.left] === p.right);
              } else if (q.type === 'fill_blank' || q.type === 'fill_in') {
                const correctText = q.detectedAnswer || q.answer || '';
                isCorrect = typeof studentAns === 'string' && typeof correctText === 'string' &&
                  studentAns.trim().toLowerCase() === correctText.trim().toLowerCase();
              } else if (q.type === 'true_false') {
                isCorrect = studentAns === (q.detectedAnswer || q.answer);
              } else if (q.type === 'multiple_response') {
                const correctArr = Array.isArray(q.detectedAnswer) ? q.detectedAnswer : Array.isArray(q.answer) ? q.answer : [];
                const studentArr = Array.isArray(studentAns) ? studentAns : [];
                isCorrect = correctArr.length === studentArr.length && correctArr.every(v => studentArr.includes(v));
              } else if (q.type === 'ordering') {
                const correctArr = Array.isArray(q.orderItems) && q.orderItems.length > 0 ? q.orderItems : Array.isArray(q.detectedAnswer) ? q.detectedAnswer : [];
                const studentArr = Array.isArray(studentAns) ? studentAns : [];
                isCorrect = correctArr.length === studentArr.length && correctArr.every((v, idx) => studentArr[idx] === v);
              } else {
                isCorrect = studentAns === q._correctIdx;
              }

              const isTeacherGraded = isTeacherGradedType(q);
              const qScore = attempt?.questionScores?.[i];
              const qComment = attempt?.questionComments?.[i];
              const isGraded = attempt?.gradedByTeacher && qScore !== undefined && qScore !== '';
              const maxQ = q.points ?? 1;

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
                    {isTeacherGraded ? (
                      isGraded ? (
                        <span className={styles.resultTagCorrect} style={{ background: '#dcfce7', color: '#166534', borderColor: '#86efac' }}>
                          {qScore} / {maxQ} đ
                        </span>
                      ) : (
                        <span className={styles.resultTagWrong} style={{ background: '#f3e8ff', color: '#7c3aed', borderColor: '#d8b4fe' }}>Chờ chấm</span>
                      )
                    ) : (
                      <span className={isCorrect ? styles.resultTagCorrect : styles.resultTagWrong}>
                        {isCorrect ? 'Đúng' : 'Sai'}
                      </span>
                    )}
                  </div>

                  {/* Answer rendering based on question type */}
                  <div className={styles.answerBlock}>
                    {(() => {
                      if (isTeacherGraded) {
                        return (
                          <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                            <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>Câu trả lời của bạn:</div>
                            <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                              {typeof studentAns === 'object' ? JSON.stringify(studentAns) : String(studentAns || 'Chưa trả lời')}
                            </div>
                            {isGraded ? (
                              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Điểm: {qScore} / {maxQ}</div>
                                {qComment && (
                                  <div style={{ fontSize: 13, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>
                                    " {qComment} "
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 8, fontWeight: 600 }}>
                                ⏳ Chờ giáo viên chấm điểm
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (q.type === 'matching') {
                        const pairs = q.pairs ?? [];
                        const studentObj = (typeof studentAns === 'object' && studentAns !== null && !Array.isArray(studentAns)) ? studentAns : {};
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {pairs.map((p, idx) => {
                              const sAns = studentObj[p.left] || '';
                              const isRight = sAns === p.right;
                              return (
                                <div key={idx} style={{ 
                                  display: 'flex', alignItems: 'center', padding: '10px 14px', borderRadius: 8,
                                  background: isRight ? '#ecfdf5' : '#fef2f2',
                                  border: `1.5px solid ${isRight ? '#6ee7b7' : '#fca5a5'}` 
                                }}>
                                  <span style={{ fontWeight: 600, color: '#334155', minWidth: 120 }}>{p.left}</span>
                                  <span style={{ margin: '0 12px', color: '#cbd5e1' }}>→</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ color: isRight ? '#059669' : '#dc2626', fontWeight: 600, fontSize: 14 }}>
                                      {sAns || '(Chưa nối)'} 
                                      {isRight ? <CheckCircle size={14} style={{ display: 'inline', marginLeft: 8, verticalAlign: 'middle' }}/>
                                               : <XCircle size={14} style={{ display: 'inline', marginLeft: 8, verticalAlign: 'middle' }}/>}
                                    </div>
                                    {!isRight && (
                                      <div style={{ fontSize: 13, color: '#059669', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <CheckCircle size={13} /> Đúng: <strong>{p.right}</strong>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      if (q.type === 'fill_blank' || q.type === 'fill_in') {
                        return (
                          <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <span style={{ fontSize: 13, color: '#475569', minWidth: 100 }}>Bạn điền:</span>
                              <strong style={{ fontSize: 14, color: isCorrect ? '#059669' : '#dc2626' }}>
                                {studentAns || '—'}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 13, color: '#475569', minWidth: 100 }}>Đáp án đúng:</span>
                              <strong style={{ fontSize: 14, color: '#059669' }}>
                                {q.detectedAnswer || q.answer || '—'}
                              </strong>
                            </div>
                          </div>
                        );
                      }

                      if (q.type === 'true_false') {
                        return (
                          <div style={{ display: 'flex', gap: 10 }}>
                            {['Đúng', 'Sai'].map(opt => {
                              const isStudentPick = studentAns === opt;
                              const isCorrectOpt = q.detectedAnswer === opt || q.answer === opt;
                              return (
                                <div key={opt} style={{
                                  flex: 1, padding: 10, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600,
                                  border: `1.5px solid ${isCorrectOpt ? '#6ee7b7' : isStudentPick ? '#fca5a5' : '#e2e8f0'}`,
                                  background: isCorrectOpt ? '#d1fae5' : isStudentPick ? '#fee2e2' : '#fff',
                                  color: isCorrectOpt ? '#065f46' : isStudentPick ? '#991b1b' : '#64748b'
                                }}>
                                  {opt}
                                  {isCorrectOpt && <CheckCircle size={14} style={{ display: 'inline', marginLeft: 6, verticalAlign: 'middle' }}/>}
                                  {isStudentPick && !isCorrectOpt && <XCircle size={14} style={{ display: 'inline', marginLeft: 6, verticalAlign: 'middle' }}/>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      if (q.type === 'multiple_response') {
                        const correctArr = Array.isArray(q.detectedAnswer) ? q.detectedAnswer : Array.isArray(q.answer) ? q.answer : [];
                        const studentArr = Array.isArray(studentAns) ? studentAns : [];
                        return (
                          <div className={styles.optionsGrid}>
                            {q.options?.map((opt, idx) => {
                              const letter = ['A','B','C','D','E'][idx];
                              const isStudentPick = studentArr.includes(letter);
                              const isCorrectOpt = correctArr.includes(letter);
                              return (
                                <div key={letter} className={`${styles.opt}
                                  ${isCorrectOpt                   ? styles.optCorrect : ''}
                                  ${isStudentPick && !isCorrectOpt ? styles.optWrong  : ''}
                                `}>
                                  <span className={`${styles.optLetter}
                                    ${isCorrectOpt                   ? styles.letterCorrect : ''}
                                    ${isStudentPick && !isCorrectOpt ? styles.letterWrong   : ''}
                                  `}>
                                    {letter}
                                  </span>
                                  <span className={styles.optText}>{opt}</span>
                                  {isCorrectOpt && <CheckCircle size={15} className={styles.correctIcon} />}
                                  {isStudentPick && !isCorrectOpt && <XCircle size={15} className={styles.wrongIcon} />}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      if (q.type === 'ordering') {
                        const correctArr = Array.isArray(q.orderItems) && q.orderItems.length > 0 
                          ? q.orderItems 
                          : Array.isArray(q.detectedAnswer) ? q.detectedAnswer : [];
                        const studentArr = Array.isArray(studentAns) ? studentAns : [];
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>Thứ tự của bạn:</div>
                            {studentArr.map((item, idx) => (
                              <div key={idx} style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
                                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                                {item}
                                {correctArr[idx] === item ? <CheckCircle size={15} color="#10b981" style={{ marginLeft: 'auto' }}/> : <XCircle size={15} color="#ef4444" style={{ marginLeft: 'auto' }}/>}
                              </div>
                            ))}
                            {!isCorrect && (
                              <>
                                <div style={{ fontSize: 13, color: '#059669', marginTop: 8, marginBottom: 4, fontWeight: 600 }}>Thứ tự đúng:</div>
                                {correctArr.map((item, idx) => (
                                  <div key={`corr-${idx}`} style={{ padding: '6px 12px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, fontSize: 13, color: '#065f46', display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700 }}>{idx + 1}.</span> {item}
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        );
                      }

                      // Default (multiple_choice or fallback)
                      return (
                        <div className={styles.optionsGrid}>
                          {q.options?.map((opt, idx) => {
                            const isStudentPick = studentAns === idx;
                            const isCorrectOpt  = q._correctIdx === idx;
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
                      );
                    })()}
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

      {attempt?.teacherFeedback && (
        <Card padding="md" variant="outlined" style={{ background: '#fdf4ff', borderColor: '#f5d0fe' }}>
          <Stack gap="sm">
            <Text as="p" size="sm" weight="semibold" color="textPrimary" style={{ margin: 0, color: '#86198f' }}>
              Nhận xét chung từ giáo viên:
            </Text>
            <Text as="p" size="sm" color="textSecondary" style={{ margin: 0, color: '#a21caf', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
              "{attempt.teacherFeedback}"
            </Text>
          </Stack>
        </Card>
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
  const { assignments, getAttempts, canView, getBestScore } = useHomework();

  const rawAssignment = assignments.find((a) => a.id === id);
  // PHẢI normalize giống HomeworkAttempt để index answers[] khớp questions[]
  const assignment  = normalizeAssignment(rawAssignment);
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

  // Dùng lần cuối để hiện chi tiết đáp án, nhưng tính điểm on the fly bằng luật mới nhất
  const { attemptNumber, answers } = lastAttempt;
  
  // Tính điểm theo luật mới nhất (hệ số 10)
  const currentScoreInfo = calculate10PointScore(assignment, answers, lastAttempt);
  const isPending = hasTeacherGradedQuestions(assignment) && !lastAttempt.gradedByTeacher;
  
  const score10 = isPending ? 'Chờ chấm' : currentScoreInfo.finalScore;
  
  const bestScore10 = Math.max(...attempts.map(att => {
    if (hasTeacherGradedQuestions(assignment) && !att.gradedByTeacher) return -1;
    return calculate10PointScore(assignment, att.answers, att).finalScore;
  }));

  const totalAuto = currentScoreInfo.numAutoQuestions;
  const correctAuto = currentScoreInfo.numCorrectAuto;
  const pct = totalAuto > 0 ? Math.round((correctAuto / totalAuto) * 100) : (isPending ? 0 : 100);
  // Số câu chờ giáo viên chấm
  const numTeacherGraded = (assignment.questions ?? []).filter(q => {
    const t = (q.type || '').toLowerCase();
    return ['short_answer','writing','essay','text_answer','long_answer'].includes(t);
  }).length;

  const scoreMsg = isPending
    ? 'Đang chờ giáo viên chấm phần tự luận.'
    : parseFloat(score10) >= 9 ? 'Xuất sắc! Bạn nắm rất vững bài học.'
    : parseFloat(score10) >= 7 ? 'Khá tốt! Xem lại các câu sai để cải thiện.'
    : currentScoreInfo.finalScore > 0 ? 'Hãy cố gắng hơn. Làm lại để mở khóa đáp án chi tiết.'
    : 'Chưa có điểm — hãy cố gắng thử lại để làm đúng ít nhất 1 câu nhé.';

  useEffect(() => {
    // Bắn pháo hoa nếu đạt điểm tuyệt đối
    if (!isPending && currentScoreInfo.finalScore === 10) {
      import('canvas-confetti').then((module) => {
        const confetti = module.default;
        
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#7c3aed', '#fcd34d', '#10b981']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#7c3aed', '#fcd34d', '#10b981']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      });
    }
  }, [isPending, currentScoreInfo.finalScore]);

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
              style={{ color: '#fff', fontSize: isPending ? '3rem' : '4rem', lineHeight: 1, fontFamily: 'var(--font-family-base)' }}>
              {score10}
            </Text>
            {!isPending && (
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.5rem', fontFamily: 'var(--font-family-base)' }}>
                /10
              </Text>
            )}
          </Stack>
          <Text as="p" size="sm"
            style={{ margin: 0, color: 'rgba(255,255,255,0.8)', textAlign: 'center', maxWidth: 320 }}>
            {scoreMsg}
          </Text>
          <div className={styles.heroMeta}>
            {isPending ? (
              <span className={styles.metaPill} style={{ background: 'rgba(167,139,250,0.25)', borderColor: 'rgba(167,139,250,0.4)' }}>
                {numTeacherGraded} chờ chấm
              </span>
            ) : (
              <span className={styles.metaPill}>{pct}% (Máy chấm)</span>
            )}
            <span className={styles.metaPill}>{correctAuto}/{totalAuto} đúng</span>
            <span className={styles.metaPill}>{totalAuto - correctAuto} sai</span>
            {attempts.length > 1 && bestScore10 >= 0 && (
              <span className={`${styles.metaPill} ${styles.metaGreen}`}>
                Tốt nhất: {bestScore10}/10
              </span>
            )}
            <span className={`${styles.metaPill} ${unlocked ? styles.metaGreen : styles.metaMuted}`}>
              {unlocked ? 'Đáp án đã mở' : `Làm lại lần ${attemptNumber + 1} để mở khóa`}
            </span>
          </div>
        </Stack>
      </div>

      {/* ── Attempt history ── */}
      {attempts.length > 0 && (
        <Card padding="md" variant="outlined">
          <Stack gap="sm">
            <Text as="p" size="xs" weight="semibold" color="textSecondary"
              style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Lịch sử làm bài
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {attempts.map((att) => {
                const info = calculate10PointScore(assignment, att.answers, att);
                const isAttPending = hasTeacherGradedQuestions(assignment) && !att.gradedByTeacher;
                const isCurrent = att.attemptNumber === attemptNumber;
                return (
                  <div key={att.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: isCurrent ? 'rgba(79,70,229,0.06)' : 'var(--color-surface-alt)',
                    border: `1px solid ${isCurrent ? 'rgba(79,70,229,0.2)' : 'var(--color-border)'}`,
                  }}>
                    <span style={{
                      minWidth: 24, height: 24, borderRadius: 6,
                      background: isCurrent ? 'var(--color-primary)' : '#e2e8f0',
                      color: isCurrent ? '#fff' : 'var(--color-text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      {att.attemptNumber}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 600 }}>
                      {isAttPending ? 'Chờ chấm' : `${info.finalScore}/10 điểm`}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      · {info.numCorrectAuto}/{info.numAutoQuestions} đúng
                    </span>
                    {!isAttPending && info.finalScore === bestScore10 && att.attemptNumber !== 1 && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>⭐ Tốt nhất</span>
                    )}
                    {isCurrent && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>← Lần này</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Stack>
        </Card>
      )}

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
          score={isPending ? 0 : currentScoreInfo.finalScore}
          total={totalAuto}
          attempt={lastAttempt}
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
              {(isPending ? false : currentScoreInfo.finalScore >= 9)
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
