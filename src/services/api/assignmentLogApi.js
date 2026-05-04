import { supabase } from '../../lib/supabase';

/* ── Field mapping helpers ─────────────────────────────────────────────── */

/** Map một assignment_log row từ DB về dạng app dùng */
const logToApp = (row) => ({
  id:              row.id,
  courseId:        row.course_id,
  type:            row.log_type,
  targetId:        row.target_id,
  targetName:      row.target_name,
  assignedClasses: Array.isArray(row.assigned_classes) ? row.assigned_classes : [],
  assignedHwIds:   Array.isArray(row.assigned_hw_ids)  ? row.assigned_hw_ids  : [],
  dueDate:         row.due_date   ?? null,
  assignedAt:      row.performed_at,
});

/** Map dữ liệu app → DB để insert/update */
const logToDB = (data) => ({
  course_id:        data.courseId        ?? null,
  log_type:         data.type            ?? null,
  target_id:        data.targetId        ?? null,
  target_name:      data.targetName      ?? null,
  assigned_classes: data.assignedClasses ?? [],
  assigned_hw_ids:  data.assignedHwIds   ?? [],
  due_date:         data.dueDate         ?? null,
});

/* ── Helper: tạo ID dạng YYYYMMDD.XXX ─────────────────────────────────── */

/**
 * Đếm số log có ID bắt đầu bằng YYYYMMDD trong DB hôm nay,
 * trả về ID kế tiếp (ví dụ: '20260505.003').
 */
const generateSequentialId = async () => {
  const now      = new Date();
  const pad      = (n) => String(n).padStart(2, '0');
  const yyyymmdd = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

  const { data, error } = await supabase
    .from('assignment_logs')
    .select('id')
    .like('id', `${yyyymmdd}.%`);

  if (error) throw error;

  const seq = String((data?.length ?? 0) + 1).padStart(3, '0');
  return `${yyyymmdd}.${seq}`;
};

/* ── API ─────────────────────────────────────────────────────────────────── */
export const assignmentLogApi = {

  /** Lấy tất cả logs của một course */
  async getLogsByCourse(courseId) {
    const { data, error } = await supabase
      .from('assignment_logs')
      .select('*')
      .eq('course_id', courseId)
      .order('performed_at', { ascending: false });
    if (error) throw error;
    return data.map(logToApp);
  },

  /** Lấy tất cả logs (để filter ở client khi cần) */
  async getAllLogs() {
    const { data, error } = await supabase
      .from('assignment_logs')
      .select('*')
      .order('performed_at', { ascending: false });
    if (error) throw error;
    return data.map(logToApp);
  },

  /**
   * Tạo log mới — tự động generate ID dạng YYYYMMDD.XXX.
   * @param {object} logData — { courseId, type, targetId, targetName, assignedClasses, assignedHwIds, dueDate }
   * @returns {object} log đã được tạo (app format)
   */
  async createLog(logData) {
    const id = await generateSequentialId();

    const { data, error } = await supabase
      .from('assignment_logs')
      .insert({ id, ...logToDB(logData) })
      .select('*')
      .single();

    if (error) throw error;
    return logToApp(data);
  },

  /**
   * Cập nhật log (ví dụ: sửa dueDate).
   * @param {string} id
   * @param {object} patch — { dueDate?, assignedClasses?, ... }
   */
  async updateLog(id, patch) {
    const dbPatch = {};
    if (patch.dueDate         !== undefined) dbPatch.due_date         = patch.dueDate;
    if (patch.assignedClasses !== undefined) dbPatch.assigned_classes = patch.assignedClasses;
    if (patch.assignedHwIds   !== undefined) dbPatch.assigned_hw_ids  = patch.assignedHwIds;
    if (patch.targetName      !== undefined) dbPatch.target_name      = patch.targetName;

    const { data, error } = await supabase
      .from('assignment_logs')
      .update(dbPatch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return logToApp(data);
  },

  /** Xóa log */
  async deleteLog(id) {
    const { error } = await supabase
      .from('assignment_logs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
