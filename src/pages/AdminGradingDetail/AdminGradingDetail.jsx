/**
 * AdminGradingDetail.jsx
 * Trang chấm bài viết / tự luận cho giáo viên.
 * - Câu máy chấm: multiple_choice, true_false, fill_blank, matching, ordering, multiple_response
 * - Câu giáo viên chấm: short_answer, writing, essay, text_answer, và listening có câu viết
 */
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Save, CheckCircle2, AlertCircle, Clock, Pencil, Bot
} from 'lucide-react';
import { useUserManagement } from '../../contexts/UserManagementContext';
import styles from './AdminGradingDetail.module.css';

/* ── Normalize: flatten listening sub-questions (same as HomeworkAttempt) ── */
const normalizeQuestion = (q) => {
  if (!q) return q;
  const text = q.text ?? q.content ?? q.question ?? '';
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
          type: sq.type === 'fill_blank' ? 'fill_in' : (sq.type || 'listening'),
          text: sq.content ?? sq.text ?? '',
          options,
          correctIndex: sq.answer
            ? (options
                ? options.findIndex(o => o.startsWith(sq.answer + '.') || o === sq.answer)
                : null)
            : null,
          answer: sq.answer ?? '',
          detectedAnswer: sq.answer ?? '',
          explanation: sq.explanation ?? '',
          audioUrl: q.audioUrl ?? null,
          audioFile: q.audioFile ?? null,
          contentType: 'audio',
          _listeningParentId: q.id,
          _listeningLabel: q.content ?? `Bài nghe ${q.id}`,
          points: sq.points ?? q.points ?? 1,
        });
      });
    } else {
      flatQuestions.push(normalizeQuestion(q));
    }
  });
  return { ...a, questions: flatQuestions };
};

/* ── Question type classification ─────────────────────────────── */
const TEACHER_GRADED_TYPES = new Set([
  'short_answer', 'writing', 'essay', 'text_answer', 'long_answer'
]);

const isTeacherGraded = (q) => {
  if (!q) return false;
  const t = (q.type || q.questionType || '').toLowerCase();
  if (TEACHER_GRADED_TYPES.has(t)) return true;
  // listening với câu viết (không có options) cũng giáo viên chấm
  if (t === 'listening' || t === 'fill_in') return false;
  // nếu không có options và không có correctIdx => giáo viên chấm
  if (!Array.isArray(q.options) || q.options.length === 0) {
    const hasCorrect =
      q.correctIdx != null || q.correctIndex != null ||
      q.answer != null || q.detectedAnswer != null;
    return !hasCorrect;
  }
  return false;
};

/* ── Auto-grading helpers ──────────────────────────────────────── */
const resolveCorrectIdx = (q) => {
  if (q.correctIdx != null) return q.correctIdx;
  if (q.correctIndex != null) return q.correctIndex;
  if (typeof q.answer === 'string') {
    const idx = ['A', 'B', 'C', 'D'].indexOf(q.answer.toUpperCase());
    if (idx !== -1) return idx;
  }
  return null;
};

const checkAutoCorrect = (q, studentAns) => {
  const t = (q.type || '').toLowerCase();
  if (t === 'true_false') {
    return studentAns === (q.detectedAnswer ?? q.answer);
  }
  if (t === 'fill_blank' || t === 'fill_in') {
    const correct = (q.detectedAnswer ?? q.answer ?? '').toString().trim().toLowerCase();
    return typeof studentAns === 'string' && studentAns.trim().toLowerCase() === correct;
  }
  if (t === 'matching') {
    const pairs = q.pairs ?? [];
    if (!pairs.length) return false;
    const obj = (typeof studentAns === 'object' && !Array.isArray(studentAns) && studentAns) ? studentAns : {};
    return pairs.every(p => obj[p.left] === p.right);
  }
  if (t === 'ordering') {
    const correct = Array.isArray(q.orderItems) ? q.orderItems : (Array.isArray(q.detectedAnswer) ? q.detectedAnswer : []);
    const student = Array.isArray(studentAns) ? studentAns : [];
    return correct.length > 0 && correct.length === student.length && correct.every((v, i) => student[i] === v);
  }
  if (t === 'multiple_response') {
    const correctArr = Array.isArray(q.detectedAnswer) ? q.detectedAnswer : Array.isArray(q.answer) ? q.answer : [];
    const studentArr = Array.isArray(studentAns) ? studentAns : [];
    return correctArr.length === studentArr.length && correctArr.every(v => studentArr.includes(v));
  }
  // default: multiple_choice index
  const ci = resolveCorrectIdx(q);
  return ci !== null && studentAns === ci;
};

/* ── Render student answer (read-only) ────────────────────────── */
const renderStudentAnswer = (q, studentAns) => {
  const t = (q.type || '').toLowerCase();

  if (studentAns == null || studentAns === '') {
    return <span className={styles.noAnswer}>Không có câu trả lời</span>;
  }

  if (t === 'matching') {
    const pairs = q.pairs ?? [];
    const obj = (typeof studentAns === 'object' && !Array.isArray(studentAns) && studentAns) ? studentAns : {};
    return (
      <div className={styles.matchingDisplay}>
        {pairs.map(p => (
          <div key={p.left} className={`${styles.matchRow} ${obj[p.left] === p.right ? styles.matchCorrect : styles.matchWrong}`}>
            <span>{p.left}</span>
            <span className={styles.matchArrow}>→</span>
            <span>{obj[p.left] || '—'}</span>
            {obj[p.left] !== p.right && <span className={styles.matchCorrectHint}>✓ {p.right}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (t === 'ordering') {
    const arr = Array.isArray(studentAns) ? studentAns : [];
    return (
      <div className={styles.orderingDisplay}>
        {arr.map((item, i) => (
          <div key={i} className={styles.orderItem}>
            <span className={styles.orderNum}>{i + 1}</span>
            {item}
          </div>
        ))}
      </div>
    );
  }

  if (t === 'multiple_response') {
    const arr = Array.isArray(studentAns) ? studentAns : [];
    return <span className={styles.answerText}>{arr.join(', ') || '—'}</span>;
  }

  if (Array.isArray(q.options) && q.options.length > 0) {
    // Answer may be a numeric index OR a string (e.g. true_false: 'Đúng'/'Sai')
    if (typeof studentAns === 'number') {
      const letter = ['A', 'B', 'C', 'D'][studentAns] ?? '?';
      const optText = q.options[studentAns] ?? '';
      return <span className={styles.answerText}><strong>{letter}.</strong> {optText}</span>;
    }
    if (typeof studentAns === 'string') {
      // true_false: studentAns = 'Đúng' or 'Sai'
      return <span className={styles.answerText}>{studentAns}</span>;
    }
  }

  if (typeof studentAns === 'object') {
    return <pre className={styles.answerPre}>{JSON.stringify(studentAns, null, 2)}</pre>;
  }

  return <span className={styles.answerText}>{String(studentAns)}</span>;
};

/* ── Type label for display ───────────────────────────────────── */
const typeLabel = (q) => {
  const map = {
    multiple_choice: 'Trắc nghiệm', single_choice: 'Trắc nghiệm',
    multiple_response: 'Nhiều đáp án', true_false: 'Đúng/Sai',
    fill_blank: 'Điền từ', fill_in: 'Điền từ',
    matching: 'Nối đuôi', ordering: 'Sắp xếp',
    short_answer: 'Viết ngắn', writing: 'Viết', essay: 'Tự luận',
    text_answer: 'Tự luận', long_answer: 'Tự luận',
    listening: 'Nghe',
  };
  return map[(q.type || '').toLowerCase()] || q.type || 'Khác';
};

/* ══════════════════════════════════════════════════════════════
   AdminGradingDetail — main component
══════════════════════════════════════════════════════════════ */
export const AdminGradingDetail = () => {
  const { classId, assignmentId, studentId } = useParams();
  const navigate = useNavigate();
  const { students, classes } = useUserManagement();
  const student = students.find(s => s.id === studentId);

  /* ── Load assignment ── */
  const courseContent = useMemo(() => {
    try {
      const cls = classes.find(c => c.id === classId);
      if (!cls) return [];
      return JSON.parse(localStorage.getItem(`localAssignments_course-lop${cls.gradeLevel}`) || '[]');
    } catch { return []; }
  }, [classId, classes]);

  const assignment = useMemo(() => {
    const raw = courseContent.find(a => a.id === assignmentId);
    return normalizeAssignment(raw);
  }, [courseContent, assignmentId]);
  const questions = useMemo(() => assignment?.questions || [], [assignment]);

  /* ── Load student submission ── */
  const submissions = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(`hw_submissions_${studentId}`) || '[]'); }
    catch { return []; }
  }, [studentId]);

  const bestSubIndex = useMemo(() => {
    let bestIdx = -1, bestScore = -1;
    submissions.forEach((sub, i) => {
      if (sub.assignmentId === assignmentId && (sub.score ?? 0) >= bestScore) {
        bestScore = sub.score ?? 0;
        bestIdx = i;
      }
    });
    return bestIdx;
  }, [submissions, assignmentId]);

  const submission = bestSubIndex !== -1 ? submissions[bestSubIndex] : null;
  const answers = submission?.answers || [];

  /* ── Classify questions ── */
  const { autoQuestions, teacherQuestions } = useMemo(() => {
    const auto = [], teacher = [];
    questions.forEach((q, i) => {
      if (isTeacherGraded(q)) teacher.push(i);
      else auto.push(i);
    });
    return { autoQuestions: auto, teacherQuestions: teacher };
  }, [questions]);

  /* ── Auto-grade score ── */
  const { numAutoCorrect, autoMaxScore } = useMemo(() => {
    let correct = 0;
    autoQuestions.forEach(i => {
      if (checkAutoCorrect(questions[i], answers[i])) {
        correct++;
      }
    });
    return { numAutoCorrect: correct, autoMaxScore: 0 }; // We will calculate autoMaxScore after teacherTotal
  }, [autoQuestions, questions, answers]);

  /* ── Per-question teacher scores ── */
  const existingTeacherScores = useMemo(() => {
    const map = {};
    if (submission?.questionScores) {
      Object.assign(map, submission.questionScores);
    }
    return map;
  }, [submission]);

  const [questionScores, setQuestionScores] = useState(() => {
    const init = {};
    teacherQuestions.forEach(i => {
      init[i] = existingTeacherScores[i] ?? '';
    });
    return init;
  });

  const [questionComments, setQuestionComments] = useState(() => {
    const init = {};
    if (submission?.questionComments) Object.assign(init, submission.questionComments);
    return init;
  });

  const [generalFeedback, setGeneralFeedback] = useState(submission?.teacherFeedback || '');
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  /* ── Score calculations ── */
  const teacherTotal = useMemo(() => {
    return teacherQuestions.reduce((sum, i) => {
      const v = parseFloat(questionScores[i]);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
  }, [questionScores, teacherQuestions]);

  const totalTeacherBudget = useMemo(() =>
    teacherQuestions.reduce((s, i) => s + (questions[i]?.points ?? 0), 0),
    [teacherQuestions, questions]
  );

  const maxAutoScore = Math.max(0, 10 - totalTeacherBudget);
  const autoScorePerQuestion = autoQuestions.length > 0 ? maxAutoScore / autoQuestions.length : 0;
  const autoScore = numAutoCorrect * autoScorePerQuestion;

  const totalScore = autoScore + teacherTotal;
  const scaledScore = totalScore;

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    let currentTeacherTotal = 0;
    teacherQuestions.forEach(i => {
      const val = questionScores[i];
      if (val === '' || val === undefined) return; // empty = 0, OK
      const num = parseFloat(val);
      const maxForQ = questions[i]?.points ?? 10; // dùng điểm giới hạn của từng câu
      if (isNaN(num)) {
        errs[i] = 'Điểm không hợp lệ';
      } else if (num < 0) {
        errs[i] = 'Điểm không được âm';
      } else if (num > maxForQ) {
        errs[i] = `Tối đa ${maxForQ} điểm cho câu này`;
      } else {
        currentTeacherTotal += num;
      }
    });

    // Tổng điểm giáo viên không vượt tổng points đã thiết lập
    const maxTeacherTotal = teacherQuestions.reduce((s, i) => s + (questions[i]?.points ?? 0), 0);
    if (currentTeacherTotal > maxTeacherTotal) {
      errs.general = `Tổng điểm giáo viên không được vượt ${maxTeacherTotal} điểm`;
    }

    return errs;
  };

  /* ── Save ── */
  const handleSave = () => {
    if (bestSubIndex === -1) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const finalScore = Math.round(totalScore * 10) / 10;
    const finalScaled = Math.round(scaledScore * 10) / 10;
    const newSubs = [...submissions];
    newSubs[bestSubIndex] = {
      ...newSubs[bestSubIndex],
      score: finalScore,
      scaledScore: finalScaled,
      autoScore,
      teacherScore: teacherTotal,
      questionScores,
      questionComments,
      teacherFeedback: generalFeedback,
      gradedByTeacher: true,
      gradedAt: new Date().toISOString(),
    };
    localStorage.setItem(`hw_submissions_${studentId}`, JSON.stringify(newSubs));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!submission) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate(`/app/grading/${classId}/${assignmentId}`)}>
          <ChevronLeft size={16} /> Quay lại
        </button>
        <div className={styles.emptyState}>Không tìm thấy bài nộp của học viên này.</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Back */}
      <button className={styles.backBtn} onClick={() => navigate(`/app/grading/${classId}/${assignmentId}`)}>
        <ChevronLeft size={16} /> Quay lại danh sách
      </button>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Chấm bài: {student?.name}</h1>
          <p className={styles.subtitle}>
            {assignment?.title ?? '—'} · {autoQuestions.length} câu máy chấm · {teacherQuestions.length} câu giáo viên chấm
          </p>
        </div>
      </div>

      {/* Toast */}
      {saved && (
        <div className={styles.toast}>
          <CheckCircle2 size={16} /> Lưu kết quả chấm bài thành công!
        </div>
      )}

      <div className={styles.layout}>
        {/* ── Left: Question list ── */}
        <div className={styles.contentCol}>
          {questions.map((q, i) => {
            const isTeacher = isTeacherGraded(q);
            const studentAns = answers[i];
            const isAutoCorrect = !isTeacher && checkAutoCorrect(q, studentAns);
            const scoreVal = questionScores[i];
            const isGraded = isTeacher && (scoreVal !== '' && scoreVal !== undefined);
            const maxQ = q.points ?? 1;

            return (
              <div
                key={q.id || i}
                className={`${styles.qCard} ${isTeacher ? styles.qTeacher : styles.qAuto}`}
              >
                {/* Card header */}
                <div className={styles.qHeader}>
                  <div className={styles.qHeaderLeft}>
                    <span className={styles.qNum}>Câu {i + 1}</span>
                    <span className={styles.qTypeTag}>{typeLabel(q)}</span>
                  </div>
                  <div className={styles.qHeaderRight}>
                    {isTeacher && (
                      isGraded
                        ? <span className={styles.badgeDone}><CheckCircle2 size={12} /> Đã chấm</span>
                        : <span className={styles.badgeNeed}><Pencil size={12} /> Cần giáo viên chấm</span>
                    )}
                    {!isTeacher && (
                      isAutoCorrect
                        ? <span className={styles.badgeCorrect}><CheckCircle2 size={12} /> Đúng</span>
                        : <span className={styles.badgeWrong}><AlertCircle size={12} /> Sai</span>
                    )}
                  </div>
                </div>

                {/* Question text */}
                <p className={styles.qText}>{q.text || q.content || q.question || <em>Không có nội dung</em>}</p>

                {/* Show options — type-aware highlighting */}
                {!isTeacher && Array.isArray(q.options) && q.options.length > 0 && (() => {
                  const qType = (q.type || '').toLowerCase();
                  // --- multiple_response: studentAns = ['A','B',...] ---
                  if (qType === 'multiple_response') {
                    const studentArr = Array.isArray(studentAns) ? studentAns : [];
                    const correctArr = Array.isArray(q.detectedAnswer) ? q.detectedAnswer
                      : Array.isArray(q.answer) ? q.answer : [];
                    return (
                      <div className={styles.optionsList}>
                        {q.options.map((opt, optIdx) => {
                          const letter = ['A','B','C','D'][optIdx];
                          const isStudentPick = studentArr.includes(letter);
                          const isCorrectOpt = correctArr.includes(letter);
                          let cls = styles.optBase;
                          if (isCorrectOpt && isStudentPick) cls += ` ${styles.optCorrect}`;
                          else if (isCorrectOpt) cls += ` ${styles.optCorrect}`;
                          else if (isStudentPick) cls += ` ${styles.optWrong}`;
                          return (
                            <div key={optIdx} className={cls}>
                              <span className={styles.optLetter}>{letter}</span>
                              <span className={styles.optTextContent}>{typeof opt === 'object' ? JSON.stringify(opt) : String(opt)}</span>
                              {isStudentPick && <span className={styles.optChosen}>(Học viên chọn)</span>}
                              {isCorrectOpt && <span className={styles.optCorrectMark}>✓ Đúng</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  // --- true_false: studentAns = 'Đúng' | 'Sai' ---
                  if (qType === 'true_false') {
                    const correctOpt = q.detectedAnswer ?? q.answer ?? '';
                    return (
                      <div className={styles.optionsList}>
                        {q.options.map((opt, optIdx) => {
                          const optStr = String(opt);
                          const isStudentPick = studentAns === optStr;
                          const isCorrectOpt = correctOpt === optStr;
                          let cls = styles.optBase;
                          if (isCorrectOpt) cls += ` ${styles.optCorrect}`;
                          else if (isStudentPick) cls += ` ${styles.optWrong}`;
                          return (
                            <div key={optIdx} className={cls}>
                              <span className={styles.optLetter}>{['A','B'][optIdx] ?? optIdx}</span>
                              <span className={styles.optTextContent}>{optStr}</span>
                              {isStudentPick && <span className={styles.optChosen}>(Học viên chọn)</span>}
                              {isCorrectOpt && <span className={styles.optCorrectMark}>✓ Đúng</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  // --- default: multiple_choice — studentAns = index (number) ---
                  const ci = resolveCorrectIdx(q);
                  return (
                    <div className={styles.optionsList}>
                      {q.options.map((opt, optIdx) => {
                        const isStudentPick = studentAns === optIdx;
                        const isCorrectOpt = ci === optIdx;
                        let cls = styles.optBase;
                        if (isCorrectOpt) cls += ` ${styles.optCorrect}`;
                        else if (isStudentPick) cls += ` ${styles.optWrong}`;
                        return (
                          <div key={optIdx} className={cls}>
                            <span className={styles.optLetter}>{['A','B','C','D'][optIdx]}</span>
                            <span className={styles.optTextContent}>{typeof opt === 'object' ? JSON.stringify(opt) : String(opt)}</span>
                            {isStudentPick && <span className={styles.optChosen}>(Học viên chọn)</span>}
                            {isCorrectOpt && <span className={styles.optCorrectMark}>✓ Đúng</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Student answer box — only for teacher-graded or questions without options (matching/ordering/fill) */}
                {(isTeacher || !(Array.isArray(q.options) && q.options.length > 0)) && (
                  <div className={styles.studentAnswerBox}>
                    <div className={styles.studentAnswerLabel}>Câu trả lời của học viên:</div>
                    <div className={styles.studentAnswerContent}>
                      {renderStudentAnswer(q, studentAns)}
                    </div>
                  </div>
                )}

                {/* Teacher grading inputs */}
                {isTeacher && (
                  <div className={styles.teacherGradeArea}>
                    <div className={styles.scoreInputRow}>
                      <label className={styles.scoreLabel}>
                        Điểm
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4, fontWeight: 400 }}>
                          (tối đa {q.points ?? 10}đ)
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={q.points ?? 10}
                        step="0.5"
                        placeholder="0"
                        value={questionScores[i] ?? ''}
                        onChange={e => {
                          const maxQ = q.points ?? 10;
                          const raw = e.target.value;
                          const num = parseFloat(raw);
                          // Clamp ngay khi nhập
                          const clamped = !isNaN(num) && num > maxQ ? String(maxQ) : raw;
                          setQuestionScores(prev => ({ ...prev, [i]: clamped }));
                          setErrors(prev => { const n = { ...prev }; delete n[i]; return n; });
                        }}
                        className={`${styles.scoreInput} ${errors[i] ? styles.scoreInputError : ''}`}
                      />
                      {errors[i] && <span className={styles.errorMsg}>{errors[i]}</span>}
                    </div>
                    <div className={styles.commentRow}>
                      <label className={styles.commentLabel}>Nhận xét cho câu này</label>
                      <textarea
                        rows={2}
                        placeholder="Nhận xét (tuỳ chọn)..."
                        value={questionComments[i] ?? ''}
                        onChange={e => setQuestionComments(prev => ({ ...prev, [i]: e.target.value }))}
                        className={styles.commentInput}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Right: Grading panel ── */}
        <div className={styles.gradingCol}>
          <div className={styles.gradingPanel}>
            <h2 className={styles.panelTitle}>Chấm điểm & Nhận xét</h2>

            {/* Score breakdown */}
            <div className={styles.scoreBreakdown}>
              <div className={styles.scoreBreakdownRow}>
                <span className={styles.scoreBreakdownLabel}>
                  <Bot size={14} /> Điểm máy chấm
                </span>
                <strong className={styles.scoreBreakdownValue}>
                  {autoScore.toFixed(1)} / {maxAutoScore.toFixed(1)}
                </strong>
              </div>
              <div className={styles.scoreBreakdownRow}>
                <span className={styles.scoreBreakdownLabel}>
                  <Pencil size={14} /> Điểm giáo viên chấm
                </span>
                <strong className={styles.scoreBreakdownValue}>
                  {teacherTotal.toFixed(1)}
                </strong>
              </div>
              <div className={styles.scoreDivider} />
              <div className={`${styles.scoreBreakdownRow} ${styles.totalRow}`}>
                <span>Tổng điểm (Hệ số 10)</span>
                <strong className={styles.totalScore}>
                  {scaledScore.toFixed(1)} / 10
                </strong>
              </div>
            </div>

            {/* Pending indicator */}
            {teacherQuestions.some(i => questionScores[i] === '' || questionScores[i] === undefined) && (
              <div className={styles.pendingNote}>
                <Clock size={13} />
                {teacherQuestions.filter(i => questionScores[i] === '' || questionScores[i] === undefined).length} câu chưa được chấm
              </div>
            )}

            {/* General feedback */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Nhận xét chung của giáo viên</label>
              <textarea
                rows={5}
                value={generalFeedback}
                onChange={e => setGeneralFeedback(e.target.value)}
                placeholder="Nhập nhận xét chung để học sinh rút kinh nghiệm..."
                className={styles.feedbackInput}
              />
            </div>

            <button className={styles.savePanelBtn} onClick={handleSave}>
              <Save size={15} /> Lưu kết quả
            </button>

            {saved && (
              <p className={styles.savedNote}>✓ Đã lưu thành công!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
