/**
 * AdminStudentsPage.jsx — Student roster, grouped by class
 * Filters: search | class | month
 * Columns: Họ tên · Liên hệ · Điểm TB · Bài đã nộp
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Users, ChevronDown, ChevronRight,
  Phone, Mail, BookOpen, CalendarDays, Check,
  ClipboardList, AlertCircle,
} from 'lucide-react';
import { useUserManagement } from '../../contexts/UserManagementContext';
import styles from './AdminStudentsPage.module.css';

/* ── helpers ──────────────────────────────────────────────── */
const getInitials = (name) =>
  name ? name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?';

const AVATAR_COLORS = [
  ['#dbeafe', '#1d4ed8'],
  ['#e0f2fe', '#0369a1'],
  ['#fef9c3', '#b45309'],
  ['#dcfce7', '#15803d'],
  ['#cffafe', '#0e7490'],
  ['#ede9fe', '#6d28d9'],
];

/**
 * Đọc local assignments của một lớp từ localStorage.
 * Sprint 2: đọc từ class_assignments_{classId} (danh sách bài đã thực sự giao cho lớp),
 * join với course-level content để lấy chi tiết bài.
 * Fallback sang model cũ nếu chưa có data mới.
 */
function readLocalAssignmentsForClass(classId, gradeLevel) {
  try {
    // Sprint 2: class_assignments_{classId} — chỉ bài đã giao
    const classKey = `class_assignments_${classId}`;
    const classRaw = localStorage.getItem(classKey);
    if (classRaw) {
      const classRecords = JSON.parse(classRaw); // [{assignmentId, deadline, ...}]
      if (classRecords.length > 0) {
        // Join với course-level content
        const courseContent = (() => {
          if (!gradeLevel) return [];
          const courseKey = `localAssignments_course-lop${gradeLevel}`;
          const s = localStorage.getItem(courseKey);
          return s ? JSON.parse(s) : [];
        })();
        const assignedIds = new Set(classRecords.map(r => r.assignmentId));
        const joined = courseContent.filter(a => assignedIds.has(a.id));
        if (joined.length > 0) return joined;
        // Nếu join rỗng (bài chưa có trong course-level), trả về records dạng stub
        return classRecords.map(r => ({ id: r.assignmentId, title: r.assignmentName, isTest: false }));
      }
    }

    // Fallback Sprint 1: course-level key
    if (gradeLevel) {
      const courseKey = `localAssignments_course-lop${gradeLevel}`;
      const deletedKey = `localDeletedAssignments_course-lop${gradeLevel}`;
      const raw = localStorage.getItem(courseKey);
      if (raw) {
        const arr = JSON.parse(raw);
        const delRaw = localStorage.getItem(deletedKey);
        const deleted = delRaw ? JSON.parse(delRaw) : [];
        return arr.filter(a => !deleted.includes(a.id));
      }
    }

    // Fallback cũ: class-level key
    const storageKey = `localAssignments_class-${classId}`;
    const deletedKey = `localDeletedAssignments_class-${classId}`;
    const raw = localStorage.getItem(storageKey);
    const arr = raw ? JSON.parse(raw) : [];
    const delRaw = localStorage.getItem(deletedKey);
    const deleted = delRaw ? JSON.parse(delRaw) : [];
    const expectedCourse = `class-${classId}`;
    return arr.filter(a =>
      !deleted.includes(a.id) &&
      (a.courseId === expectedCourse || a.courseId === classId)
    );
  } catch {
    return [];
  }
}

/**
 * getStudentProgress(studentId, classId)
 * Tính tiến độ học viên trong 1 lớp cụ thể.
 * Chỉ tính assignments đã được giao cho lớp đó (từ localStorage).
 *
 * @returns {{ assignedCount: number, completedCount: number, progressPercent: number }}
 */
function getStudentProgress(studentId, classId, progressMap, gradeLevel) {
  const assignedItems = readLocalAssignmentsForClass(classId, gradeLevel);
  const assignedCount = assignedItems.length;

  if (assignedCount === 0) {
    return { assignedCount: 0, completedCount: 0, progressPercent: 0 };
  }

  const studentProgress = progressMap[studentId] ?? {};
  const assignedIds = new Set(assignedItems.map(a => a.id));
  const completedCount = Object.keys(studentProgress).filter(hwId => assignedIds.has(hwId)).length;
  const progressPercent = Math.round((completedCount / assignedCount) * 100);

  return { assignedCount, completedCount, progressPercent };
}

function computeStats(progress, assignmentsTotal, monthFilter) {
  const entries = Object.entries(progress);
  const filtered = monthFilter === 'all'
    ? entries
    : entries.filter(([, v]) => {
      if (!v.submittedAt) return false;
      const d = new Date(v.submittedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === monthFilter;
    });
  const submitted = filtered.length;
  const avg = submitted
    ? (filtered.reduce((s, [, v]) => s + v.score, 0) / submitted).toFixed(1)
    : null;
  return { avg, submitted, total: assignmentsTotal };
}

function deriveMonths(allProgress) {
  const set = new Set();
  Object.values(allProgress).forEach(prog => {
    Object.values(prog).forEach(v => {
      if (v.submittedAt) {
        const d = new Date(v.submittedAt);
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
  });
  return [...set].sort((a, b) => b.localeCompare(a));
}

/* ── Class Dropdown ─────────────────────────────────────── */
const ClassDropdown = ({ value, classes, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const options = [
    { value: 'all', label: 'Tất cả lớp', code: '' },
    ...classes.map(c => ({ value: c.id, label: c.name, code: c.code }))
  ];
  const isFiltered = value !== 'all';
  return (
    <div className={styles.monthDropdownWrap} ref={ref}>
      <button
        className={`${styles.monthDropdownTrigger} ${open ? styles.monthDropdownOpen : ''} ${isFiltered ? styles.monthDropdownFiltered : ''}`}
        onClick={() => setOpen(p => !p)} type="button"
      >
        <Users size={14} className={styles.monthDropdownIcon} />
        <span>Mã lớp</span>
        {isFiltered && <span className={styles.filterDot} />}
        <ChevronDown size={13} className={`${styles.monthDropdownChevron} ${open ? styles.monthDropdownChevronUp : ''}`} />
      </button>
      {open && (
        <div className={styles.monthDropdownMenu}>
          <div className={styles.monthDropdownHeader}>Lọc theo lớp</div>
          {options.map(opt => (
            <button
              key={opt.value}
              className={`${styles.monthDropdownItem} ${opt.value === value ? styles.monthDropdownItemActive : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }} type="button"
            >
              <span className={styles.classDropdownItemLabel}>
                {opt.label}
                {opt.code && <span className={styles.classDropdownCode}>{opt.code}</span>}
              </span>
              {opt.value === value && <Check size={13} className={styles.monthDropdownCheck} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Month Dropdown ─────────────────────────────────────── */
const MonthDropdown = ({ value, months, onChange, monthLabel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const options = [{ value: 'all', label: 'Tất cả tháng' }, ...months.map(m => ({ value: m, label: monthLabel(m) }))];
  const isFiltered = value !== 'all';
  return (
    <div className={styles.monthDropdownWrap} ref={ref}>
      <button
        className={`${styles.monthDropdownTrigger} ${open ? styles.monthDropdownOpen : ''} ${isFiltered ? styles.monthDropdownFiltered : ''}`}
        onClick={() => setOpen(p => !p)} type="button"
      >
        <CalendarDays size={14} className={styles.monthDropdownIcon} />
        <span>Tháng</span>
        {isFiltered && <span className={styles.filterDot} />}
        <ChevronDown size={13} className={`${styles.monthDropdownChevron} ${open ? styles.monthDropdownChevronUp : ''}`} />
      </button>
      {open && (
        <div className={styles.monthDropdownMenu}>
          <div className={styles.monthDropdownHeader}>Lọc theo tháng</div>
          {options.map(opt => (
            <button
              key={opt.value}
              className={`${styles.monthDropdownItem} ${opt.value === value ? styles.monthDropdownItemActive : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }} type="button"
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={13} className={styles.monthDropdownCheck} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export const AdminStudentsPage = () => {
  const { classes, students } = useUserManagement();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [collapsed, setCollapsed] = useState({});

  /* ── Đọc submissions từ localStorage (HomeworkContext: hw_submissions_${studentId}) ── */
  const allSubs = useMemo(() => {
    const result = [];
    students.forEach(s => {
      try {
        const raw = localStorage.getItem(`hw_submissions_${s.id}`);
        if (raw) {
          const subs = JSON.parse(raw);
          subs.forEach(sub => result.push({ ...sub, studentId: sub.studentId ?? s.id }));
        }
      } catch { }
    });
    return result;
  }, [students]);

  const subsLoading = false;
  const subsError = false;

  /* ── progressMap: { studentId: { hwId: { score, submittedAt } } } ── */
  const progressMap = useMemo(() => {
    const map = {};
    allSubs.forEach(sub => {
      if (!map[sub.studentId]) map[sub.studentId] = {};
      const cur = map[sub.studentId][sub.assignmentId];
      if (!cur || sub.score >= cur.score) {
        map[sub.studentId][sub.assignmentId] = { score: sub.score, submittedAt: sub.submittedAt };
      }
    });
    return map;
  }, [allSubs]);

  const months = useMemo(() => deriveMonths(progressMap), [progressMap]);

  /* ── Tổng assignments mỗi lớp — chỉ từ localStorage (local-only mode) ── */
  // Không dùng fallback "|| 1" hay "?? 1" — nếu chưa giao bài thì assignedCount = 0
  const totalAssignmentsByClass = useMemo(() => {
    const map = {};
    classes.forEach(c => {
      const localItems = readLocalAssignmentsForClass(c.id, c.gradeLevel);
      map[c.id] = localItems.length;
      if (localItems.length > 0) {
        console.log(`[AdminStudentsPage] "${c.name}" (${c.id}): ${localItems.length} bài tập`);
      }
    });
    return map;
  }, [classes]);

  /* ── filtered list ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.phone ?? '').includes(q) ||
        (s.username ?? '').toLowerCase().includes(q);
      const matchClass = filterClass === 'all' || s.classId === filterClass;
      return matchSearch && matchClass;
    });
  }, [students, search, filterClass]);

  /* ── group by classId ── */
  const groups = useMemo(() => {
    const map = {};
    const classesToShow = filterClass === 'all' ? classes : classes.filter(c => c.id === filterClass);
    classesToShow.forEach(c => {
      map[c.id] = { classId: c.id, className: c.name, classCode: c.code, students: [] };
    });
    filtered.forEach((s, i) => {
      const id = s.classId ?? 'unknown';
      if (!map[id]) {
        map[id] = { classId: id, className: 'Chưa phân lớp', classCode: '', students: [] };
      }
      map[id].students.push({ ...s, _colorIdx: i });
    });
    let result = Object.values(map);
    if (search.trim() !== '') result = result.filter(g => g.students.length > 0);
    return result.sort((a, b) => a.className.localeCompare(b.className, 'vi'));
  }, [filtered, classes, filterClass, search]);

  const toggleCollapse = (id) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  const monthLabel = (key) => {
    if (key === 'all') return 'Tất cả';
    const [y, m] = key.split('-');
    return `Tháng ${parseInt(m)}/${y}`;
  };

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroIcon}><Users size={28} strokeWidth={1.5} /></div>
        <div>
          <h1 className={styles.heroTitle}>Danh sách học viên</h1>
          <p className={styles.heroSub}>{students.length} học viên đã đăng ký · {classes.length} lớp</p>
        </div>
        {/* Nút debug/dọn localStorage cũ */}
        <button
          type="button"
          onClick={() => {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('localAssignments_'));
            if (keys.length === 0) { alert('Không có data bài tập nào trong localStorage.'); return; }
            const summary = keys.map(k => {
              try {
                const arr = JSON.parse(localStorage.getItem(k)) || [];
                return `• ${k}\n  → ${arr.length} bài tập`;
              } catch { return `• ${k}: lỗi parse`; }
            }).join('\n');
            const confirmed = window.confirm(
              `Data bài tập trong localStorage:\n\n${summary}\n\nBấm OK để XÓA TẤT CẢ data test cũ.\nBấm Huỷ để giữ nguyên.`
            );
            if (confirmed) {
              keys.forEach(k => localStorage.removeItem(k));
              Object.keys(localStorage).filter(k => k.startsWith('localDeletedAssignments_')).forEach(k => localStorage.removeItem(k));
              alert('Đã dọn xong. Hãy refresh trang.');
            }
          }}
          style={{
            marginLeft: 'auto', flexShrink: 0,
            fontSize: 11, color: '#9ca3af',
            background: 'transparent', border: '1px dashed #d1d5db',
            borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
          }}
        >
          🔧 Kiểm tra data test
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Tìm tên, email, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.lovGroup}>
          <ClassDropdown value={filterClass} classes={classes} onChange={setFilterClass} />
          <MonthDropdown value={filterMonth} months={months} onChange={setFilterMonth} monthLabel={monthLabel} />
        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span className={styles.colName}>Học viên</span>
          <span className={styles.colContact}>Liên hệ</span>
          <span className={styles.colScore}>
            Điểm TB{filterMonth !== 'all' && <span className={styles.monthTag}>{monthLabel(filterMonth)}</span>}
          </span>
          <span className={styles.colSubmit}>
            Bài đã nộp
            {subsError && (
              <span title="Không thể tải dữ liệu nộp bài" style={{ marginLeft: 4, color: '#f59e0b', verticalAlign: 'middle' }}>
                <AlertCircle size={12} />
              </span>
            )}
          </span>
          <span className={styles.colStatus}>Trạng thái</span>
          <span className={styles.colAction}>Thao tác</span>
        </div>

        {groups.length === 0 && <div className={styles.empty}>Không tìm thấy học viên nào.</div>}

        {groups.map(group => {
          const isOpen = !collapsed[group.classId];
          const totalForClass = totalAssignmentsByClass[group.classId] ?? 0;
          return (
            <div key={group.classId} className={styles.classGroup}>
              <button className={styles.groupHeader} onClick={() => toggleCollapse(group.classId)}>
                <span className={styles.groupChevron}>
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>
                <span className={styles.groupName}>{group.className}</span>
                <span className={styles.groupCode}>{group.classCode}</span>
                <span className={styles.groupCount}>{group.students.length} học viên</span>
                {totalForClass > 0 && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                    color: '#6366f1', background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    padding: '2px 8px', borderRadius: 20,
                    display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  }}>
                    <ClipboardList size={10} /> {totalForClass} bài tập
                  </span>
                )}
              </button>

              {isOpen && group.students.map((student) => {
                const studentProgressMap = progressMap[student.id] ?? {};
                const cId = student.classId ?? student.class_id;
                // Dùng getStudentProgress để đảm bảo assignedCount không bị ép thành 1
                const { assignedCount, completedCount, progressPercent } = getStudentProgress(
                  student.id, cId, progressMap,
                  classes.find(c => c.id === cId)?.gradeLevel
                );
                const { avg } = computeStats(studentProgressMap, assignedCount, filterMonth);

                const [bg, color] = AVATAR_COLORS[student._colorIdx % AVATAR_COLORS.length];
                const scoreColor = avg >= 8 ? 'var(--color-success)'
                  : avg >= 6 ? 'var(--color-warning)'
                    : avg ? 'var(--color-error)'
                      : 'var(--color-text-tertiary)';

                return (
                  <div
                    key={student.id}
                    className={styles.tableRow}
                    onClick={() => navigate(`/app/students/${student.id}`)}
                  >
                    {/* Họ tên */}
                    <div className={styles.colName}>
                      <div className={styles.studentCell}>
                        <div className={styles.avatar} style={{ background: bg, color }}>
                          {getInitials(student.name)}
                        </div>
                        <div className={styles.studentInfo}>
                          <span className={styles.studentName}>{student.name}</span>
                          <span className={styles.studentSub}>@{student.username}</span>
                        </div>
                      </div>
                    </div>

                    {/* Liên hệ */}
                    <div className={styles.colContact}>
                      <div className={styles.contactStack}>
                        {student.phone && (
                          <span className={styles.contactRow}>
                            <Phone size={11} />{student.phone}
                          </span>
                        )}
                        <span className={styles.contactRow}>
                          <Mail size={11} />
                          {student.email ?? <em style={{ color: 'var(--color-text-tertiary)' }}>Chưa có email</em>}
                        </span>
                      </div>
                    </div>

                    {/* Điểm TB */}
                    <div className={styles.colScore}>
                      <span className={styles.avgScore} style={{ color: scoreColor }}>
                        {avg ? `${avg}/10` : '—'}
                      </span>
                    </div>

                    {/* Tiến độ */}
                    <div className={styles.colSubmit}>
                      {assignedCount === 0 ? (
                        <span className={styles.dashText}>—</span>
                      ) : subsLoading ? (
                        <span className={styles.dashText}>…</span>
                      ) : (
                        <div className={styles.submittedCell}>
                          <div className={styles.submittedTop}>
                            <span className={styles.submittedCount}>
                              <BookOpen size={12} /> {completedCount}/{assignedCount}
                            </span>
                            <span className={styles.submittedPct}>{progressPercent}%</span>
                          </div>
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progressFill}
                              style={{
                                width: `${progressPercent}%`,
                                background: progressPercent === 100 ? 'var(--color-success, #10b981)'
                                  : progressPercent >= 50 ? 'var(--color-primary, #3b82f6)'
                                    : progressPercent > 0 ? 'var(--color-warning, #f59e0b)'
                                      : '#e5e7eb',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trạng thái */}
                    <div className={styles.colStatus}>
                      {assignedCount === 0 ? (
                        <span className={`${styles.badge} ${styles.badgeGray}`}>Chưa giao bài</span>
                      ) : progressPercent === 100 ? (
                        <span className={`${styles.badge} ${styles.badgeGreen}`}>Hoàn thành</span>
                      ) : completedCount > 0 ? (
                        <span className={`${styles.badge} ${styles.badgeOrange}`}>Đang làm</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeRed}`}>Chưa nộp</span>
                      )}
                    </div>

                    {/* Thao tác */}
                    <div className={styles.colAction}>
                      <button className={styles.actionBtn}>Xem chi tiết</button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
