import { supabase } from '../../lib/supabase';

/* ── Field mapping helpers ─────────────────────────────────────────────── */
const toApp = (row) => ({
  id:          row.id,
  name:        row.name,
  description: row.description,
  classGroup:  row.class_group,
  gradeLevel:  row.grade_level,
  color:       row.color,
  gradient:    row.gradient,
  createdAt:   row.created_at,
  totalStudents: 0, // computed elsewhere
});

const toDB = (data) => ({
  id:          data.id,
  name:        data.name,
  description: data.description ?? null,
  class_group: data.classGroup ?? null,
  grade_level: data.gradeLevel,
  color:       data.color ?? null,
  gradient:    data.gradient ?? null,
});

/* ── API ─────────────────────────────────────────────────────────────────── */
export const courseApi = {
  /** Lấy tất cả khóa học */
  async getCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('grade_level', { ascending: true });
    if (error) throw error;
    return data.map(toApp);
  },

  /** Tạo khóa học mới */
  async createCourse(courseData) {
    const { data, error } = await supabase
      .from('courses')
      .insert(toDB(courseData))
      .select()
      .single();
    if (error) throw error;
    return toApp(data);
  },

  /** Xóa khóa học (cascade xóa chapters và assignments) */
  async deleteCourse(id) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
