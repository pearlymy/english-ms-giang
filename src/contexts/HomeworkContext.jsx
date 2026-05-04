/**
 * HomeworkContext — manages homework attempt state reading from global submissions.
 */
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useTeacher } from './TeacherContext';
import { scoreAttempt, canViewAnswers } from '../data/homeworkData';
import { loadSubmissions, saveSubmissions, SUBMISSIONS_STORAGE_KEY } from '../data/submissionData';

const HomeworkContext = createContext(null);

export const HomeworkProvider = ({ children }) => {
  const { user } = useAuth();
  const { assignments } = useTeacher();
  
  // Only students use HomeworkContext effectively.
  const studentId = user?.id;
  const classId = user?.classId;

  // We keep a local state of all submissions to trigger re-renders when student submits
  const [allSubmissions, setAllSubmissions] = useState(() => loadSubmissions());

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === SUBMISSIONS_STORAGE_KEY && e.newValue) {
        setAllSubmissions(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 1. Filter assignments that are actually assigned to this student's class
  const studentAssignments = useMemo(() => {
    if (!classId) return [];
    return assignments.filter(a => {
      if (a.status === 'draft') return false;
      const assigned = Array.isArray(a.assignedClassIds) ? a.assignedClassIds : [];
      return assigned.includes(classId);
    });
  }, [assignments, classId]);

  // 2. Build progress object for this student from allSubmissions
  const progress = useMemo(() => {
    if (!studentId) return {};
    
    const studentSubs = allSubmissions.filter(s => s.studentId === studentId);
    const prog = {};
    
    studentSubs.forEach(sub => {
      if (!prog[sub.assignmentId]) {
        prog[sub.assignmentId] = { attempts: [] };
      }
      prog[sub.assignmentId].attempts.push(sub);
    });

    // Sort attempts by attemptNumber just in case
    Object.values(prog).forEach(p => {
      p.attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
    });

    return prog;
  }, [allSubmissions, studentId]);

  /* ── Derived helpers ── */
  const getAttempts = (assignmentId) =>
    progress[assignmentId]?.attempts ?? [];

  const getStatus = (assignmentId) => {
    const attempts = getAttempts(assignmentId);
    if (!attempts.length) return 'pending';
    return 'submitted';
  };

  const getBestScore = (assignmentId) => {
    const attempts = getAttempts(assignmentId);
    if (!attempts.length) return null;
    return Math.max(...attempts.map((a) => a.score));
  };

  const getLastAttempt = (assignmentId) => {
    const attempts = getAttempts(assignmentId);
    return attempts[attempts.length - 1] ?? null;
  };

  const canView = (assignmentId) =>
    canViewAnswers(getAttempts(assignmentId));

  /* ── Actions ── */
  const submitAttempt = (assignmentId, answers) => {
    if (!studentId) return null;

    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return null;

    const prevAttempts = getAttempts(assignmentId);
    const score = scoreAttempt(assignment, answers);
    
    const newSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      studentId,
      assignmentId,
      score,
      answers,
      attemptNumber: prevAttempts.length + 1,
      submittedAt: new Date().toISOString(),
    };

    const updatedSubmissions = [...allSubmissions, newSubmission];
    
    setAllSubmissions(updatedSubmissions);
    saveSubmissions(updatedSubmissions);
    
    return newSubmission;
  };

  /* ── Aggregate stats ── */
  const stats = useMemo(() => {
    const total = studentAssignments.length;
    const done = studentAssignments.filter((a) => getStatus(a.id) === 'submitted').length;
    const pending = total - done;
    const scores = studentAssignments.map((a) => getBestScore(a.id)).filter((s) => s !== null);
    const avgScore = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
    return { total, done, pending, avgScore };
  }, [studentAssignments, progress]);

  return (
    <HomeworkContext.Provider
      value={{
        assignments: studentAssignments,
        progress,
        stats,
        getAttempts,
        getStatus,
        getBestScore,
        getLastAttempt,
        canView,
        submitAttempt,
      }}
    >
      {children}
    </HomeworkContext.Provider>
  );
};

export const useHomework = () => {
  const ctx = useContext(HomeworkContext);
  if (!ctx) throw new Error('useHomework must be used inside <HomeworkProvider>');
  return ctx;
};
