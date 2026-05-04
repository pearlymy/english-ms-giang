/**
 * classData.js — Mock class data (Phase 1)
 * Replace with Supabase in Phase 2.
 *
 * Class code format: YYYY.GG.SS
 *   YYYY = year
 *   GG   = grade level, 2 digits (grade 7 → "07")
 *   SS   = sequence (1st class of grade in that year → "01")
 */

/* ── Code generator ──────────────────────────────────────────────────────── */
/**
 * generateClassCode(gradeLevel, existingClasses)
 * Returns the next available code for a given grade in the current year.
 */
export const generateClassCode = (gradeLevel, existingClasses = []) => {
  const year = new Date().getFullYear();
  const grade = String(gradeLevel).padStart(2, '0');
  // count how many classes with same year+grade already exist
  const sameGroup = existingClasses.filter(
    (c) => c.year === year && c.gradeLevel === Number(gradeLevel)
  );
  const seq = String(sameGroup.length + 1).padStart(2, '0');
  return `${year}.${grade}.${seq}`;
};

/* ── Seed data ───────────────────────────────────────────────────────────── */
export const CLASSES = [
  {
    id: 'cls-1',
    code: '2026.03.01',
    name: 'Lớp 3',
    gradeLevel: 3,
    year: 2026,
    sequence: 1,
    courseId: 'course-1',
    createdAt: '2026-01-15',
  },
  {
    id: 'cls-2',
    code: '2026.07.01',
    name: 'Lớp 7',
    gradeLevel: 7,
    year: 2026,
    sequence: 1,
    courseId: 'course-2',
    createdAt: '2026-02-10',
  },
];

/* ── Storage key ─────────────────────────────────────────────────────────── */
export const CLASSES_STORAGE_KEY = 'hg_classes';

/**
 * loadClasses() — load from localStorage, fall back to seed
 */
export const loadClasses = () => {
  try {
    const raw = localStorage.getItem(CLASSES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return CLASSES;
};

/**
 * saveClasses(classes) — persist to localStorage
 */
export const saveClasses = (classes) => {
  localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(classes));
};
