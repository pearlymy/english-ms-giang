/**
 * AuthContext — Mock authentication (Phase 1)
 * Swap-ready for Supabase: replace login/logout logic only.
 *
 * Roles:
 *   'admin'   → cô Giang, redirect /app/dashboard
 *   'student' → học sinh,  redirect /app/courses
 *
 * Login accepts: email OR username (for students)
 */
import React, { createContext, useContext, useState } from 'react';
import { STUDENTS_SEED, STUDENTS_STORAGE_KEY } from '../data/teacherData';

/* ── Admin account (hardcoded, never in localStorage) ───────────────────── */
const ADMIN_USER = {
  id: 0,
  name: 'Hương Giang',
  email: 'giang@hgenglish.vn',
  password: '123456',
  role: 'admin',
  avatar: null,
};

/* ── Load student accounts (seeded from teacherData if no localStorage) ─── */
const loadStudentAccounts = () => {
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return STUDENTS_SEED;
};

export const ROLE_HOME = {
  admin:   '/app/dashboard',
  student: '/app/homework',
};

const STORAGE_KEY = 'hg_auth_user';

/* ── Context ────────────────────────────────────────────────────────────── */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!user;

  /**
   * login(identifier, password)
   * identifier = email OR username
   * Returns { ok: true, user } or { ok: false, error: string }
   */
  const login = async (identifier, password) => {
    await new Promise((r) => setTimeout(r, 600));

    const id = identifier.trim().toLowerCase();

    // 1. Check admin
    if (
      (id === ADMIN_USER.email.toLowerCase() || id === 'giang') &&
      password === ADMIN_USER.password
    ) {
      const { password: _pw, ...safeAdmin } = ADMIN_USER;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeAdmin));
      setUser(safeAdmin);
      return { ok: true, user: safeAdmin };
    }

    // 2. Check students (by email OR username), only if isActive
    const students = loadStudentAccounts();
    const found = students.find(
      (s) =>
        (s.email.toLowerCase() === id || s.username?.toLowerCase() === id) &&
        s.password === password
    );

    if (!found) {
      return { ok: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng.' };
    }

    if (!found.isActive) {
      return { ok: false, error: 'Tài khoản này đã bị vô hiệu hóa. Liên hệ giáo viên để được hỗ trợ.' };
    }

    const { password: _pw, ...safeUser } = found;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
    return { ok: true, user: safeUser };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

