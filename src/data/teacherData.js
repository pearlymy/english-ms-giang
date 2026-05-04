/**
 * teacherData.js — Mock data for admin (Phase 1)
 * Replace with Supabase API in Phase 2.
 */

/* ── Courses ─────────────────────────────────────────────────────────────── */
export const COURSES = [
  /* ── Cấp 1 (Lớp 1 – 5) ── */
  {
    id: 'course-l1',
    name: 'Tiếng Anh Lớp 1',
    description: 'Làm quen chữ cái, số đếm, màu sắc và những câu chào hỏi đơn giản đầu tiên.',
    classGroup: 'Cấp 1',
    gradeLevel: 1,
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 60%, #fed7aa 100%)',
    totalStudents: 0,
  },
  {
    id: 'course-l2',
    name: 'Tiếng Anh Lớp 2',
    description: 'Xây dựng vốn từ vựng cơ bản về gia đình, đồ vật và các hoạt động hàng ngày.',
    classGroup: 'Cấp 1',
    gradeLevel: 2,
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 60%, #fde68a 100%)',
    totalStudents: 0,
  },
  {
    id: 'course-l3',
    name: 'Tiếng Anh Lớp 3',
    description: 'Phát âm chuẩn, ngữ pháp căn bản: câu đơn, động từ To Be và từ vựng chủ đề trường học.',
    classGroup: 'Cấp 1',
    gradeLevel: 3,
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 60%, #bbf7d0 100%)',
    totalStudents: 0,
  },
  {
    id: 'course-l4',
    name: 'Tiếng Anh Lớp 4',
    description: 'Mở rộng vốn từ, luyện nghe–nói chủ đề thiên nhiên, con vật và thời tiết.',
    classGroup: 'Cấp 1',
    gradeLevel: 4,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 60%, #a5f3fc 100%)',
    totalStudents: 0,
  },
  {
    id: 'course-l5',
    name: 'Tiếng Anh Lớp 5',
    description: 'Hoàn thiện kỹ năng Cấp 1: đọc hiểu đoạn ngắn, viết câu hoàn chỉnh và hội thoại cơ bản.',
    classGroup: 'Cấp 1',
    gradeLevel: 5,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 60%, #bfdbfe 100%)',
    totalStudents: 0,
  },

  /* ── Cấp 2 (Lớp 6 – 9) ── */
  {
    id: 'course-l6',
    name: 'Tiếng Anh Lớp 6',
    description: 'Bước vào Cấp 2: Present Simple, Present Continuous và từ vựng chủ đề cuộc sống đô thị.',
    classGroup: 'Cấp 2',
    gradeLevel: 6,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 60%, #ddd6fe 100%)',
    totalStudents: 0,
  },
  {
    id: 'course-l7',
    name: 'Tiếng Anh Lớp 7',
    description: 'Past Simple & Past Continuous, kỹ năng đọc hiểu trung cấp và viết đoạn văn mô tả.',
    classGroup: 'Cấp 2',
    gradeLevel: 7,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #db2777 0%, #ec4899 60%, #fbcfe8 100%)',
    totalStudents: 0,
  },
  {
    id: 'course-l8',
    name: 'Tiếng Anh Lớp 8',
    description: 'Future tenses, câu điều kiện, luyện viết email và hội thoại giao tiếp thực tế.',
    classGroup: 'Cấp 2',
    gradeLevel: 8,
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 60%, #99f6e4 100%)',
    totalStudents: 0,
  },
  {
    id: 'course-l9',
    name: 'Tiếng Anh Lớp 9',
    description: 'Ôn tập toàn diện, luyện đề thi vào lớp 10 và phát triển kỹ năng 4 kỹ năng NGHE–NÓI–ĐỌC–VIẾT.',
    classGroup: 'Cấp 2',
    gradeLevel: 9,
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 60%, #fecdd3 100%)',
    totalStudents: 0,
  },
];



/* ── Chapters ────────────────────────────────────────────────────────────── */
export const CHAPTERS = [
  // Course 1
  { id: 'ch-1', courseId: 'course-1', name: 'Chương 1 — Chào hỏi & Giới thiệu', order: 1 },
  { id: 'ch-2', courseId: 'course-1', name: 'Chương 2 — Số đếm & Màu sắc',       order: 2 },
  { id: 'ch-3', courseId: 'course-1', name: 'Chương 3 — Trường học',               order: 3 },
  { id: 'ch-4', courseId: 'course-1', name: 'Chương 4 — Ngữ pháp: Động từ To Be', order: 4 },
  { id: 'ch-5', courseId: 'course-1', name: 'Chương 5 — Từ vựng: Gia đình',       order: 5 },
  { id: 'ch-6', courseId: 'course-1', name: 'Chương 6 — Nghe hiểu',               order: 6 },
  // Course 2
  { id: 'ch-7', courseId: 'course-2', name: 'Chương 1 — Present Simple',           order: 1 },
  { id: 'ch-8', courseId: 'course-2', name: 'Chương 2 — Past Simple',               order: 2 },
];

/* ── Students ────────────────────────────────────────────────────────────── */
export const STUDENTS_SEED = [
  {
    id: 'student-1',
    username: 'hocsinh01',
    name: 'Học sinh Demo',
    email: 'hocsinh@hgenglish.vn',
    phone: '0909123456',
    password: '123456',
    classId: 'cls-1',
    enrolledCourseIds: ['course-1'],
    isActive: true,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-2',
    username: 'nguyenvanan',
    name: 'Nguyễn Văn An',
    email: 'an@hgenglish.vn',
    phone: '0901234567',
    password: '123456',
    classId: 'cls-1',
    enrolledCourseIds: ['course-1'],
    isActive: true,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-3',
    username: 'tranthibinh',
    name: 'Trần Thị Bình',
    email: 'binh@hgenglish.vn',
    phone: '0912345678',
    password: '123456',
    classId: 'cls-1',
    enrolledCourseIds: ['course-1'],
    isActive: true,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-4',
    username: 'leminhchau',
    name: 'Lê Minh Châu',
    email: 'chau@hgenglish.vn',
    phone: '0923456789',
    password: '123456',
    classId: 'cls-1',
    enrolledCourseIds: ['course-1'],
    isActive: true,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-5',
    username: 'phamdat',
    name: 'Phạm Thành Đạt',
    email: 'dat@hgenglish.vn',
    phone: '0934567890',
    password: '123456',
    classId: 'cls-1',
    enrolledCourseIds: ['course-1'],
    isActive: true,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-6',
    username: 'hoanglinh',
    name: 'Hoàng Thị Linh',
    email: 'linh@hgenglish.vn',
    phone: '0945678901',
    password: '123456',
    classId: 'cls-1',
    enrolledCourseIds: ['course-1'],
    isActive: false,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-7',
    username: 'vuminh',
    name: 'Vũ Quang Minh',
    email: 'minh@hgenglish.vn',
    phone: '0956789012',
    password: '123456',
    classId: 'cls-1',
    enrolledCourseIds: ['course-1'],
    isActive: true,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-8',
    username: 'dangthunga',
    name: 'Đặng Thu Nga',
    email: 'nga@hgenglish.vn',
    phone: '0967890123',
    password: '123456',
    classId: 'cls-1',
    enrolledCourseIds: ['course-1'],
    isActive: true,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-9',
    username: 'buiphuc',
    name: 'Bùi Hữu Phúc',
    email: 'phuc@hgenglish.vn',
    phone: '0978901234',
    password: '123456',
    classId: 'cls-1',
    enrolledCourseIds: ['course-1'],
    isActive: true,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-10',
    username: 'ngoquynh',
    name: 'Ngô Thanh Quỳnh',
    email: 'quynh@hgenglish.vn',
    phone: '0989012345',
    password: '123456',
    classId: 'cls-1',
    enrolledCourseIds: ['course-1'],
    isActive: false,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-11',
    username: 'duonganthu',
    name: 'Dương Anh Thư',
    email: 'thu@hgenglish.vn',
    phone: '0990123456',
    password: '123456',
    classId: 'cls-2',
    enrolledCourseIds: ['course-2'],
    isActive: true,
    role: 'student',
    avatar: null,
  },
  {
    id: 'student-12',
    username: 'lyminhxuan',
    name: 'Lý Minh Xuân',
    email: 'xuan@hgenglish.vn',
    phone: '0901234568',
    password: '123456',
    classId: 'cls-2',
    enrolledCourseIds: ['course-2'],
    isActive: true,
    role: 'student',
    avatar: null,
  },
];

/* ── Student localStorage helpers ────────────────────────────────────────── */
export const STUDENTS_STORAGE_KEY = 'hg_students';

export const loadStudents = () => {
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return STUDENTS_SEED;
};

export const saveStudents = (students) => {
  localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
};

/** Runtime STUDENTS — always read via loadStudents() in contexts */
export const STUDENTS = STUDENTS_SEED;



/* ── Mock student progress (for teacher to view) ─────────────────────────── */
export const MOCK_STUDENT_PROGRESS = {
  'student-1': {
    'hw-002': { score: 9, attempts: 1, submittedAt: '2026-04-26T09:00:00Z' },
    'hw-003': { score: 6, attempts: 1, submittedAt: '2026-04-18T15:30:00Z' },
    'hw-004': { score: 8, attempts: 2, submittedAt: '2026-04-09T14:00:00Z' },
    'hw-005': { score: 10, attempts: 1, submittedAt: '2026-03-30T08:00:00Z' },
    'hw-001': { score: 8, attempts: 1, submittedAt: '2026-05-01T10:00:00Z' },
  },
  'student-2': {
    'hw-002': { score: 10, attempts: 1, submittedAt: '2026-04-25T08:00:00Z' },
    'hw-003': { score: 8, attempts: 1, submittedAt: '2026-04-17T10:00:00Z' },
    'hw-004': { score: 9, attempts: 1, submittedAt: '2026-04-08T09:00:00Z' },
    'hw-005': { score: 10, attempts: 1, submittedAt: '2026-03-29T07:00:00Z' },
    'hw-001': { score: 9, attempts: 1, submittedAt: '2026-04-30T11:00:00Z' },
  },
  'student-3': {
    'hw-002': { score: 7, attempts: 2, submittedAt: '2026-04-27T14:00:00Z' },
    'hw-003': { score: 5, attempts: 1, submittedAt: '2026-04-19T13:00:00Z' },
    'hw-004': { score: 6, attempts: 2, submittedAt: '2026-04-10T16:00:00Z' },
    'hw-005': { score: 9, attempts: 1, submittedAt: '2026-03-31T09:00:00Z' },
  },
  'student-4': {
    'hw-002': { score: 8, attempts: 1, submittedAt: '2026-04-26T11:00:00Z' },
    'hw-004': { score: 7, attempts: 1, submittedAt: '2026-04-09T10:00:00Z' },
    'hw-005': { score: 8, attempts: 1, submittedAt: '2026-03-30T10:00:00Z' },
  },
  'student-5': {
    'hw-002': { score: 6, attempts: 2, submittedAt: '2026-04-28T09:00:00Z' },
    'hw-003': { score: 7, attempts: 1, submittedAt: '2026-04-20T08:00:00Z' },
    'hw-004': { score: 8, attempts: 1, submittedAt: '2026-04-11T11:00:00Z' },
    'hw-005': { score: 10, attempts: 1, submittedAt: '2026-03-31T11:00:00Z' },
    'hw-001': { score: 7, attempts: 1, submittedAt: '2026-05-01T14:00:00Z' },
  },
  'student-6': {
    'hw-005': { score: 9, attempts: 1, submittedAt: '2026-04-01T08:00:00Z' },
    'hw-004': { score: 9, attempts: 1, submittedAt: '2026-04-10T09:00:00Z' },
  },
  'student-7': {
    'hw-002': { score: 5, attempts: 3, submittedAt: '2026-04-29T16:00:00Z' },
    'hw-003': { score: 4, attempts: 2, submittedAt: '2026-04-21T15:00:00Z' },
  },
  'student-8': {
    'hw-002': { score: 9, attempts: 1, submittedAt: '2026-04-25T10:00:00Z' },
    'hw-003': { score: 8, attempts: 1, submittedAt: '2026-04-18T09:00:00Z' },
    'hw-004': { score: 9, attempts: 1, submittedAt: '2026-04-08T08:00:00Z' },
    'hw-005': { score: 10, attempts: 1, submittedAt: '2026-03-29T08:00:00Z' },
    'hw-001': { score: 10, attempts: 1, submittedAt: '2026-04-30T09:00:00Z' },
  },
  'student-9': {
    'hw-005': { score: 7, attempts: 1, submittedAt: '2026-04-02T10:00:00Z' },
  },
  'student-10': {
    'hw-002': { score: 8, attempts: 1, submittedAt: '2026-04-26T13:00:00Z' },
    'hw-003': { score: 7, attempts: 1, submittedAt: '2026-04-19T14:00:00Z' },
    'hw-004': { score: 8, attempts: 1, submittedAt: '2026-04-10T12:00:00Z' },
    'hw-005': { score: 9, attempts: 1, submittedAt: '2026-03-30T11:00:00Z' },
  },
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
/** Get avg score for a student across all submitted assignments */
export const getStudentAvgScore = (studentId) => {
  const progress = MOCK_STUDENT_PROGRESS[studentId];
  if (!progress) return null;
  const entries = Object.values(progress);
  if (!entries.length) return null;
  const total = entries.reduce((sum, e) => sum + e.score, 0);
  return (total / entries.length).toFixed(1);
};

/** Get number of submitted assignments for a student */
export const getStudentSubmittedCount = (studentId) => {
  const progress = MOCK_STUDENT_PROGRESS[studentId];
  if (!progress) return 0;
  return Object.keys(progress).length;
};

/** Count how many students submitted a given assignment */
export const getAssignmentSubmitCount = (assignmentId) => {
  return Object.values(MOCK_STUDENT_PROGRESS).filter(p => p[assignmentId]).length;
};
