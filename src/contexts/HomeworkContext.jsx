/**
 * HomeworkContext — manages homework attempt state for students.
 * Local-first: submissions lưu trong localStorage (không dùng Supabase).
 */
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth }             from './AuthContext';
import { useTeacher }          from './TeacherContext';
import { useUserManagement }   from './UserManagementContext';
import { scoreAttempt, canViewAnswers, calculate10PointScore } from '../data/homeworkData';

/* ── localStorage helpers ─── */
const SUBS_KEY = (studentId) => `hw_submissions_${studentId}`;
const loadSubs = (studentId) => {
  try {
    const raw = localStorage.getItem(SUBS_KEY(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const saveSubs = (studentId, subs) => {
  try { localStorage.setItem(SUBS_KEY(studentId), JSON.stringify(subs)); } catch {}
};

const HomeworkContext = createContext(null);

export const HomeworkProvider = ({ children }) => {
  const { user } = useAuth();
  const { assignments } = useTeacher();
  const { classes }     = useUserManagement();

  const studentId  = user?.id;
  const classId    = user?.classId ?? user?.class_id;
  // Lấy gradeLevel của lớp để đọc đúng course storage key
  const gradeLevel = useMemo(() => {
    if (!classId || !classes?.length) return null;
    const cls = classes.find(c => c.id === classId);
    return cls?.gradeLevel ?? cls?.grade_level ?? null;
  }, [classId, classes]);

  /* ── Submissions — localStorage ─────────────────────────────────────── */
  const [allSubmissions, setAllSubmissions] = useState(() =>
    studentId ? loadSubs(studentId) : []
  );
  const subsLoading = false;

  // Khi studentId thay đổi (ví dụ login khác), reload từ localStorage
  useEffect(() => {
    if (studentId) {
      setAllSubmissions(loadSubs(studentId));
    } else {
      setAllSubmissions([]);
    }
  }, [studentId]);

  /* ── Helpers: đọc bài đã giao từ localStorage (Sprint 2 model) ─────────── */
  const readAssignedForStudent = useCallback(() => {
    if (!classId) return [];
    try {
      // 1. Đọc danh sách record đã giao cho lớp
      const classKey = `class_assignments_${classId}`;
      const classRaw = localStorage.getItem(classKey);
      if (!classRaw) return [];
      const classRecords = JSON.parse(classRaw); // [{assignmentId, unitId, unitName, deadline, ...}]
      if (!classRecords.length) return [];

      // 2. gradeLevel đã được resolve từ classes (useMemo ở trên)

      // 3. Đọc nội dung bài từ course-level storage (nếu có gradeLevel)
      let courseContent = [];
      if (gradeLevel) {
        const courseRaw = localStorage.getItem(`localAssignments_course-lop${gradeLevel}`);
        if (courseRaw) courseContent = JSON.parse(courseRaw);
      }
      // Fallback: thử tất cả localAssignments_course-lop* nếu không có gradeLevel
      if (!courseContent.length) {
        for (let g = 1; g <= 12; g++) {
          const raw = localStorage.getItem(`localAssignments_course-lop${g}`);
          if (raw) {
            const arr = JSON.parse(raw);
            courseContent = [...courseContent, ...arr];
          }
        }
      }
      const contentMap = {};
      courseContent.forEach(a => { contentMap[a.id] = a; });

      // 4. Join: build danh sách bài tập đầy đủ
      const result = [];
      const seen = new Set();
      classRecords.forEach(record => {
        if (seen.has(record.assignmentId)) return;
        seen.add(record.assignmentId);
        const content = contentMap[record.assignmentId];
        result.push({
          id:       record.assignmentId,
          title:    content?.title ?? record.assignmentName ?? 'Bài tập',
          type:     content?.isTest ? 'test' : 'exercise',
          isTest:   content?.isTest ?? false,
          dueDate:  record.deadline ?? null,
          unitName: record.unitName ?? null,
          questions: content?.questions ?? [],
          status:   'published',
          // keep assignedClassIds for backward-compat
          assignedClassIds: [classId],
        });
      });
      return result;
    } catch (e) {
      console.warn('[HomeworkContext] readAssignedForStudent error:', e);
      return [];
    }
  }, [classId, gradeLevel]);

  /* ── 1. Bài tập của học sinh này ─────────────────────────────────────── */
  const studentAssignments = useMemo(() => {
    // Ưu tiên localStorage Sprint 2 model
    const localAssigned = readAssignedForStudent();
    if (localAssigned.length > 0) return localAssigned;

    // Fallback: Supabase model cũ (assignedClassIds)
    if (!classId) return [];
    return assignments.filter((a) => {
      const assigned = Array.isArray(a.assignedClassIds) ? a.assignedClassIds : [];
      return assigned.includes(classId);
    });
  }, [readAssignedForStudent, assignments, classId]);


  /* ── 2. Progress từ submissions ──────────────────────────────────────── */
  const progress = useMemo(() => {
    if (!studentId) return {};
    const prog = {};
    allSubmissions.forEach((sub) => {
      if (!prog[sub.assignmentId]) {
        prog[sub.assignmentId] = { attempts: [] };
      }
      prog[sub.assignmentId].attempts.push(sub);
    });
    Object.values(prog).forEach((p) => {
      p.attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
    });
    return prog;
  }, [allSubmissions, studentId]);

  /* ── Derived helpers ─────────────────────────────────────────────────── */
  const getAttempts    = useCallback((assignmentId) =>
    progress[assignmentId]?.attempts ?? [], [progress]);

  const getStatus      = useCallback((assignmentId) =>
    getAttempts(assignmentId).length ? 'submitted' : 'pending', [getAttempts]);

  const getBestScore   = useCallback((assignmentId) => {
    const attempts = getAttempts(assignmentId);
    const assignment = studentAssignments.find((a) => a.id === assignmentId);
    if (!assignment || !attempts.length) return null;
    
    // Trả về điểm hệ 10 thực sự (giống trang giáo viên)
    const scores = attempts.map((att) => {
      if (att.gradedByTeacher && att.score !== undefined) return att.score;
      return calculate10PointScore(assignment, att.answers, att).finalScore;
    });
    return Math.max(...scores);
  }, [getAttempts, studentAssignments]);

  const getLastAttempt = useCallback((assignmentId) => {
    const attempts = getAttempts(assignmentId);
    return attempts[attempts.length - 1] ?? null;
  }, [getAttempts]);

  const canView = useCallback((assignmentId) => {
    const assignment = studentAssignments.find((a) => a.id === assignmentId) ?? null;
    return canViewAnswers(getAttempts(assignmentId), assignment);
  }, [getAttempts, studentAssignments]);

  /* ── Actions ─────────────────────────────────────────────────────────── */
  const submitAttempt = useCallback((assignmentId, answers) => {
    if (!studentId) return null;

    // Tìm bài trong studentAssignments (local), không phải TeacherContext
    const assignment = studentAssignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      console.warn('[HomeworkContext] submitAttempt: assignment not found in studentAssignments:', assignmentId);
      return null;
    }

    // Đọc trực tiếp từ localStorage để tránh stale closure khi làm lần 2+
    const freshSubs = loadSubs(studentId);
    const prevAttempts = freshSubs.filter(s => s.assignmentId === assignmentId);
    const score = scoreAttempt(assignment, answers);

    const newSubmission = {
      id: `sub_${Date.now()}`,
      studentId,
      assignmentId,
      score,
      answers,
      attemptNumber: prevAttempts.length + 1,
      submittedAt: new Date().toISOString(),
    };

    const next = [...freshSubs, newSubmission];
    saveSubs(studentId, next);
    setAllSubmissions(next);
    return newSubmission;
  }, [studentId, studentAssignments]);

  /* ── clearAttempts — xóa toàn bộ lịch sử của 1 bài ─────────────────── */
  const clearAttempts = useCallback((assignmentId) => {
    if (!studentId) return;
    setAllSubmissions((prev) => {
      const next = prev.filter(s => s.assignmentId !== assignmentId);
      saveSubs(studentId, next);
      return next;
    });
  }, [studentId]);

  /* ── Aggregate stats ─────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total    = studentAssignments.length;
    const done     = studentAssignments.filter((a) => getStatus(a.id) === 'submitted').length;
    const pending  = total - done;
    const scores   = studentAssignments.map((a) => getBestScore(a.id)).filter((s) => s !== null);
    const avgScore = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
    return { total, done, pending, avgScore };
  }, [studentAssignments, progress]);

  return (
    <HomeworkContext.Provider value={{
      assignments: studentAssignments,
      progress,
      stats,
      subsLoading,
      getAttempts,
      getStatus,
      getBestScore,
      getLastAttempt,
      canView,
      submitAttempt,
      clearAttempts,
    }}>
      {children}
    </HomeworkContext.Provider>
  );
};

export const useHomework = () => {
  const ctx = useContext(HomeworkContext);
  if (!ctx) throw new Error('useHomework must be used inside <HomeworkProvider>');
  return ctx;
};
