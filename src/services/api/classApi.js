import { supabase } from '../../lib/supabase';

/* ── Field mapping helpers ─────────────────────────────────────────────── */
const toApp = (row) => ({
  id:         row.id,
  code:       row.code,
  name:       row.name,
  gradeLevel: row.grade_level,
  year:       row.year,
  sequence:   row.sequence,
  courseId:   row.course_id,
  createdAt:  row.created_at?.slice(0, 10) ?? null,
});

const toDB = (data) => ({
  id:          data.id,
  code:        data.code,
  name:        data.name,
  grade_level: Number(data.gradeLevel),
  year:        data.year,
  sequence:    data.sequence ?? 1,
  course_id:   data.courseId ?? null,
});

/* ── API ─────────────────────────────────────────────────────────────────── */
export const classApi = {
  /** Lấy tất cả lớp học */
  async getClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('year', { ascending: false })
      .order('grade_level', { ascending: true });
    if (error) throw error;
    return data.map(toApp);
  },

  /** Tạo lớp mới */
  async createClass(classData) {
    const { data, error } = await supabase
      .from('classes')
      .insert(toDB(classData))
      .select()
      .single();
    if (error) throw error;
    return toApp(data);
  },

  /** Cập nhật lớp */
  async updateClass(id, patch) {
    const dbPatch = {};
    if (patch.name       !== undefined) dbPatch.name        = patch.name;
    if (patch.courseId   !== undefined) dbPatch.course_id   = patch.courseId;
    if (patch.gradeLevel !== undefined) dbPatch.grade_level = Number(patch.gradeLevel);

    const { data, error } = await supabase
      .from('classes')
      .update(dbPatch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toApp(data);
  },

  /** Xóa lớp (cascade xóa assignment_classes liên quan) */
  async deleteClass(id) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Sinh mã lớp tự động: YYYY.GG.SS
   * Cần truyền vào danh sách classes hiện tại để tính sequence.
   */
  generateClassCode(gradeLevel, existingClasses = []) {
    const year  = new Date().getFullYear();
    const grade = String(gradeLevel).padStart(2, '0');
    const sameGroup = existingClasses.filter(
      (c) => c.year === year && c.gradeLevel === Number(gradeLevel)
    );
    const seq = String(sameGroup.length + 1).padStart(2, '0');
    return `${year}.${grade}.${seq}`;
  },
};
