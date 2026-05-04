/**
 * TeacherContext.jsx — Admin data + actions
 * Phase 1: Courses & Chapters → Supabase ✅
 * Phase 3: Assignments → Supabase ✅
 * Phase 5: Assignment Logs → Supabase (TODO)
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { courseApi }     from '../services/api/courseApi';
import { chapterApi }    from '../services/api/chapterApi';
import { assignmentApi } from '../services/api/assignmentApi';
import { questionApi }   from '../services/api/questionApi';
import { submissionApi } from '../services/api/submissionApi';

const TeacherContext = createContext(null);

/* ── Assignment Logs masih pakai localStorage (Phase 5) ─────────────────── */
const ASSIGNMENT_LOGS_KEY = 'hg_assignment_logs';

const GROUP_CONFIG = {
  'Cấp 1': { gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' },
  'Cấp 2': { gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
};

export const TeacherProvider = ({ children }) => {
  /* ── Courses — Supabase ──────────────────────────────────────────────── */
  const [courses,       setCourses]       = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    courseApi.getCourses()
      .then(setCourses)
      .catch((err) => console.error('Failed to load courses:', err))
      .finally(() => setCoursesLoading(false));
  }, []);

  const createCourse = useCallback(async (data) => {
    const gradient = GROUP_CONFIG[data.classGroup]?.gradient
      ?? 'linear-gradient(135deg, #374151 0%, #6b7280 100%)';
    const newCourse = await courseApi.createCourse({
      id: `course-${Date.now()}`,
      gradient,
      totalStudents: 0,
      ...data,
    });
    setCourses((prev) => [...prev, newCourse]);
    return newCourse;
  }, []);

  const deleteCourse = useCallback(async (id) => {
    await courseApi.deleteCourse(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  /* ── Chapters — Supabase ─────────────────────────────────────────────── */
  const [chapters,       setChapters]       = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);

  useEffect(() => {
    chapterApi.getAllChapters()
      .then(setChapters)
      .catch((err) => console.error('Failed to load chapters:', err))
      .finally(() => setChaptersLoading(false));
  }, []);

  const createChapter = useCallback(async (data) => {
    const courseChapters = chapters.filter((c) => c.courseId === data.courseId);
    const maxOrder = courseChapters.reduce((m, c) => Math.max(m, c.order ?? 0), 0);
    const newChapter = await chapterApi.createChapter({
      id: `ch-${Date.now()}`,
      order: maxOrder + 1,
      ...data,
    });
    setChapters((prev) => [...prev, newChapter]);
    return newChapter;
  }, [chapters]);

  const updateChapter = useCallback(async (id, data) => {
    const updated = await chapterApi.updateChapter(id, data);
    setChapters((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const deleteChapter = useCallback(async (id) => {
    // Cascade xóa assignments trong chapter xảy ra ở DB
    await chapterApi.deleteChapter(id);
    setChapters((prev) => prev.filter((c) => c.id !== id));
    // Refresh assignments vì cascade đã xóa
    const updated = await assignmentApi.getAssignments();
    setAssignments(updated);
  }, []);

  /* ── Assignments — Supabase ──────────────────────────────────────────── */
  const [assignments,       setAssignments]       = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  useEffect(() => {
    assignmentApi.getAssignments()
      .then(setAssignments)
      .catch((err) => console.error('Failed to load assignments:', err))
      .finally(() => setAssignmentsLoading(false));
  }, []);

  const createAssignment = useCallback(async (data) => {
    const newItem = await assignmentApi.createAssignment({
      ...data,
      id: `hw-${Date.now()}`,
    });
    // Nếu có questions thì upsert ngay
    if (data.questions?.length) {
      await questionApi.upsertQuestions(newItem.id, data.questions);
    }
    if (data.audioGroups?.length) {
      await questionApi.upsertAudioGroups(newItem.id, data.audioGroups);
    }
    // Reload bài này để có questions đầy đủ
    const fresh = await assignmentApi.getAssignmentById(newItem.id);
    setAssignments((prev) => [fresh, ...prev]);
    return fresh;
  }, []);

  const updateAssignment = useCallback(async (id, data) => {
    // Tách riêng questions/audioGroups khỏi metadata
    const { questions, audioGroups, assignedClassIds, ...rest } = data;

    // Cập nhật metadata bài tập
    if (Object.keys(rest).length) {
      await assignmentApi.updateAssignment(id, rest);
    }

    // Upsert questions nếu có
    if (questions !== undefined) {
      await questionApi.upsertQuestions(id, questions);
    }

    // Upsert audio_groups nếu có
    if (audioGroups !== undefined) {
      await questionApi.upsertAudioGroups(id, audioGroups);
    }

    // Xử lý assignedClassIds: sync với assignment_classes
    if (assignedClassIds !== undefined) {
      const current = await assignmentApi.getAssignedClassIds(id);
      const toAdd    = assignedClassIds.filter((c) => !current.includes(c));
      const toRemove = current.filter((c) => !assignedClassIds.includes(c));
      await Promise.all([
        ...toAdd.map((classId)    => assignmentApi.assignToClass(id, classId)),
        ...toRemove.map((classId) => assignmentApi.revokeFromClass(id, classId)),
      ]);
    }

    // Reload bài tập đã cập nhật
    const fresh = await assignmentApi.getAssignmentById(id);
    setAssignments((prev) => prev.map((a) => (a.id === id ? fresh : a)));
  }, []);

  const deleteAssignment = useCallback(async (id) => {
    await assignmentApi.deleteAssignment(id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const reorderAssignments = useCallback(async (chapterId, orderedIds) => {
    // Reorder chỉ ảnh hưởng display order — cập nhật state local
    setAssignments((prev) => {
      const otherChapter = prev.filter((a) => a.chapterId !== chapterId);
      const thisChapter  = orderedIds
        .map((id) => prev.find((a) => a.id === id))
        .filter(Boolean)
        .map((a, idx) => ({ ...a, order: idx }));
      return [...otherChapter, ...thisChapter];
    });
    // TODO Phase 3+: persist order_index to Supabase if needed
  }, []);

  /* ── Assignment Logs — localStorage (Phase 5 sẽ migrate) ────────────── */
  const [assignmentLogs, setAssignmentLogs] = useState(() => {
    try {
      const stored = localStorage.getItem(ASSIGNMENT_LOGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const saveAssignmentLogs = useCallback((updated) => {
    setAssignmentLogs(updated);
    localStorage.setItem(ASSIGNMENT_LOGS_KEY, JSON.stringify(updated));
  }, []);

  const createAssignmentLog = useCallback((data) => {
    const now      = new Date();
    const yyyymmdd = now.toISOString().split('T')[0].replace(/-/g, '');
    const todayCount = assignmentLogs.filter((l) => String(l.id).startsWith(yyyymmdd)).length;
    const seq      = String(todayCount + 1).padStart(3, '0');
    const newItem  = { id: `${yyyymmdd}.${seq}`, assignedAt: now.toISOString(), ...data };
    saveAssignmentLogs([newItem, ...assignmentLogs]);
    return newItem;
  }, [assignmentLogs, saveAssignmentLogs]);

  const updateAssignmentLog = useCallback((id, patch) => {
    saveAssignmentLogs(assignmentLogs.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, [assignmentLogs, saveAssignmentLogs]);

  const deleteAssignmentLog = useCallback((id) => {
    saveAssignmentLogs(assignmentLogs.filter((a) => a.id !== id));
  }, [assignmentLogs, saveAssignmentLogs]);

  const getAssignmentLogsByCourse = useCallback(
    (courseId) => assignmentLogs.filter((log) => log.courseId === courseId),
    [assignmentLogs]
  );

  /**
   * getStudentProgress(studentId) — async, đọc từ Supabase.
   * Trả về { [assignmentId]: { attempts, score, submittedAt } }
   */
  const getStudentProgress = useCallback(async (studentId) => {
    try {
      const subs = await submissionApi.getSubmissionsByStudent(studentId);
      const progress = {};
      subs.forEach((sub) => {
        if (!progress[sub.assignmentId]) {
          progress[sub.assignmentId] = { attempts: 0, score: -1, submittedAt: null };
        }
        progress[sub.assignmentId].attempts++;
        if (sub.score >= progress[sub.assignmentId].score) {
          progress[sub.assignmentId].score       = sub.score;
          progress[sub.assignmentId].submittedAt = sub.submittedAt;
        }
      });
      return progress;
    } catch (err) {
      console.error('getStudentProgress error:', err);
      return {};
    }
  }, []);

  const getAssignmentsByCourse  = useCallback((courseId) =>
    assignments.filter((a) => a.courseId === courseId), [assignments]);

  const getAssignmentsByChapter = useCallback((chapterId) =>
    assignments
      .filter((a) => a.chapterId === chapterId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [assignments]);

  const getChaptersByCourse     = useCallback((courseId) =>
    chapters.filter((c) => c.courseId === courseId).sort((a, b) => a.order - b.order),
    [chapters]);

  const getAssignmentById       = useCallback((id) =>
    assignments.find((a) => a.id === id), [assignments]);

  /* ── isLoading ───────────────────────────────────────────────────────── */
  const isLoading = coursesLoading || chaptersLoading || assignmentsLoading;

  return (
    <TeacherContext.Provider value={{
      // Loading
      isLoading,
      // Data
      courses, chapters, assignments,
      // Course CRUD
      createCourse, deleteCourse,
      // Chapter CRUD
      createChapter, updateChapter, deleteChapter,
      // Assignment CRUD
      createAssignment, updateAssignment, deleteAssignment, reorderAssignments,
      // Question helpers (expose để admin editor dùng trực tiếp)
      upsertQuestions:   questionApi.upsertQuestions,
      upsertAudioGroups: questionApi.upsertAudioGroups,
      // Assignment ↔ Class
      assignToClass:   assignmentApi.assignToClass,
      revokeFromClass: assignmentApi.revokeFromClass,
      // Assignment Logs CRUD
      assignmentLogs, createAssignmentLog, updateAssignmentLog, deleteAssignmentLog,
      // Queries
      getStudentProgress,
      getAssignmentsByCourse,
      getAssignmentsByChapter,
      getChaptersByCourse,
      getAssignmentById,
      getAssignmentLogsByCourse,
    }}>
      {children}
    </TeacherContext.Provider>
  );
};

export const useTeacher = () => {
  const ctx = useContext(TeacherContext);
  if (!ctx) throw new Error('useTeacher must be used inside <TeacherProvider>');
  return ctx;
};
