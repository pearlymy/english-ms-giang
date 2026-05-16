import { supabase } from '../../lib/supabase';

/* ── API ─────────────────────────────────────────────────────────────────── */
export const questionApi = {

  /**
   * Upsert toàn bộ questions cho một assignment.
   * Xóa questions cũ không còn trong danh sách mới, rồi upsert những cái còn lại.
   */
  async upsertQuestions(assignmentId, questions) {
    // 1. Xóa tất cả câu hỏi cũ của assignment này
    const { error: delErr } = await supabase
      .from('questions')
      .delete()
      .eq('assignment_id', assignmentId);
    if (delErr) throw delErr;

    // 2. Nếu không có câu hỏi mới thì thôi
    if (!questions || questions.length === 0) return [];

    // 3. Insert câu hỏi mới
    const rows = questions.map((q, idx) => {
      // Bảo toàn toàn bộ cấu trúc câu hỏi phong phú của UI vào column options dạng JSON
      const fullQ = { ...q };
      
      // Nếu id là số (từ UI tạo tạm), bỏ đi để Supabase tự sinh UUID
      const dbId = (typeof q.id === 'string' && q.id.length > 10) ? q.id : undefined;

      return {
        id: dbId,
        assignment_id: assignmentId,
        audio_group_id: q.audioGroupId ?? null,
        text: q.content || q.text || '(Không có nội dung)',
        options: fullQ, // Lưu TOÀN BỘ object vào options để không mất field nào (type, pairs, orderItems, v.v.)
        correct_idx: q.correctIdx ?? 0,
        explanation: q.explanation ?? null,
        order_index: idx + 1,
      };
    });

    const { data, error } = await supabase
      .from('questions')
      .insert(rows)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Upsert audio_groups cho một assignment.
   * Xóa groups cũ rồi insert lại.
   */
  async upsertAudioGroups(assignmentId, audioGroups) {
    // 1. Xóa groups cũ
    const { error: delErr } = await supabase
      .from('audio_groups')
      .delete()
      .eq('assignment_id', assignmentId);
    if (delErr) throw delErr;

    if (!audioGroups || audioGroups.length === 0) return [];

    // 2. Insert groups mới
    const rows = audioGroups.map((g, idx) => ({
      id: g.id,
      assignment_id: assignmentId,
      label: g.label,
      script: g.script ?? null,
      order_index: idx + 1,
    }));

    const { data, error } = await supabase
      .from('audio_groups')
      .insert(rows)
      .select();
    if (error) throw error;
    return data;
  },

  /** Xóa một câu hỏi đơn lẻ */
  async deleteQuestion(id, assignmentId) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .match({ id, assignment_id: assignmentId });
    if (error) throw error;
  },
};

