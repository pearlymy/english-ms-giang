import { supabase } from '../../lib/supabase';

/* ── Field mapping helpers ─────────────────────────────────────────────── */
const toApp = (row) => ({
  id: row.id,
  studentId: row.student_id,
  assignmentId: row.assignment_id,
  score: row.score,
  answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers,
  attemptNumber: row.attempt_number,
  submittedAt: row.submitted_at,
});

/* ── API ─────────────────────────────────────────────────────────────────── */
export const submissionApi = {

  /**
   * Lấy tất cả submissions của một học sinh.
   * Dùng trong HomeworkContext (student view).
   */
  async getSubmissionsByStudent(studentId) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: true });
    if (error) throw error;
    return data.map(toApp);
  },

  /**
   * Lấy tất cả submissions của một bài tập cụ thể.
   * Dùng trong TeacherContext để xem tiến độ lớp.
   */
  async getSubmissionsByAssignment(assignmentId) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: true });
    if (error) throw error;
    return data.map(toApp);
  },

  /**
   * Lấy submissions của tất cả học sinh trong danh sách (dùng cho admin).
   * studentIds: string[]
   */
  async getSubmissionsByStudents(studentIds) {
    if (!studentIds.length) return [];
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .in('student_id', studentIds)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data.map(toApp);
  },

  /**
   * Nộp bài: insert một submission mới.
   * Trả về submission đã được tạo (kèm id từ DB).
   */
  async submitAttempt({ studentId, assignmentId, score, answers, attemptNumber }) {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        student_id: studentId,
        assignment_id: assignmentId,
        score,
        answers: answers,            // jsonb — Supabase tự xử lý array/object
        attempt_number: attemptNumber,
      })
      .select()
      .single();
    if (error) throw error;
    return toApp(data);
  },
};
