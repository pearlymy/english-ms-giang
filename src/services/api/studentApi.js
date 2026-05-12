import { supabase } from '../../lib/supabase';

/* ── Field mapping helpers ─────────────────────────────────────────────── */
/* Email giả được tự sinh khi học viên không có email thật */
const PLACEHOLDER_EMAIL_DOMAIN = '@noemail.hg';
const isPlaceholderEmail = (email) => email?.endsWith(PLACEHOLDER_EMAIL_DOMAIN);

const toApp = (row) => ({
  id:                row.id,
  email:             isPlaceholderEmail(row.email) ? null : (row.email ?? null),
  username:          row.username,
  name:              row.name,
  role:              row.role,
  isActive:          row.is_active,
  phone:             row.phone ?? null,
  classId:           row.class_id ?? null,
  avatar:            row.avatar ?? null,
  createdAt:         row.created_at,
  enrolledCourseIds: row.class_id ? [row.class_course_id].filter(Boolean) : [],
});

/* ── Edge Function URL helper ──────────────────────────────────────────── */
const edgeFnUrl = (name) =>
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;

const edgeHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
  };
};

/* ── API ─────────────────────────────────────────────────────────────────── */
export const studentApi = {
  /**
   * Lấy tất cả học sinh (join classes để lấy courseId)
   */
  async getStudents() {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        classes ( course_id )
      `)
      .eq('role', 'student')
      .order('name', { ascending: true });

    if (error) throw error;

    return data.map((row) => ({
      ...toApp(row),
      enrolledCourseIds: row.classes?.course_id
        ? [row.classes.course_id]
        : [],
    }));
  },

  /**
   * Cập nhật thông tin profile học sinh (name, phone, class_id, avatar)
   */
  async updateStudent(id, patch) {
    const dbPatch = {};
    if (patch.name     !== undefined) dbPatch.name      = patch.name;
    if (patch.phone    !== undefined) dbPatch.phone     = patch.phone;
    if (patch.classId  !== undefined) dbPatch.class_id  = patch.classId;
    if (patch.username !== undefined) dbPatch.username  = patch.username;
    if (patch.avatar   !== undefined) dbPatch.avatar    = patch.avatar;
    // Email: cho phép xóa trắng (null) khi người dùng bỏ email
    if (patch.email !== undefined) dbPatch.email = patch.email?.trim() || null;
    // Trạng thái hoạt động
    if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;

    const { data, error } = await supabase
      .from('users')
      .update(dbPatch)
      .eq('id', id)
      .select(`*, classes ( course_id )`)
      .single();

    if (error) throw error;
    return { ...toApp(data), enrolledCourseIds: data.classes?.course_id ? [data.classes.course_id] : [] };
  },

  /**
   * Bật / tắt tài khoản học sinh
   */
  async toggleActive(id, currentIsActive) {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: !currentIsActive })
      .eq('id', id)
      .select(`*, classes ( course_id )`)
      .single();

    if (error) throw error;
    return { ...toApp(data), enrolledCourseIds: data.classes?.course_id ? [data.classes.course_id] : [] };
  },

  /**
   * Tạo tài khoản học sinh mới
   * → Gọi Edge Function `manage-student` (cần service_role để tạo auth user)
   */
  async createStudent({ email, password, username, name, phone, classId }) {
    const headers = await edgeHeaders();

    // Supabase Auth bắt buộc email. Nếu người dùng không nhập,
    // tự sinh email giả có domain riêng để dễ nhận biết và ẩn khỏi UI.
    const authEmail = email?.trim() || `${username}${PLACEHOLDER_EMAIL_DOMAIN}`;

    const res = await fetch(edgeFnUrl('manage-student'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action:   'create',
        email:    authEmail,
        password,
        username,
        name,
        phone:    phone ?? null,
        class_id: classId ?? null,
        role:     'student',
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Không thể tạo tài khoản học sinh.');
    return toApp(json.user);
  },

  /**
   * Xóa tài khoản học sinh (cả auth + profile)
   * → Gọi Edge Function `manage-student`
   */
  async deleteStudent(id) {
    const headers = await edgeHeaders();
    const res = await fetch(edgeFnUrl('manage-student'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'delete', userId: id }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Không thể xóa tài khoản học sinh.');
  },

  /**
   * Đổi mật khẩu học sinh
   * → Gọi Edge Function `manage-student`
   */
  async updatePassword(id, newPassword) {
    const headers = await edgeHeaders();
    const res = await fetch(edgeFnUrl('manage-student'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'update_password', userId: id, newPassword }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Không thể đổi mật khẩu.');
  },
};
