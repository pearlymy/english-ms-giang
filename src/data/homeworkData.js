/**
 * homeworkData.js — Pure helper functions (no mock data)
 * Mock ASSIGNMENTS and SEED_PROGRESS đã được chuyển sang Supabase (Giai đoạn 3 & 4).
 */

/**
 * resolveCorrectIdx — lấy đáp án đúng (dạng số index 0-based) từ bất kỳ format câu hỏi nào:
 *   - correctIdx    (Supabase camelCase)
 *   - correctIndex  (manual editor local format)
 *   - answer: 'A'|'B'|'C'|'D'  (Excel upload format)
 */
const TEACHER_GRADED_TYPES = new Set([
  'short_answer', 'writing', 'essay', 'text_answer', 'long_answer'
]);

export const isTeacherGradedType = (q) => {
  if (!q) return false;
  const t = (q.type || q.questionType || '').toLowerCase();
  
  // Nếu đã có type rõ ràng, dựa hoàn toàn vào set TEACHER_GRADED_TYPES
  if (t) {
    return TEACHER_GRADED_TYPES.has(t);
  }

  // Fallback cho data cũ không có type: Nếu không có options và không có đáp án đúng -> giáo viên chấm
  if (!Array.isArray(q.options) || q.options.length === 0) {
    const hasCorrect =
      q.correctIdx != null || q.correctIndex != null ||
      q.answer != null || q.detectedAnswer != null;
    return !hasCorrect;
  }
  return false;
};

export const hasTeacherGradedQuestions = (assignment) => {
  if (!assignment || !Array.isArray(assignment.questions)) return false;
  return assignment.questions.some(isTeacherGradedType);
};

const resolveCorrectIdx = (q) => {
  if (q.correctIdx   !== undefined && q.correctIdx   !== null) return q.correctIdx;
  if (q.correctIndex !== undefined && q.correctIndex !== null) return q.correctIndex;
  // Excel upload format: detectedAnswer hoặc answer là chữ cái 'A'|'B'|'C'|'D'
  if (typeof q.detectedAnswer === 'string') {
    const idx = ['A', 'B', 'C', 'D'].indexOf(q.detectedAnswer.toUpperCase());
    if (idx !== -1) return idx;
  }
  if (typeof q.answer === 'string') {
    const idx = ['A', 'B', 'C', 'D'].indexOf(q.answer.toUpperCase());
    if (idx !== -1) return idx;
  }
  return null;
};

/**
 * scoreAttempt — so sánh answers[] với đáp án đúng của từng câu.
 * Hỗ trợ mọi format câu hỏi (Supabase, manual editor, Excel upload).
 */
export const scoreAttempt = (assignment, answers) => {
  let correct = 0;
  (assignment.questions ?? []).forEach((q, i) => {
    const studentAns = answers[i];
    if (studentAns === null || studentAns === undefined || studentAns === '') return;

    if (q.type === 'fill_blank' || q.type === 'fill_in') {
      const correctText = q.detectedAnswer || q.answer || '';
      if (typeof studentAns === 'string' && typeof correctText === 'string' &&
        studentAns.trim().toLowerCase() === correctText.trim().toLowerCase()) {
        correct += (q.points ?? 1);
      }
    } else if (q.type === 'true_false') {
      if (studentAns === (q.detectedAnswer || q.answer)) correct += (q.points ?? 1);
    } else if (q.type === 'multiple_response') {
      const correctArr = Array.isArray(q.detectedAnswer) ? q.detectedAnswer : Array.isArray(q.answer) ? q.answer : [];
      const studentArr = Array.isArray(studentAns) ? studentAns : [];
      if (correctArr.length === studentArr.length && correctArr.every(v => studentArr.includes(v))) {
        correct += (q.points ?? 1);
      }
    } else if (q.type === 'ordering') {
      const correctArr = Array.isArray(q.orderItems) && q.orderItems.length > 0 ? q.orderItems : Array.isArray(q.detectedAnswer) ? q.detectedAnswer : [];
      const studentArr = Array.isArray(studentAns) ? studentAns : [];
      if (correctArr.length === studentArr.length && correctArr.every((v, idx) => studentArr[idx] === v)) {
        correct += (q.points ?? 1);
      }
    } else if (q.type === 'matching') {
      const studentObj = (typeof studentAns === 'object' && studentAns !== null && !Array.isArray(studentAns)) ? studentAns : {};
      const pairs = q.pairs ?? [];
      if (pairs.length > 0 && pairs.every(p => studentObj[p.left] === p.right)) {
        correct += (q.points ?? 1);
      }
    } else if (q.type === 'short_answer' || q.type === 'likert') {
      // Teacher graded or survey types do not auto-score.
    } else {
      // Default (multiple_choice)
      const correctI = resolveCorrectIdx(q);
      if (correctI !== null && studentAns === correctI) correct += (q.points ?? 1);
    }
  });
  return correct;
};

export const checkAutoCorrect = (q, studentAns) => {
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
    const correct = Array.isArray(q.orderItems) && q.orderItems.length > 0 ? q.orderItems : (Array.isArray(q.detectedAnswer) ? q.detectedAnswer : []);
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

export const calculate10PointScore = (assignment, answers, attempt = null) => {
  let numAutoQuestions = 0;
  let numCorrectAuto = 0;
  let totalTeacherEntered = 0;
  let totalTeacherBudget = 0; // Tổng điểm tối đa giáo viên được phép chấm (từ q.points)

  (assignment.questions ?? []).forEach((q, i) => {
    if (isTeacherGradedType(q)) {
      const maxQ = q.points ?? 0;
      totalTeacherBudget += maxQ;
      if (attempt?.questionScores && attempt.questionScores[i] !== undefined && attempt.questionScores[i] !== '') {
        // Clamp điểm nhập không vượt q.points
        const entered = Math.min(maxQ, parseFloat(attempt.questionScores[i]) || 0);
        totalTeacherEntered += entered;
      }
    } else {
      numAutoQuestions++;
      if (checkAutoCorrect(q, answers[i])) {
        numCorrectAuto++;
      }
    }
  });

  // Điểm máy chấm tối đa = 10 - tổng budget giáo viên (không phụ thuộc vào điểm đã nhập)
  const maxAutoScore = Math.max(0, 10 - totalTeacherBudget);
  const autoScorePerQuestion = numAutoQuestions > 0 ? (maxAutoScore / numAutoQuestions) : 0;
  const actualAutoScore = numCorrectAuto * autoScorePerQuestion;
  const finalScore = actualAutoScore + totalTeacherEntered;

  return {
    finalScore: Math.min(10, Math.round(finalScore * 10) / 10),
    actualAutoScore: Math.round(actualAutoScore * 10) / 10,
    maxAutoScore,
    totalTeacherBudget,
    totalTeacherEntered,
    numCorrectAuto,
    numAutoQuestions
  };
};



/**
 * canViewAnswers — true if any of:
 *   1. Any attempt scored >= 9
 *   2. Student has made >= 2 attempts
 *   3. Assignment has teacher-graded questions AND all auto-graded questions correct in any attempt
 */
export const canViewAnswers = (attempts = [], assignment = null) => {
  if (attempts.some((a) => a.score >= 9)) return true;
  if (attempts.length >= 2) return true;

  // Điều kiện mới: bài có phần giáo viên chấm và phần máy chấm đạt tối đa
  if (assignment && hasTeacherGradedQuestions(assignment)) {
    return attempts.some((att) => {
      const info = calculate10PointScore(assignment, att.answers, att);
      // Máy chấm đạt tối đa = tất cả câu auto đều đúng
      return info.numAutoQuestions > 0 && info.numCorrectAuto === info.numAutoQuestions;
    });
  }

  return false;
};
