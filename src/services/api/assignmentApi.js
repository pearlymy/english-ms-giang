import { supabase } from '../../lib/supabase';

/* ── Field mapping helpers ─────────────────────────────────────────────── */

/** Map một question row từ DB về dạng app dùng */
const questionToApp = (row) => {
  const parsedOptions = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
  const isRichObject = parsedOptions && typeof parsedOptions === 'object' && parsedOptions.type;
  
  if (isRichObject) {
    // Nếu options chính là full UI object được đóng gói, ta trải nó ra, nhưng ghi đè id bằng id thật từ DB
    return {
      ...parsedOptions,
      id: row.id, // Id từ Supabase (UUID)
      // Các trường phụ trợ nếu cần
      audioGroupId: row.audio_group_id ?? parsedOptions.audioGroupId ?? null,
    };
  }

  // Fallback cấu trúc cũ
  return {
    id: row.id,
    text: row.text,
    options: parsedOptions,
    correctIdx: row.correct_idx,
    explanation: row.explanation ?? '',
    order: row.order_index,
    audioGroupId: row.audio_group_id ?? null,
  };
};

/** Map một audio_group row từ DB về dạng app dùng */
const audioGroupToApp = (row, questions) => ({
  id: row.id,
  label: row.label,
  script: row.script ?? '',
  order: row.order_index,
  questionIds: questions
    .filter((q) => q.audio_group_id === row.id)
    .map((q) => q.id),
});

/** Map một assignment row từ DB về dạng app dùng */
const assignmentToApp = (row) => {
  const questions = (row.questions ?? []).map(questionToApp);
  const audioGroups = (row.audio_groups ?? []).map((g) =>
    audioGroupToApp(g, row.questions ?? [])
  );

  // Lấy danh sách class đã được giao
  const assignedClassIds = (row.assignment_classes ?? []).map((ac) => ac.class_id);

  // Decode all settings (status + test config) from subject field
  let settings = {};
  if (row.subject && row.subject.startsWith('{')) {
    try {
      settings = JSON.parse(row.subject);
    } catch (e) { }
  }

  return {
    id: row.id,
    courseId: row.course_id,
    chapterId: row.chapter_id ?? null,
    type: row.type,
    audioMode: row.audio_mode ?? 'single',
    title: row.title,
    classGroup: row.class_group ?? '',
    dueDate: row.due_date ?? null,
    script: row.script ?? '',
    // status and test settings decoded from subject JSON
    status: settings.status ?? 'published',
    isTest: settings.isTest ?? false,
    timeLimitMin: settings.timeLimitMin ?? null,
    maxAttempts: settings.maxAttempts ?? 1,
    showAnswer: settings.showAnswer ?? 'Có',
    shuffle: settings.shuffle ?? false,
    questions,
    audioGroups: audioGroups.length ? audioGroups : undefined,
    assignedClassIds,
    createdAt: row.created_at,
  };
};

const assignmentToDB = (data) => {
  // Encode ALL settings (status + test config) into subject JSON
  // because the DB is missing status, is_test, time_limit_min, etc.
  const settingsObj = {
    status: data.status ?? 'published',
    isTest: data.isTest ?? false,
    timeLimitMin: data.timeLimitMin ?? null,
    maxAttempts: data.maxAttempts ?? 1,
    showAnswer: data.showAnswer ?? 'Có',
    shuffle: data.shuffle ?? false,
  };

  return {
    id: data.id,
    course_id: data.courseId ?? null,
    chapter_id: data.chapterId ?? null,
    type: data.type ?? 'quiz',
    audio_mode: data.audioMode ?? 'single',
    title: data.title,
    subject: JSON.stringify(settingsObj),
    class_group: data.classGroup ?? null,
    due_date: data.dueDate ?? null,
    script: data.script ?? null,
    // NOTE: status, is_test, time_limit_min, max_attempts, show_answer, shuffle
    // do NOT exist as columns - they live inside subject JSON above
  };
};

/* ── SELECT fragment used in every query ─────────────────────────────────── */
const ASSIGNMENT_SELECT = `
  *,
  questions ( * ),
  audio_groups ( * ),
  assignment_classes ( class_id, due_date )
`;

/* ── API ─────────────────────────────────────────────────────────────────── */
export const assignmentApi = {

  /** Lấy tất cả bài tập (kèm questions, audio_groups, assigned classes) */
  async getAssignments() {
    const { data, error } = await supabase
      .from('assignments')
      .select(ASSIGNMENT_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(assignmentToApp);
  },

  /** Lấy bài tập theo course */
  async getAssignmentsByCourse(courseId) {
    const { data, error } = await supabase
      .from('assignments')
      .select(ASSIGNMENT_SELECT)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(assignmentToApp);
  },

  /** Lấy một bài tập theo ID */
  async getAssignmentById(id) {
    const { data, error } = await supabase
      .from('assignments')
      .select(ASSIGNMENT_SELECT)
      .eq('id', id)
      .single();
    if (error) throw error;
    return assignmentToApp(data);
  },

  /** Tạo bài tập mới (chưa có questions — upsert questions riêng) */
  async createAssignment(assignmentData) {
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignmentToDB(assignmentData))
      .select(ASSIGNMENT_SELECT)
      .single();
    if (error) throw error;
    return assignmentToApp(data);
  },

  /** Cập nhật thông tin bài tập (title, dueDate, v.v.) */
  async updateAssignment(id, patch) {
    const dbPatch = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate;
    if (patch.chapterId !== undefined) dbPatch.chapter_id = patch.chapterId;
    if (patch.courseId !== undefined) dbPatch.course_id = patch.courseId;
    if (patch.classGroup !== undefined) dbPatch.class_group = patch.classGroup;
    if (patch.script !== undefined) dbPatch.script = patch.script;
    if (patch.audioMode !== undefined) dbPatch.audio_mode = patch.audioMode;
    if (patch.type !== undefined) dbPatch.type = patch.type;
    // NOTE: status, is_test, time_limit_min, etc. do NOT exist as real columns.
    // They are encoded into the subject JSON field.

    // Encode status + test settings into subject JSON whenever any of them changes
    const needSubjectUpdate = patch.status !== undefined || patch.isTest !== undefined ||
                              patch.timeLimitMin !== undefined || patch.maxAttempts !== undefined ||
                              patch.showAnswer !== undefined || patch.shuffle !== undefined;
    if (needSubjectUpdate) {
      const settingsObj = {
        status: patch.status ?? 'published',
        isTest: patch.isTest ?? false,
        timeLimitMin: patch.timeLimitMin ?? null,
        maxAttempts: patch.maxAttempts ?? 1,
        showAnswer: patch.showAnswer ?? 'Có',
        shuffle: patch.shuffle ?? false,
      };
      dbPatch.subject = JSON.stringify(settingsObj);
    }

    const { data, error } = await supabase
      .from('assignments')
      .update(dbPatch)
      .eq('id', id)
      .select(ASSIGNMENT_SELECT)
      .single();
    if (error) throw error;
    return assignmentToApp(data);
  },

  /** Xóa bài tập (cascade xóa questions, audio_groups) */
  async deleteAssignment(id) {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /* ── Assignment ↔ Class mapping ──────────────────────────────────────── */

  /** Giao bài cho lớp */
  async assignToClass(assignmentId, classId, dueDate = null) {
    const { error } = await supabase
      .from('assignment_classes')
      .upsert(
        { assignment_id: assignmentId, class_id: classId, due_date: dueDate },
        { onConflict: 'assignment_id,class_id' }
      );
    if (error) throw error;
  },

  /** Thu hồi bài khỏi lớp */
  async revokeFromClass(assignmentId, classId) {
    const { error } = await supabase
      .from('assignment_classes')
      .delete()
      .match({ assignment_id: assignmentId, class_id: classId });
    if (error) throw error;
  },

  /** Lấy danh sách classId đã được giao bài này */
  async getAssignedClassIds(assignmentId) {
    const { data, error } = await supabase
      .from('assignment_classes')
      .select('class_id')
      .eq('assignment_id', assignmentId);
    if (error) throw error;
    return data.map((r) => r.class_id);
  },

  /** Lấy tất cả bài tập được giao cho một lớp */
  async getAssignmentsForClass(classId) {
    const { data: acRows, error: acErr } = await supabase
      .from('assignment_classes')
      .select('assignment_id')
      .eq('class_id', classId);
    if (acErr) throw acErr;

    const ids = acRows.map((r) => r.assignment_id);
    if (!ids.length) return [];

    const { data, error } = await supabase
      .from('assignments')
      .select(ASSIGNMENT_SELECT)
      .in('id', ids);
    if (error) throw error;
    return data.map(assignmentToApp);
  },
};
