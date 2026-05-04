import { supabase } from '../../lib/supabase';

/* ── Field mapping helpers ─────────────────────────────────────────────── */
const toApp = (row) => ({
  id:         row.id,
  courseId:   row.course_id,
  name:       row.name,
  order:      row.order_index,
  createdAt:  row.created_at,
});

const toDB = (data) => ({
  id:          data.id,
  course_id:   data.courseId,
  name:        data.name,
  order_index: data.order ?? 1,
});

/* ── API ─────────────────────────────────────────────────────────────────── */
export const chapterApi = {
  /** Lấy tất cả chương của một khóa học */
  async getChapters(courseId) {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data.map(toApp);
  },

  /** Lấy TẤT CẢ chương (dùng khi load toàn bộ) */
  async getAllChapters() {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .order('course_id')
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data.map(toApp);
  },

  /** Tạo chương mới */
  async createChapter(chapterData) {
    const { data, error } = await supabase
      .from('chapters')
      .insert(toDB(chapterData))
      .select()
      .single();
    if (error) throw error;
    return toApp(data);
  },

  /** Cập nhật chương */
  async updateChapter(id, patch) {
    const dbPatch = {};
    if (patch.name       !== undefined) dbPatch.name        = patch.name;
    if (patch.order      !== undefined) dbPatch.order_index = patch.order;
    if (patch.courseId   !== undefined) dbPatch.course_id   = patch.courseId;

    const { data, error } = await supabase
      .from('chapters')
      .update(dbPatch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toApp(data);
  },

  /** Xóa chương (cascade xóa assignments bên trong) */
  async deleteChapter(id) {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
