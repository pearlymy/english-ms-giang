/**
 * homeworkData.js — Pure helper functions (no mock data)
 * Mock ASSIGNMENTS and SEED_PROGRESS đã được chuyển sang Supabase (Giai đoạn 3 & 4).
 */

/**
 * scoreAttempt — Score an attempt: compare answers array with correctIdx of each question.
 * assignment.questions phải có field `correctIdx` (từ Supabase: correct_idx mapped camelCase).
 */
export const scoreAttempt = (assignment, answers) => {
  let correct = 0;
  assignment.questions.forEach((q, i) => {
    if (answers[i] === q.correctIdx) correct++;
  });
  return correct;
};

/**
 * canViewAnswers — true if:
 *   any attempt scored >= 9, OR student has made >= 2 attempts
 */
export const canViewAnswers = (attempts = []) =>
  attempts.some((a) => a.score >= 9) || attempts.length >= 2;
