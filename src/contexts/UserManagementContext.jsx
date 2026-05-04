/**
 * UserManagementContext.jsx
 * Manages Classes and Student accounts for admin (Phase 1 — localStorage).
 * Replace with Supabase calls in Phase 2.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CLASSES,
  CLASSES_STORAGE_KEY,
  loadClasses,
  saveClasses,
  generateClassCode,
} from '../data/classData';
import {
  STUDENTS_SEED,
  STUDENTS_STORAGE_KEY,
  loadStudents,
  saveStudents,
} from '../data/teacherData';

const UserManagementContext = createContext(null);

/* ── ID generators ─────────────────────────────────────────────────────── */
const nextId = (items, prefix) => {
  const nums = items
    .map((i) => parseInt(i.id.replace(prefix, ''), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${max + 1}`;
};

/* ── Provider ──────────────────────────────────────────────────────────── */
export const UserManagementProvider = ({ children }) => {
  const [classes,  setClasses]  = useState(() => loadClasses());
  const [students, setStudents] = useState(() => loadStudents());

  /* ── Class CRUD ── */
  const createClass = useCallback((data) => {
    const { gradeLevel, name, courseId } = data;
    const code = generateClassCode(gradeLevel, classes);
    const year = new Date().getFullYear();
    const sameGroup = classes.filter(
      (c) => c.year === year && c.gradeLevel === Number(gradeLevel)
    );
    const newClass = {
      id: nextId(classes, 'cls-'),
      code,
      name,
      gradeLevel: Number(gradeLevel),
      year,
      sequence: sameGroup.length + 1,
      courseId,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const updated = [...classes, newClass];
    setClasses(updated);
    saveClasses(updated);
    return newClass;
  }, [classes]);

  const deleteClass = useCallback((id) => {
    // Cascade: remove all students that belong to this class
    const updatedStudents = students.filter((s) => s.classId !== id);
    setStudents(updatedStudents);
    saveStudents(updatedStudents);
    // Then remove the class itself
    const updated = classes.filter((c) => c.id !== id);
    setClasses(updated);
    saveClasses(updated);
  }, [classes, students]);

  const updateClass = useCallback((id, data) => {
    const updated = classes.map((c) => c.id === id ? { ...c, ...data } : c);
    setClasses(updated);
    saveClasses(updated);
  }, [classes]);

  /* ── Student CRUD ── */
  const createStudent = useCallback((data) => {
    const newStudent = {
      id: nextId(students, 'student-'),
      ...data,
      role: 'student',
      avatar: null,
      enrolledCourseIds: [],
    };
    // Derive enrolledCourseIds from classId
    const cls = classes.find((c) => c.id === data.classId);
    if (cls) newStudent.enrolledCourseIds = [cls.courseId];

    const updated = [newStudent, ...students];
    setStudents(updated);
    saveStudents(updated);
    return newStudent;
  }, [students, classes]);

  const updateStudent = useCallback((id, data) => {
    const updated = students.map((s) => {
      if (s.id !== id) return s;
      const merged = { ...s, ...data };
      // Re-derive enrolledCourseIds if classId changed
      if (data.classId && data.classId !== s.classId) {
        const cls = classes.find((c) => c.id === data.classId);
        merged.enrolledCourseIds = cls ? [cls.courseId] : s.enrolledCourseIds;
      }
      return merged;
    });
    setStudents(updated);
    saveStudents(updated);
  }, [students, classes]);

  const toggleActive = useCallback((id) => {
    const updated = students.map((s) =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    setStudents(updated);
    saveStudents(updated);
  }, [students]);

  const updatePassword = useCallback((id, newPassword) => {
    const updated = students.map((s) =>
      s.id === id ? { ...s, password: newPassword } : s
    );
    setStudents(updated);
    saveStudents(updated);
  }, [students]);

  const deleteStudent = useCallback((id) => {
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    saveStudents(updated);
  }, [students]);

  /* ── Queries ── */
  const getStudentsByClass = useCallback(
    (classId) => students.filter((s) => s.classId === classId),
    [students]
  );

  const getClassById = useCallback(
    (id) => classes.find((c) => c.id === id),
    [classes]
  );

  return (
    <UserManagementContext.Provider
      value={{
        // data
        classes,
        students,
        // class actions
        createClass,
        updateClass,
        deleteClass,
        // student actions
        createStudent,
        updateStudent,
        deleteStudent,
        toggleActive,
        updatePassword,
        // queries
        getStudentsByClass,
        getClassById,
      }}
    >
      {children}
    </UserManagementContext.Provider>
  );
};

export const useUserManagement = () => {
  const ctx = useContext(UserManagementContext);
  if (!ctx) throw new Error('useUserManagement must be inside <UserManagementProvider>');
  return ctx;
};
