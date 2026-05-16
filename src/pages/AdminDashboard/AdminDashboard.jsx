import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ClipboardList, Clock, ChevronDown,
  AlertTriangle, Award, Check, Eye, Flag,
  BookOpen, GraduationCap, CheckCircle, Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacher } from '../../contexts/TeacherContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import styles from './AdminDashboard.module.css';

const formatDate = (iso) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const getInitials = (n) => n ? n.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?';

const AVATAR_COLORS = [
  ['#ede9fe','#6d28d9'], ['#dcfce7','#15803d'], ['#dbeafe','#1d4ed8'],
  ['#cffafe','#0e7490'], ['#fef9c3','#b45309'], ['#e0e7ff','#3730a3'],
  ['#fce7f3','#9d174d'], ['#fff7ed','#c2410c'],
];
const ALERT_CFG = {
  high:   { fill: '#e26b59' },
  medium: { fill: '#e8c468' },
  low:    { fill: '#6bb094' },
};
const LVL = { high: 0, medium: 1, low: 2 };
const RANK_MEDALS = ['🥇','🥈','🥉'];

function readSubs(students) {
  const r = [];
  students.forEach(s => {
    try {
      const raw = localStorage.getItem(`hw_submissions_${s.id}`);
      if (raw) JSON.parse(raw).forEach(sub => r.push({ ...sub, studentId: sub.studentId ?? s.id }));
    } catch {}
  });
  return r;
}
function readClassRecs(classId) {
  try { const r = localStorage.getItem(`class_assignments_${classId}`); return r ? JSON.parse(r) : []; } catch { return []; }
}

const FilterDropdown = ({ icon: Icon, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const sel = options.find(o => o.value === value);
  const filtered = value !== options[0]?.value;
  return (
    <div className={styles.dropWrap} ref={ref}>
      <button type="button" className={`${styles.dropTrigger} ${filtered ? styles.dropActive : ''}`} onClick={() => setOpen(p => !p)}>
        {Icon && <Icon size={14} />}
        <span>{sel?.label}</span>
        {filtered && <span className={styles.filterDot} />}
        <ChevronDown size={13} className={`${styles.dropChev} ${open ? styles.dropChevUp : ''}`} />
      </button>
      {open && (
        <div className={styles.dropMenu}>
          {options.map(o => (
            <button key={o.value} type="button"
              className={`${styles.dropItem} ${o.value === value ? styles.dropItemOn : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}>
              <span>{o.label}</span>
              {o.value === value && <Check size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { assignments } = useTeacher();
  const { classes, students } = useUserManagement();
  const navigate = useNavigate();

  const [filterClass, setFilterClass] = useState('all');
  const [filterTime, setFilterTime] = useState('all');
  const [searchStudent, setSearchStudent] = useState('');
  const [expandedGrading, setExpandedGrading] = useState(false);
  const [expandedTop3, setExpandedTop3] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState(false);
  const [expandedPerf, setExpandedPerf] = useState(false);

  const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const allSubs = useMemo(() => readSubs(students), [students]);

  const progressMap = useMemo(() => {
    const map = {};
    allSubs.forEach(sub => {
      if (!map[sub.studentId]) map[sub.studentId] = {};
      const cur = map[sub.studentId][sub.assignmentId];
      if (!cur || sub.score >= cur.score) map[sub.studentId][sub.assignmentId] = {
        score: sub.score, submittedAt: sub.submittedAt, gradedByTeacher: sub.gradedByTeacher
      };
    });
    return map;
  }, [allSubs]);

  const cutoff = useMemo(() => {
    const n = Date.now();
    if (filterTime === 'today') return n - 86400000;
    if (filterTime === '7days') return n - 7 * 86400000;
    if (filterTime === '30days') return n - 30 * 86400000;
    return 0;
  }, [filterTime]);

  const filteredStudents = useMemo(() => {
    let r = students;
    if (filterClass !== 'all') r = r.filter(s => s.classId === filterClass);
    if (searchStudent.trim()) { const q = searchStudent.toLowerCase(); r = r.filter(s => s.name.toLowerCase().includes(q)); }
    return r;
  }, [students, filterClass, searchStudent]);

  const allAssignments = useMemo(() => {
    const combined = [...assignments];
    classes.forEach(c => {
      try {
        const local = JSON.parse(localStorage.getItem(`localAssignments_course-lop${c.gradeLevel}`) || '[]');
        local.forEach(a => { if (!combined.find(x => x.id === a.id)) combined.push(a); });
      } catch {}
    });
    return combined;
  }, [assignments, classes]);

  const activeClasses = filterClass === 'all' ? classes.length : 1;

  const completionRate = useMemo(() => {
    let total = 0, done = 0;
    filteredStudents.forEach(s => {
      const recs = readClassRecs(s.classId);
      total += recs.length;
      done += recs.filter(r => progressMap[s.id]?.[r.assignmentId]).length;
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [filteredStudents, progressMap]);

  const needsGradingTotal = useMemo(() => {
    let count = 0;
    filteredStudents.forEach(s => {
      const prog = progressMap[s.id];
      if (!prog) return;
      Object.entries(prog).forEach(([assignmentId, sub]) => {
        const assignment = allAssignments.find(a => a.id === assignmentId);
        const hasManual = assignment?.questions?.some(q => q.type === 'short_answer');
        if ((hasManual && !sub.gradedByTeacher) || sub.score == null) count++;
      });
    });
    return count;
  }, [filteredStudents, progressMap, allAssignments]);

  const overdueStudentsTotal = useMemo(() => {
    let count = 0;
    const now = Date.now();
    filteredStudents.forEach(s => {
      const recs = readClassRecs(s.classId);
      const submitted = new Set(Object.keys(progressMap[s.id] ?? {}));
      if (recs.some(r => r.deadline && new Date(r.deadline).getTime() < now && !submitted.has(r.assignmentId))) count++;
    });
    return count;
  }, [filteredStudents, progressMap]);

  const studentAvg = useMemo(() => {
    const m = {};
    filteredStudents.forEach(s => {
      const scores = Object.values(progressMap[s.id] ?? {}).map(p => p.score).filter(sc => sc != null);
      m[s.id] = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    });
    return m;
  }, [filteredStudents, progressMap]);

  const top3 = useMemo(() =>
    filteredStudents
      .filter(s => studentAvg[s.id] !== null)
      .sort((a, b) => (studentAvg[b.id] ?? -1) - (studentAvg[a.id] ?? -1))
      .slice(0, 3)
      .map((s, i) => ({
        ...s, rank: i + 1,
        avgScore: studentAvg[s.id],
        completed: Object.keys(progressMap[s.id] ?? {}).length,
        className: classes.find(c => c.id === s.classId)?.name ?? '—',
      })),
    [filteredStudents, studentAvg, progressMap, classes]);

  const alertStudents = useMemo(() => {
    const now = Date.now();
    const result = [];
    filteredStudents.forEach(s => {
      const recs = readClassRecs(s.classId);
      const prog = progressMap[s.id] ?? {};
      const submitted = new Set(Object.keys(prog));
      const missing = recs.filter(r => !submitted.has(r.assignmentId)).length;
      const avg = studentAvg[s.id];
      const lastSub = Object.values(prog).map(p => p.submittedAt).filter(Boolean).sort().pop();
      const daysSince = lastSub ? Math.floor((now - new Date(lastSub).getTime()) / 86400000) : 999;
      const overdue = recs.filter(r => r.deadline && new Date(r.deadline).getTime() < now && !submitted.has(r.assignmentId)).length;
      const alerts = [];
      if (avg !== null && avg < 5) alerts.push({ reason: 'Điểm TB dưới 5.0', level: 'high' });
      if (missing >= 3) alerts.push({ reason: `Chưa nộp ${missing} bài`, level: 'high' });
      else if (missing > 0) alerts.push({ reason: `Chưa nộp ${missing} bài`, level: 'low' });
      if (daysSince >= 7 && recs.length > 0) alerts.push({ reason: 'Không hoạt động 7 ngày', level: 'medium' });
      else if (overdue > 0) alerts.push({ reason: `${overdue} bài quá hạn`, level: 'low' });
      if (alerts.length > 0) {
        const top = alerts.sort((a, b) => LVL[a.level] - LVL[b.level])[0];
        result.push({ ...s, reason: top.reason, level: top.level, className: classes.find(c => c.id === s.classId)?.name ?? '—' });
      }
    });
    return result.sort((a, b) => LVL[a.level] - LVL[b.level]).slice(0, 8);
  }, [filteredStudents, progressMap, studentAvg, classes]);

  const classPerf = useMemo(() => {
    const show = filterClass === 'all' ? classes : classes.filter(c => c.id === filterClass);
    return show.map(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id);
      const recs = readClassRecs(cls.id);
      let totalScore = 0, scoreCount = 0, totalDone = 0, supportNeeded = 0;
      clsStudents.forEach(s => {
        const prog = progressMap[s.id] ?? {};
        Object.values(prog).forEach(p => { if (p.score != null) { totalScore += p.score; scoreCount++; } });
        totalDone += recs.filter(r => prog[r.assignmentId]).length;
        if (studentAvg[s.id] !== null && studentAvg[s.id] < 6) supportNeeded++;
      });
      const possible = clsStudents.length * recs.length;
      const rate = possible > 0 ? Math.round((totalDone / possible) * 100) : 0;
      return { ...cls, studentCount: clsStudents.length, avgScore: scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : null, rate, supportNeeded };
    });
  }, [classes, students, progressMap, filterClass, studentAvg]);

  const recentAssignments = useMemo(() => {
    const list = [];
    const showClasses = filterClass === 'all' ? classes : classes.filter(c => c.id === filterClass);
    showClasses.forEach(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id);
      const recs = readClassRecs(cls.id);
      recs.forEach(rec => {
        const assignment = allAssignments.find(a => a.id === rec.assignmentId);
        if (!assignment) return;
        let submittedCount = 0, needsGradingCount = 0;
        const hasManual = assignment?.questions?.some(q => q.type === 'short_answer');
        clsStudents.forEach(s => {
          const sub = progressMap[s.id]?.[rec.assignmentId];
          if (sub) {
            submittedCount++;
            if ((hasManual && !sub.gradedByTeacher) || sub.score == null) needsGradingCount++;
          }
        });
        list.push({
          id: `${cls.id}-${assignment.id}`,
          assignmentId: assignment.id, classId: cls.id,
          title: assignment.title, className: cls.name,
          assignedAt: rec.assignedAt || rec.createdAt || assignment.createdAt || null,
          deadline: rec.deadline, submittedCount, total: clsStudents.length, needsGradingCount,
        });
      });
    });
    return list.filter(item => item.needsGradingCount > 0)
      .sort((a, b) => (a.deadline ? new Date(a.deadline).getTime() : 0) - (b.deadline ? new Date(b.deadline).getTime() : 0));
  }, [filterClass, classes, students, allAssignments, progressMap]);

  const classOpts = [{ value: 'all', label: 'Tất cả lớp' }, ...classes.map(c => ({ value: c.id, label: c.name }))];
  const timeOpts = [
    { value: 'all', label: 'Tất cả thời gian' }, { value: 'today', label: 'Hôm nay' },
    { value: '7days', label: '7 ngày qua' }, { value: '30days', label: '30 ngày qua' },
  ];
  const STATS = [
    { label: 'Lớp học',      value: activeClasses,           icon: BookOpen },
    { label: 'Học viên',     value: filteredStudents.length,  icon: GraduationCap },
    { label: 'Hoàn thành',   value: `${completionRate}%`,    icon: Clock },
    { label: 'Bài cần chấm', value: needsGradingTotal,       icon: ClipboardList },
    { label: 'HV quá hạn',   value: overdueStudentsTotal,    icon: Clock },
  ];

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}><BookOpen size={32} strokeWidth={1.5} /></div>
          <div className={styles.heroContent}>
            <p className={styles.heroDate}>{todayStr}</p>
            <h1 className={styles.heroTitle}>Xin chào, {user?.name ?? 'cô'}!</h1>
            <p className={styles.heroSub}>Đây là tổng quan lớp học hôm nay.</p>
          </div>
        </div>
        <div className={styles.heroStats}>
          {STATS.map(({ label, value, icon: Icon }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div className={styles.statDiv} />}
              <div className={styles.statItem}>
                <Icon size={20} strokeWidth={1.5} className={styles.statIcon} />
                <span className={styles.statNum}>{value}</span>
                <span className={styles.statLabel}>{label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Tìm học viên..." value={searchStudent} onChange={e => setSearchStudent(e.target.value)} />
        </div>
        <div className={styles.filterDrops}>
          <FilterDropdown icon={Users} value={filterClass} options={classOpts} onChange={setFilterClass} />
          <FilterDropdown icon={Clock} value={filterTime} options={timeOpts} onChange={setFilterTime} />
          {(filterClass !== 'all' || filterTime !== 'all' || searchStudent) && (
            <button type="button" className={styles.clearBtn} onClick={() => { setFilterClass('all'); setFilterTime('all'); setSearchStudent(''); }}>
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* ── 2x2 Equal Grid ── */}
      <div className={styles.fourGrid}>

        {/* Card 1: Bài cần chấm */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon} style={{ background: '#eef2ff' }}>
              <ClipboardList size={15} style={{ color: '#4f46e5' }} />
            </div>
            <h2 className={styles.cardTitle}>Bài cần chấm</h2>
            {recentAssignments.length > 0 && <span className={styles.countBadge}>{recentAssignments.length}</span>}
          </div>
          {recentAssignments.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Không có bài nào cần chấm 🎉</p>
            </div>
          ) : (
            <>
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '1fr 1fr 76px 52px 44px' }}>
                <span>Lớp</span>
                <span>Bài</span>
                <span>Hạn nộp</span>
                <span style={{ textAlign: 'center' }}>Đã nộp</span>
                <span style={{ textAlign: 'center' }}>Xem</span>
              </div>
              <div className={styles.tableBody}>
                {recentAssignments.slice(0, expandedGrading ? undefined : 3).map(hw => (
                  <div key={hw.id} className={styles.gradingRow} style={{ gridTemplateColumns: '1fr 1fr 76px 52px 44px' }}>
                    <span className={styles.hwClass}>{hw.className}</span>
                    <span className={styles.hwSub}>{hw.title}</span>
                    <span className={styles.dataCell}>{hw.deadline ? formatDate(hw.deadline) : '—'}</span>
                    <span className={styles.dataCell} style={{ textAlign: 'center' }}>{hw.submittedCount}/{hw.total}</span>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button type="button" className={styles.eyeBtn} onClick={() => navigate(`/app/grading/${hw.classId}/${hw.assignmentId}`)} title="Chấm bài">
                        <Eye size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className={styles.viewAllBtn} onClick={() => setExpandedGrading(e => !e)}>
                {expandedGrading ? 'Thu gọn' : `Xem tất cả (${recentAssignments.length})`} <span>{expandedGrading ? '‹' : '›'}</span>
              </button>
            </>
          )}
        </div>

        {/* Card 2: Top 3 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon} style={{ background: '#fef9c3' }}>
              <Award size={15} style={{ color: '#ca8a04' }} />
            </div>
            <h2 className={styles.cardTitle}>Top 3 học viên điểm TB cao nhất</h2>
          </div>
          {top3.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Chưa có dữ liệu điểm trung bình</p>
            </div>
          ) : (
            <>
              <div className={styles.tableBody}>
                {top3.slice(0, expandedTop3 ? undefined : 3).map((s, i) => {
                  const [bg, color] = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <div key={s.id} className={styles.top3Row}>
                      <span className={styles.rankMedal}>{RANK_MEDALS[i]}</span>
                      <div className={styles.avatar} style={{ background: bg, color }}>{getInitials(s.name)}</div>
                      <div className={styles.studentMeta}>
                        <span className={styles.studentName}>{s.name}</span>
                        <span className={styles.studentClass}>{s.className} · {s.completed} bài đã nộp</span>
                      </div>
                      <span className={styles.scoreGreen}>{s.avgScore.toFixed(1)}/10</span>
                    </div>
                  );
                })}
              </div>
              <button className={styles.viewAllBtn} onClick={() => setExpandedTop3(e => !e)}>
                {expandedTop3 ? 'Thu gọn' : `Xem bảng xếp hạng (${top3.length})`} <span>{expandedTop3 ? '‹' : '›'}</span>
              </button>
            </>
          )}
        </div>

        {/* Card 3: Học viên cần chú ý */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon} style={{ background: '#fff0e6' }}>
              <AlertTriangle size={15} style={{ color: '#f97316' }} />
            </div>
            <h2 className={styles.cardTitle}>Học viên cần chú ý</h2>
            {alertStudents.length > 0 && <span className={styles.countBadge}>{alertStudents.length}</span>}
          </div>
          {alertStudents.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Không có học viên nào cần chú ý 🎉</p>
            </div>
          ) : (
            <>
              <div className={styles.tableHeader}>
                <span>Học viên</span>
                <span>Lớp</span>
                <span>Vấn đề</span>
                <span style={{ textAlign: 'center' }}>Đánh giá</span>
              </div>
              <div className={styles.tableBody}>
                {alertStudents.slice(0, expandedAlert ? undefined : 3).map((s, i) => {
                  const [bg, color] = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  const cfg = ALERT_CFG[s.level];
                  return (
                    <div key={s.id} className={styles.alertRow}>
                      <div className={styles.studentCell}>
                        <div className={styles.avatar} style={{ background: bg, color }}>{getInitials(s.name)}</div>
                        <span className={styles.studentName}>{s.name}</span>
                      </div>
                      <span className={styles.studentClass}>{s.className}</span>
                      <span className={styles.reasonCell}>{s.reason}</span>
                      <div className={styles.actionCell}>
                        <Flag size={16} strokeWidth={1.25} fill={cfg.fill} stroke={cfg.fill} />
                        <button className={styles.eyeBtn} onClick={() => navigate(`/app/students/${s.id}`)} title="Xem chi tiết">
                          <Eye size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className={styles.viewAllBtn} onClick={() => setExpandedAlert(e => !e)}>
                {expandedAlert ? 'Thu gọn' : `Xem tất cả (${alertStudents.length})`} <span>{expandedAlert ? '‹' : '›'}</span>
              </button>
            </>
          )}
        </div>

        {/* Card 4: Hiệu suất lớp học */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon} style={{ background: '#f0fdf4' }}>
              <CheckCircle size={15} style={{ color: '#16a34a' }} />
            </div>
            <h2 className={styles.cardTitle}>Hiệu suất lớp học</h2>
          </div>
          {classPerf.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Chưa có lớp nào</p>
            </div>
          ) : (
            <>
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 2fr 68px 80px' }}>
                <span>Lớp</span>
                <span>Tỷ lệ hoàn thành</span>
                <span>Điểm TB</span>
                <span>Cần hỗ trợ</span>
              </div>
              <div className={styles.tableBody}>
                {classPerf.slice(0, expandedPerf ? undefined : 3).map(cls => (
                  <div key={cls.id} className={styles.perfRow} style={{ gridTemplateColumns: '1.2fr 2fr 68px 80px' }}>
                    <span className={styles.className}>{cls.name}</span>
                    <div className={styles.perfCell}>
                      <div className={styles.perfBar}>
                        <div className={styles.perfBarFill} style={{ width: `${cls.rate}%` }} />
                      </div>
                      <span className={styles.perfPct}>{cls.rate}%</span>
                    </div>
                    <span className={styles.avgScore}>{cls.avgScore ? `${cls.avgScore}/10` : '—'}</span>
                    <span className={cls.supportNeeded > 0 ? styles.supportRed : styles.dataCell}>
                      {cls.supportNeeded > 0 ? cls.supportNeeded : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <button className={styles.viewAllBtn} onClick={() => setExpandedPerf(e => !e)}>
                {expandedPerf ? 'Thu gọn' : `Xem tất cả lớp (${classPerf.length})`} <span>{expandedPerf ? '‹' : '›'}</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
