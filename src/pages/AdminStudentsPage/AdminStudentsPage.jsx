/**
 * AdminStudentsPage.jsx — Student roster, grouped by class
 * Filters: search | class | month
 * Columns: Họ tên · Email · SĐT · Điểm TB · Bài đã nộp
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ChevronDown, ChevronRight, Phone, Mail, BookOpen, CalendarDays, Check } from 'lucide-react';
import { useTeacher } from '../../contexts/TeacherContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { MOCK_STUDENT_PROGRESS } from '../../data/teacherData';
import { ASSIGNMENTS } from '../../data/homeworkData';
import styles from './AdminStudentsPage.module.css';

/* ── helpers ──────────────────────────────────────────────── */
const getInitials = (name) =>
  name ? name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?';

const AVATAR_COLORS = [
  ['var(--brand-100)',   'var(--brand-700)'],
  ['#ede9fe', '#6d28d9'],
  ['#fef9c3', '#b45309'],
  ['#dcfce7', '#15803d'],
  ['#fce7f3', '#9d174d'],
  ['#cffafe', '#0e7490'],
];

/**
 * Compute avg score + submitted count for a student,
 * optionally filtered to a given month (format: "YYYY-MM" or "all")
 */
function computeStats(studentId, monthFilter) {
  const progress = MOCK_STUDENT_PROGRESS[studentId] || {};
  const entries = Object.entries(progress); // [hwId, { score, submittedAt }]

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

  // Total assignable hw for progress bar denominator
  const total = ASSIGNMENTS.length;
  return { avg, submitted, total };
}

/** Derive all months that appear in MOCK_STUDENT_PROGRESS */
function deriveMonths() {
  const set = new Set();
  Object.values(MOCK_STUDENT_PROGRESS).forEach(prog => {
    Object.values(prog).forEach(v => {
      if (v.submittedAt) {
        const d = new Date(v.submittedAt);
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
  });
  return [...set].sort((a, b) => b.localeCompare(a));
}

/* ────────────────────────────────────────────────────────────
CUSTOM CLASS DROPDOWN
──────────────────────────────────────────────────────────── */
const ClassDropdown = ({ value, classes, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
    { value: 'all', label: 'Tất cả lớp' },
    ...classes.map(c => ({ value: c.id, label: c.name }))
  ];
  const selected = options.find(o => o.value === value) ?? options[0];

  return (
    <div className={styles.monthDropdownWrap} ref={ref}>
      <button
        className={`${styles.monthDropdownTrigger} ${open ? styles.monthDropdownOpen : ''}`}
        onClick={() => setOpen(p => !p)}
        type="button"
      >
        <Users size={14} className={styles.monthDropdownIcon} />
        <span>{selected.label}</span>
        <ChevronDown size={13} className={`${styles.monthDropdownChevron} ${open ? styles.monthDropdownChevronUp : ''}`} />
      </button>

      {open && (
        <div className={styles.monthDropdownMenu}>
          <div className={styles.monthDropdownHeader}>Lọc theo lớp</div>
          {options.map(opt => (
            <button
              key={opt.value}
              className={`${styles.monthDropdownItem} ${opt.value === value ? styles.monthDropdownItemActive : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              type="button"
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

/* ────────────────────────────────────────────────────────────
CUSTOM MONTH DROPDOWN
──────────────────────────────────────────────────────────── */
const MonthDropdown = ({ value, months, onChange, monthLabel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [{ value: 'all', label: 'Tất cả tháng' }, ...months.map(m => ({ value: m, label: monthLabel(m) }))];
  const selected = options.find(o => o.value === value) ?? options[0];

  return (
    <div className={styles.monthDropdownWrap} ref={ref}>
      <button
        className={`${styles.monthDropdownTrigger} ${open ? styles.monthDropdownOpen : ''}`}
        onClick={() => setOpen(p => !p)}
        type="button"
      >
        <CalendarDays size={14} className={styles.monthDropdownIcon} />
        <span>{selected.label}</span>
        <ChevronDown size={13} className={`${styles.monthDropdownChevron} ${open ? styles.monthDropdownChevronUp : ''}`} />
      </button>

      {open && (
        <div className={styles.monthDropdownMenu}>
          <div className={styles.monthDropdownHeader}>Lọc theo tháng</div>
          {options.map(opt => (
            <button
              key={opt.value}
              className={`${styles.monthDropdownItem} ${opt.value === value ? styles.monthDropdownItemActive : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              type="button"
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
  const {} = useTeacher();
  const { classes, students } = useUserManagement();
  const navigate   = useNavigate();

  const [search,      setSearch]      = useState('');
  const [filterClass, setFilterClass] = useState('all'); // classId | 'all'
  const [filterMonth, setFilterMonth] = useState('all'); // "YYYY-MM" | 'all'
  const [collapsed,   setCollapsed]   = useState({});    // { classId: bool }

  const months = useMemo(() => deriveMonths(), []);

  /* ── filtered flat list ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(q) ||
                          s.email.toLowerCase().includes(q) ||
                          (s.phone ?? '').includes(q);
      const matchClass  = filterClass === 'all' || s.classId === filterClass;
      return matchSearch && matchClass;
    });
  }, [students, search, filterClass]);

  /* ── group by classId ── */
  const groups = useMemo(() => {
    const map = {};
    
    // 1. Initialize all classes matching the filter
    const classesToShow = filterClass === 'all' 
      ? classes 
      : classes.filter(c => c.id === filterClass);

    classesToShow.forEach(c => {
      map[c.id] = {
        classId: c.id,
        className: c.name,
        classCode: c.code,
        students: [],
      };
    });

    // 2. Assign students to classes
    filtered.forEach((s, i) => {
      const id = s.classId ?? 'unknown';
      if (!map[id]) {
        map[id] = {
          classId: id,
          className: 'Chưa phân lớp',
          classCode: '',
          students: [],
        };
      }
      map[id].students.push({ ...s, _colorIdx: i });
    });

    // 3. Convert to array
    let result = Object.values(map);

    // 4. Hide empty classes if user is searching
    if (search.trim() !== '') {
      result = result.filter(g => g.students.length > 0);
    }

    return result.sort((a, b) => a.className.localeCompare(b.className, 'vi'));
  }, [filtered, classes, filterClass, search]);

  const toggleCollapse = (id) =>
    setCollapsed(p => ({ ...p, [id]: !p[id] }));

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
      </div>

      {/* ── Filter bar ── */}
      <div className={styles.filterBar}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Tìm tên, email, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Class + Month LOV filters */}
        <div className={styles.lovGroup}>
          <ClassDropdown
            value={filterClass}
            classes={classes}
            onChange={setFilterClass}
          />
          <MonthDropdown
            value={filterMonth}
            months={months}
            onChange={setFilterMonth}
            monthLabel={monthLabel}
          />
        </div>
      </div>

      {/* ── Table header (sticky) ── */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span className={styles.colName}>Học viên</span>
          <span className={styles.colContact}>Liên hệ</span>
          <span className={styles.colScore}>
            Điểm TB{filterMonth !== 'all' && <span className={styles.monthTag}>{monthLabel(filterMonth)}</span>}
          </span>
          <span className={styles.colSubmit}>Bài đã nộp</span>
          <span />
        </div>

        {/* ── Groups ── */}
        {groups.length === 0 && (
          <div className={styles.empty}>Không tìm thấy học viên nào.</div>
        )}

        {groups.map(group => {
          const isOpen = !collapsed[group.classId];
          return (
            <div key={group.classId} className={styles.classGroup}>
              {/* Group header */}
              <button
                className={styles.groupHeader}
                onClick={() => toggleCollapse(group.classId)}
              >
                <span className={styles.groupChevron}>
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>
                <span className={styles.groupName}>{group.className}</span>
                <span className={styles.groupCode}>{group.classCode}</span>
                <span className={styles.groupCount}>{group.students.length} học viên</span>
              </button>

              {/* Student rows */}
              {isOpen && group.students.map((student, i) => {
                const { avg, submitted, total } = computeStats(student.id, filterMonth);
                const [bg, color] = AVATAR_COLORS[student._colorIdx % AVATAR_COLORS.length];
                const scoreColor = avg >= 8 ? 'var(--color-success)'
                                 : avg >= 6 ? 'var(--color-warning)'
                                 : avg       ? 'var(--color-error)'
                                 : 'var(--color-text-tertiary)';
                const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

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
                            <Phone size={11} />
                            {student.phone}
                          </span>
                        )}
                        <span className={styles.contactRow}>
                          <Mail size={11} />
                          {student.email}
                        </span>
                      </div>
                    </div>

                    {/* Điểm TB */}
                    <div className={styles.colScore}>
                      <span className={styles.avgScore} style={{ color: scoreColor }}>
                        {avg ? `${avg}/10` : '—'}
                      </span>
                    </div>

                    {/* Bài đã nộp */}
                    <div className={styles.colSubmit}>
                      <div className={styles.submittedCell}>
                        <div className={styles.submittedTop}>
                          <span className={styles.submittedCount}>
                            <BookOpen size={12} /> {submitted}/{total}
                          </span>
                          <span className={styles.submittedPct}>{pct}%</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: `${pct}%`,
                              background: pct === 100 ? 'var(--color-success)'
                                        : pct >= 50 ? 'var(--color-primary)'
                                        : 'var(--color-warning)',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={14} className={styles.arrowIcon} />
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
