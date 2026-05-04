/**
 * UserManagementContext.jsx
 * Phase 1: Classes → Supabase ✅
 * Phase 2: Students → Supabase ✅
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { classApi }   from '../services/api/classApi';
import { studentApi } from '../services/api/studentApi';

const UserManagementContext = createContext(null);

/* ── Provider ────────────────────────────────────────────────────────────── */
export const UserManagementProvider = ({ children }) => {

  /* ── Students — Supabase ─────────────────────────────────────────────── */
  const [students,        setStudents]        = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const refreshStudents = useCallback(async () => {
    try {
      const data = await studentApi.getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  }, []);

  useEffect(() => {
    studentApi.getStudents()
      .then(setStudents)
      .catch((err) => console.error('Failed to load students:', err))
      .finally(() => setStudentsLoading(false));
  }, []);

  /* ── Classes — Supabase ─────────────────────────────────────────────── */
  const [classes,       setClasses]       = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    classApi.getClasses()
      .then(setClasses)
      .catch((err) => console.error('Failed to load classes:', err))
      .finally(() => setClassesLoading(false));
  }, []);

  /* ── Class CRUD ─────────────────────────────────────────────────────── */
  const createClass = useCallback(async (data) => {
    const { gradeLevel, name, courseId } = data;
    const year     = new Date().getFullYear();
    const code     = classApi.generateClassCode(gradeLevel, classes);
    const sequence = classes.filter(
      (c) => c.year === year && c.gradeLevel === Number(gradeLevel)
    ).length + 1;

    const newClass = await classApi.createClass({
      id: `cls-${Date.now()}`,
      code, name,
      gradeLevel: Number(gradeLevel),
      year, sequence,
      courseId: courseId ?? null,
    });
    setClasses((prev) => [...prev, newClass]);
    return newClass;
  }, [classes]);

  const deleteClass = useCallback(async (id) => {
    await classApi.deleteClass(id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    // Xóa lớp trong Supabase sẽ set class_id = null cho students (ON DELETE SET NULL)
    // Cần refresh students để phản ánh thay đổi
    await refreshStudents();
  }, [refreshStudents]);

  const updateClass = useCallback(async (id, data) => {
    const updated = await classApi.updateClass(id, data);
    setClasses((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  /* ── Student CRUD ────────────────────────────────────────────────────── */
  const createStudent = useCallback(async (data) => {
    const newStudent = await studentApi.createStudent(data);
    setStudents((prev) => [newStudent, ...prev]);
    return newStudent;
  }, []);

  const updateStudent = useCallback(async (id, data) => {
    const updated = await studentApi.updateStudent(id, data);
    setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }, []);

  const toggleActive = useCallback(async (id) => {
    const current = students.find((s) => s.id === id);
    if (!current) return;
    const updated = await studentApi.toggleActive(id, current.isActive);
    setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }, [students]);

  const updatePassword = useCallback(async (id, newPassword) => {
    await studentApi.updatePassword(id, newPassword);
    // Không cần cập nhật state vì password không lưu trong profile
  }, []);

  const deleteStudent = useCallback(async (id) => {
    await studentApi.deleteStudent(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /* ── Queries ─────────────────────────────────────────────────────────── */
  const getStudentsByClass = useCallback(
    (classId) => students.filter((s) => s.classId === classId),
    [students]
  );

  const getClassById = useCallback(
    (id) => classes.find((c) => c.id === id),
    [classes]
  );

  const isLoading = studentsLoading || classesLoading;

  return (
    <UserManagementContext.Provider
      value={{
        // loading
        isLoading,
        classesLoading,
        studentsLoading,
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
        refreshStudents,
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
