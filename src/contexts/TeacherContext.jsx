/**
 * TeacherContext.jsx — Admin data + actions (Phase 1 / mock localStorage)
 * Phase 2: swap mock methods for Supabase calls.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { COURSES, CHAPTERS, STUDENTS } from '../data/teacherData';
import { loadSubmissions } from '../data/submissionData';
import { ASSIGNMENTS } from '../data/homeworkData';

const TeacherContext = createContext(null);

const COURSES_KEY     = 'hg_courses';
const CHAPTERS_KEY    = 'hg_chapters';
const ASSIGNMENTS_KEY = 'hg_assignments';
const ASSIGNMENT_LOGS_KEY = 'hg_assignment_logs';

const GROUP_CONFIG = {
  'Cấp 1': { gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' },
  'Cấp 2': { gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
};

export const TeacherProvider = ({ children }) => {
  /* ── Courses ─────────────────────────────────────────────────────────── */
  const [courses, setCourses] = useState(() => {
    try {
      const stored = localStorage.getItem(COURSES_KEY);
      return stored ? JSON.parse(stored) : COURSES;
    } catch { return COURSES; }
  });

  const saveCourses = (updated) => {
    setCourses(updated);
    localStorage.setItem(COURSES_KEY, JSON.stringify(updated));
  };

  const createCourse = useCallback((data) => {
    const gradient = GROUP_CONFIG[data.classGroup]?.gradient
      ?? 'linear-gradient(135deg, #374151 0%, #6b7280 100%)';
    const newCourse = { id: `course-${Date.now()}`, gradient, totalStudents: 0, ...data };
    saveCourses([...courses, newCourse]);
    return newCourse;
  }, [courses]);

  const deleteCourse = useCallback((id) => {
    saveCourses(courses.filter(c => c.id !== id));
  }, [courses]);

  /* ── Chapters ────────────────────────────────────────────────────────── */
  const [chapters, setChapters] = useState(() => {
    try {
      const stored = localStorage.getItem(CHAPTERS_KEY);
      return stored ? JSON.parse(stored) : CHAPTERS;
    } catch { return CHAPTERS; }
  });

  const saveChapters = (updated) => {
    setChapters(updated);
    localStorage.setItem(CHAPTERS_KEY, JSON.stringify(updated));
  };

  const createChapter = useCallback((data) => {
    const courseChapters = chapters.filter(c => c.courseId === data.courseId);
    const maxOrder = courseChapters.reduce((m, c) => Math.max(m, c.order ?? 0), 0);
    const newChapter = {
      id: `ch-${Date.now()}`,
      order: maxOrder + 1,
      ...data,
    };
    saveChapters([...chapters, newChapter]);
    return newChapter;
  }, [chapters]);

  const updateChapter = useCallback((id, data) => {
    saveChapters(chapters.map(c => c.id === id ? { ...c, ...data } : c));
  }, [chapters]);

  const deleteChapter = useCallback((id, assignmentsState, saveAssignmentsFn) => {
    // Cascade: delete all assignments in this chapter
    if (assignmentsState && saveAssignmentsFn) {
      saveAssignmentsFn(assignmentsState.filter(a => a.chapterId !== id));
    }
    saveChapters(chapters.filter(c => c.id !== id));
  }, [chapters]);

  /* ── Assignments ─────────────────────────────────────────────────────── */
  const [assignments, setAssignments] = useState(() => {
    try {
      const stored = localStorage.getItem(ASSIGNMENTS_KEY);
      return stored ? JSON.parse(stored) : ASSIGNMENTS;
    } catch { return ASSIGNMENTS; }
  });

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === ASSIGNMENTS_KEY && e.newValue) {
        setAssignments(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const saveAssignments = useCallback((updated) => {
    setAssignments(updated);
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(updated));
  }, []);

  const createAssignment = useCallback((data) => {
    const newItem = {
      questions: [],
      assignedClassIds: [],
      status: 'published',
      ...data,
      id: `hw-${Date.now()}`,
    };
    setAssignments(prev => {
      const updated = [...prev, newItem];
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(updated));
      return updated;
    });
    return newItem;
  }, []);

  const updateAssignment = useCallback((id, data) => {
    setAssignments(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, ...data } : a);
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteAssignment = useCallback((id) => {
    setAssignments(prev => {
      const updated = prev.filter(a => a.id !== id);
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const reorderAssignments = useCallback((chapterId, orderedIds) => {
    setAssignments(prev => {
      const otherChapter = prev.filter(a => a.chapterId !== chapterId);
      const thisChapter  = orderedIds
        .map(id => prev.find(a => a.id === id))
        .filter(Boolean)
        .map((a, idx) => ({ ...a, order: idx }));
      const updated = [...otherChapter, ...thisChapter];
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /* ── Assignment Logs ─────────────────────────────────────────────────── */
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
    const now = new Date();
    const yyyymmdd = now.toISOString().split('T')[0].replace(/-/g, '');
    // Count how many logs already exist for today to get sequential number
    const todayCount = assignmentLogs.filter(l => String(l.id).startsWith(yyyymmdd)).length;
    const seq = String(todayCount + 1).padStart(3, '0');

    const newItem = {
      id: `${yyyymmdd}.${seq}`,
      assignedAt: now.toISOString(),
      ...data,
    };
    const updated = [newItem, ...assignmentLogs];
    saveAssignmentLogs(updated);
    return newItem;
  }, [assignmentLogs, saveAssignmentLogs]);

  const updateAssignmentLog = useCallback((id, patch) => {
    const updated = assignmentLogs.map(a => a.id === id ? { ...a, ...patch } : a);
    saveAssignmentLogs(updated);
  }, [assignmentLogs, saveAssignmentLogs]);

  const deleteAssignmentLog = useCallback((id) => {
    saveAssignmentLogs(assignmentLogs.filter(a => a.id !== id));
  }, [assignmentLogs, saveAssignmentLogs]);

  const getAssignmentLogsByCourse = useCallback((courseId) => {
    return assignmentLogs.filter(log => log.courseId === courseId);
  }, [assignmentLogs]);

  /* ── Queries ─────────────────────────────────────────────────────────── */
  const getStudentProgress = useCallback((studentId) => {
    const allSubs = loadSubmissions();
    const studentSubs = allSubs.filter(s => s.studentId === studentId);
    const progress = {};
    studentSubs.forEach(sub => {
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
  }, []);

  const getAssignmentsByCourse = useCallback((courseId) =>
    assignments.filter(a => a.courseId === courseId), [assignments]);

  const getAssignmentsByChapter = useCallback((chapterId) =>
    assignments
      .filter(a => a.chapterId === chapterId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  [assignments]);

  const getChaptersByCourse = useCallback((courseId) =>
    chapters.filter(c => c.courseId === courseId).sort((a, b) => a.order - b.order),
  [chapters]);


  const getAssignmentById = useCallback((id) =>
    assignments.find(a => a.id === id), [assignments]);

  return (
    <TeacherContext.Provider value={{
      // Data
      courses, chapters, assignments,
      // Course CRUD
      createCourse, deleteCourse,
      // Chapter CRUD
      createChapter, updateChapter,
      deleteChapter: (id) => deleteChapter(id, assignments, saveAssignments),
      // Assignment CRUD
      createAssignment, updateAssignment, deleteAssignment, reorderAssignments,
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
