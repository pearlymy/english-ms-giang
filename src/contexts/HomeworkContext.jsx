/**
 * HomeworkContext — manages homework attempt state for students.
 * Phase 3: assignedClassIds từ Supabase ✅
 * Phase 4: Submissions → Supabase ✅
 */
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth }       from './AuthContext';
import { useTeacher }    from './TeacherContext';
import { scoreAttempt, canViewAnswers } from '../data/homeworkData';
import { submissionApi } from '../services/api/submissionApi';

const HomeworkContext = createContext(null);

export const HomeworkProvider = ({ children }) => {
  const { user } = useAuth();
  const { assignments } = useTeacher();

  const studentId = user?.id;
  const classId   = user?.classId ?? user?.class_id;

  /* ── Submissions — Supabase ──────────────────────────────────────────── */
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [subsLoading,    setSubsLoading]    = useState(true);

  useEffect(() => {
    if (!studentId) {
      setSubsLoading(false);
      return;
    }
    submissionApi.getSubmissionsByStudent(studentId)
      .then(setAllSubmissions)
      .catch((err) => console.error('Failed to load submissions:', err))
      .finally(() => setSubsLoading(false));
  }, [studentId]);

  /* ── 1. Bài tập của học sinh này ─────────────────────────────────────── */
  const studentAssignments = useMemo(() => {
    if (!classId) return [];
    return assignments.filter((a) => {
      const assigned = Array.isArray(a.assignedClassIds) ? a.assignedClassIds : [];
      return assigned.includes(classId);
    });
  }, [assignments, classId]);

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
    return attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;
  }, [getAttempts]);

  const getLastAttempt = useCallback((assignmentId) => {
    const attempts = getAttempts(assignmentId);
    return attempts[attempts.length - 1] ?? null;
  }, [getAttempts]);

  const canView = useCallback((assignmentId) =>
    canViewAnswers(getAttempts(assignmentId)), [getAttempts]);

  /* ── Actions ─────────────────────────────────────────────────────────── */
  const submitAttempt = useCallback(async (assignmentId, answers) => {
    if (!studentId) return null;

    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return null;

    const prevAttempts = getAttempts(assignmentId);
    const score = scoreAttempt(assignment, answers);

    const newSubmission = await submissionApi.submitAttempt({
      studentId,
      assignmentId,
      score,
      answers,
      attemptNumber: prevAttempts.length + 1,
    });

    setAllSubmissions((prev) => [...prev, newSubmission]);
    return newSubmission;
  }, [studentId, assignments, getAttempts]);

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
