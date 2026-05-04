/**
 * submissionData.js — Manages real student submissions (Phase 1: localStorage)
 */
import { STUDENTS_STORAGE_KEY, STUDENTS_SEED } from './teacherData';

export const SUBMISSIONS_STORAGE_KEY = 'hg_submissions';

// Helper to load students because submission generation needs to know valid students
const loadStudentsSync = () => {
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return STUDENTS_SEED;
};

// Helper to load assignments
const loadAssignmentsSync = () => {
  try {
    const raw = localStorage.getItem('hg_assignments');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

/**
 * Generate 50-100 realistic submissions for students based on assigned assignments.
 */
const generateSeedSubmissions = () => {
  const students = loadStudentsSync();
  const assignments = loadAssignmentsSync();
  const submissions = [];

  // Filter assignments that are actually assigned to classes
  const assignedHws = assignments.filter(a => a.assignedClassIds && a.assignedClassIds.length > 0);

  if (assignedHws.length === 0 || students.length === 0) return [];

  // For each student, randomly do some of their assigned homeworks
  students.forEach(student => {
    // What is assigned to this student?
    const studentHws = assignedHws.filter(a => a.assignedClassIds.includes(student.classId));
    
    // Do about 70% of them
    studentHws.forEach(hw => {
      if (Math.random() > 0.3) {
        // Did it! Let's generate 1 or 2 attempts
        const numAttempts = Math.random() > 0.8 ? 2 : 1;
        
        for (let i = 1; i <= numAttempts; i++) {
          // Generate a score: 5 to 10
          const score = Math.floor(Math.random() * 6) + 5;
          // Generate a submission date (random within last 14 days)
          const daysAgo = Math.floor(Math.random() * 14);
          const submittedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

          submissions.push({
            id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            studentId: student.id,
            assignmentId: hw.id,
            score,
            answers: {}, // dummy answers
            attemptNumber: i,
            submittedAt
          });
        }
      }
    });
  });

  return submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

export const loadSubmissions = () => {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  
  // First time: generate seed submissions as if users did them
  const seeds = generateSeedSubmissions();
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(seeds));
  return seeds;
};

export const saveSubmissions = (submissions) => {
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
};
