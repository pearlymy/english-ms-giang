/**
 * TeacherContext.jsx — Admin data + actions
 * Phase 1: Courses & Chapters → Supabase ✅
 * Phase 3: Assignments → Supabase ✅
 * Phase 5: Assignment Logs → Supabase ✅
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { courseApi } from '../services/api/courseApi';
import { chapterApi } from '../services/api/chapterApi';
import { assignmentApi } from '../services/api/assignmentApi';
import { questionApi } from '../services/api/questionApi';
import { submissionApi } from '../services/api/submissionApi';
import { assignmentLogApi } from '../services/api/assignmentLogApi';

const TeacherContext = createContext(null);

const GROUP_CONFIG = {
  'Cấp 1': { gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' },
  'Cấp 2': { gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
};

/* ──────────────────────────────────────────────────────────────────────────
   LOCAL MOCK DATA — dùng khi Supabase chưa có data hoặc đang offline
   Mỗi entry = 1 lớp học CỤ THỂ (không phải khối lớp chung).
   gradeLevel : số khối (1-9)  →  dùng để filter theo khối
   gradeLabel : "Lớp X"       →  hiển thị badge trên card
   classCode  : mã lớp (tự đặt)
   level      : Starters / Movers / Public / ...
────────────────────────────────────────────────────────────────────────── */
export const LOCAL_MOCK_COURSES = [
  // ── Khối Lớp 1 ────────────────────────────────────────────────────────
  {
    id: 'course-g1-pub-2026-01',
    name: 'Tiếng Anh Lớp 1 - Public 01',
    gradeLevel: 1,
    gradeLabel: 'Lớp 1',
    classCode: 'G1-PUB-2026.01-01',
    level: 'Public',
    classGroup: 'Cấp 1',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-10',
  },
  {
    id: 'course-g1-pub-2026-02',
    name: 'Tiếng Anh Lớp 1 - Public 02',
    gradeLevel: 1,
    gradeLabel: 'Lớp 1',
    classCode: 'G1-PUB-2026.01-02',
    level: 'Public',
    classGroup: 'Cấp 1',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-12',
  },
  {
    id: 'course-g1-sta-2026-01',
    name: 'Tiếng Anh Lớp 1 - Starters 01',
    gradeLevel: 1,
    gradeLabel: 'Lớp 1',
    classCode: 'G1-STA-2026.02-01',
    level: 'Starters',
    classGroup: 'Cấp 1',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-02-05',
  },
  // ── Khối Lớp 2 ────────────────────────────────────────────────────────
  {
    id: 'course-g2-pub-2026-01',
    name: 'Tiếng Anh Lớp 2 - Public 01',
    gradeLevel: 2,
    gradeLabel: 'Lớp 2',
    classCode: 'G2-PUB-2026.01-01',
    level: 'Public',
    classGroup: 'Cấp 1',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-10',
  },
  {
    id: 'course-g2-mov-2026-01',
    name: 'Tiếng Anh Lớp 2 - Movers 01',
    gradeLevel: 2,
    gradeLabel: 'Lớp 2',
    classCode: 'G2-MOV-2026.01-01',
    level: 'Movers',
    classGroup: 'Cấp 1',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-15',
  },
  // ── Khối Lớp 3 ────────────────────────────────────────────────────────
  {
    id: 'course-g3-pub-2026-01',
    name: 'Tiếng Anh Lớp 3 - Public 01',
    gradeLevel: 3,
    gradeLabel: 'Lớp 3',
    classCode: 'G3-PUB-2026.01-01',
    level: 'Public',
    classGroup: 'Cấp 1',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-10',
  },
  {
    id: 'course-g3-sta-2026-01',
    name: 'Tiếng Anh Lớp 3 - Starters 01',
    gradeLevel: 3,
    gradeLabel: 'Lớp 3',
    classCode: 'G3-STA-2026.01-01',
    level: 'Starters',
    classGroup: 'Cấp 1',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-18',
  },
  // ── Khối Lớp 4 ────────────────────────────────────────────────────────
  {
    id: 'course-g4-pub-2026-01',
    name: 'Tiếng Anh Lớp 4 - Public 01',
    gradeLevel: 4,
    gradeLabel: 'Lớp 4',
    classCode: 'G4-PUB-2026.01-01',
    level: 'Public',
    classGroup: 'Cấp 1',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-10',
  },
  {
    id: 'course-g4-mov-2026-01',
    name: 'Tiếng Anh Lớp 4 - Movers 01',
    gradeLevel: 4,
    gradeLabel: 'Lớp 4',
    classCode: 'G4-MOV-2026.01-01',
    level: 'Movers',
    classGroup: 'Cấp 1',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-20',
  },
  // ── Khối Lớp 5 ────────────────────────────────────────────────────────
  {
    id: 'course-g5-pub-2026-01',
    name: 'Tiếng Anh Lớp 5 - Public 01',
    gradeLevel: 5,
    gradeLabel: 'Lớp 5',
    classCode: 'G5-PUB-2026.01-01',
    level: 'Public',
    classGroup: 'Cấp 1',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-10',
  },
  // ── Khối Lớp 6 ────────────────────────────────────────────────────────
  {
    id: 'course-g6-pub-2026-01',
    name: 'Tiếng Anh Lớp 6 - Public 01',
    gradeLevel: 6,
    gradeLabel: 'Lớp 6',
    classCode: 'G6-PUB-2026.01-01',
    level: 'Public',
    classGroup: 'Cấp 2',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-10',
  },
  {
    id: 'course-g6-flu-2026-01',
    name: 'Tiếng Anh Lớp 6 - Flyers 01',
    gradeLevel: 6,
    gradeLabel: 'Lớp 6',
    classCode: 'G6-FLY-2026.01-01',
    level: 'Flyers',
    classGroup: 'Cấp 2',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-02-01',
  },
  // ── Khối Lớp 7 ────────────────────────────────────────────────────────
  {
    id: 'course-g7-pub-2026-01',
    name: 'Tiếng Anh Lớp 7 - Public 01',
    gradeLevel: 7,
    gradeLabel: 'Lớp 7',
    classCode: 'G7-PUB-2026.01-01',
    level: 'Public',
    classGroup: 'Cấp 2',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-10',
  },
  // ── Khối Lớp 8 ────────────────────────────────────────────────────────
  {
    id: 'course-g8-pub-2026-01',
    name: 'Tiếng Anh Lớp 8 - Public 01',
    gradeLevel: 8,
    gradeLabel: 'Lớp 8',
    classCode: 'G8-PUB-2026.01-01',
    level: 'Public',
    classGroup: 'Cấp 2',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-10',
  },
  // ── Khối Lớp 9 ────────────────────────────────────────────────────────
  {
    id: 'course-g9-pub-2026-01',
    name: 'Tiếng Anh Lớp 9 - Public 01',
    gradeLevel: 9,
    gradeLabel: 'Lớp 9',
    classCode: 'G9-PUB-2026.01-01',
    level: 'Public',
    classGroup: 'Cấp 2',
    description: '',
    status: 'Hoạt động',
    createdAt: '2026-01-10',
  },
];

export const TeacherProvider = ({ children }) => {
  /* ── Courses — Supabase ──────────────────────────────────────────────── */
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    // ── LOCAL-ONLY MODE ──────────────────────────────────────────────────
    // Dùng mock data cố định, không gọi Supabase cho courses.
    // Mỗi entry là 1 lớp học CỤ THỂ với gradeLabel, classCode, level đầy đủ.
    setCourses(LOCAL_MOCK_COURSES);
    setCoursesLoading(false);
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
  const [chapters, setChapters] = useState([]);
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
    
    try {
      const newChapter = await chapterApi.createChapter({
        id: `ch-${Date.now()}`,
        order: maxOrder + 1,
        ...data,
      });
      setChapters((prev) => [...prev, newChapter]);
      return newChapter;
    } catch (err) {
      if (err.message && err.message.includes('chapters_course_id_fkey')) {
        // Tự động tạo khóa học cha nếu chưa tồn tại trong Supabase
        await courseApi.createCourse({
          id: data.courseId,
          name: data.courseName || `Khóa học ${data.courseId}`,
          gradeLevel: 1, // Default fallback
        });
        // Thử lại
        const newChapter = await chapterApi.createChapter({
          id: `ch-${Date.now()}`,
          order: maxOrder + 1,
          ...data,
        });
        setChapters((prev) => [...prev, newChapter]);
        return newChapter;
      }
      throw err;
    }
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
  const [assignments, setAssignments] = useState([]);
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
      const toAdd = assignedClassIds.filter((c) => !current.includes(c));
      const toRemove = current.filter((c) => !assignedClassIds.includes(c));
      await Promise.all([
        ...toAdd.map((classId) => assignmentApi.assignToClass(id, classId)),
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
      const thisChapter = orderedIds
        .map((id) => prev.find((a) => a.id === id))
        .filter(Boolean)
        .map((a, idx) => ({ ...a, order: idx }));
      return [...otherChapter, ...thisChapter];
    });
    // TODO Phase 3+: persist order_index to Supabase if needed
  }, []);

  /* ── Assignment Logs — Supabase (Phase 5) ───────────────────────────── */
  const [assignmentLogs, setAssignmentLogs] = useState([]);
  const [assignmentLogsLoading, setAssignmentLogsLoading] = useState(true);

  useEffect(() => {
    assignmentLogApi.getAllLogs()
      .then(setAssignmentLogs)
      .catch((err) => console.error('Failed to load assignment logs:', err))
      .finally(() => setAssignmentLogsLoading(false));
  }, []);

  const createAssignmentLog = useCallback(async (data) => {
    try {
      const newItem = await assignmentLogApi.createLog(data);
      setAssignmentLogs((prev) => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      console.error('createAssignmentLog error:', err);
      throw err;
    }
  }, []);

  const updateAssignmentLog = useCallback(async (id, patch) => {
    try {
      const updated = await assignmentLogApi.updateLog(id, patch);
      setAssignmentLogs((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error('updateAssignmentLog error:', err);
      throw err;
    }
  }, []);

  const deleteAssignmentLog = useCallback(async (id) => {
    try {
      await assignmentLogApi.deleteLog(id);
      setAssignmentLogs((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('deleteAssignmentLog error:', err);
      throw err;
    }
  }, []);

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
          progress[sub.assignmentId].score = sub.score;
          progress[sub.assignmentId].submittedAt = sub.submittedAt;
        }
      });
      return progress;
    } catch (err) {
      console.error('getStudentProgress error:', err);
      return {};
    }
  }, []);

  const getAssignmentsByCourse = useCallback((courseId) =>
    assignments.filter((a) => a.courseId === courseId), [assignments]);

  const getAssignmentsByChapter = useCallback((chapterId) =>
    assignments
      .filter((a) => a.chapterId === chapterId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [assignments]);

  const getChaptersByCourse = useCallback((courseId) =>
    chapters.filter((c) => c.courseId === courseId).sort((a, b) => a.order - b.order),
    [chapters]);

  const getAssignmentById = useCallback((id) =>
    assignments.find((a) => a.id === id), [assignments]);

  /* ── isLoading ───────────────────────────────────────────────────────── */
  const isLoading = coursesLoading || chaptersLoading || assignmentsLoading || assignmentLogsLoading;

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
      upsertQuestions: questionApi.upsertQuestions,
      upsertAudioGroups: questionApi.upsertAudioGroups,
      // Assignment ↔ Class
      assignToClass: assignmentApi.assignToClass,
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


