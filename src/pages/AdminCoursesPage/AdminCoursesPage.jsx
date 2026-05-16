import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, HelpCircle, ChevronDown, Search,
  BookOpen, Layers, ClipboardList, CalendarDays,
  MoreVertical, Eye, Edit2, Plus, Users, CheckCircle2, CheckCircle,
  User, FileText, UploadCloud, CheckSquare,
} from 'lucide-react';
import styles from './AdminCoursesPage.module.css';
import { useTeacher } from '../../contexts/TeacherContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { CreateCourseModal } from './components/CreateCourseModal';

/* ── Đọc local assignments của 1 khóa học từ localStorage ── */
function readLocalAssignmentsForGrade(gradeLevel) {
  try {
    const courseId   = `course-lop${gradeLevel}`;
    const storageKey = `localAssignments_${courseId}`;
    const deletedKey = `localDeletedAssignments_${courseId}`;
    const raw        = localStorage.getItem(storageKey);
    const arr        = raw ? JSON.parse(raw) : [];
    const delRaw     = localStorage.getItem(deletedKey);
    const deleted    = delRaw ? JSON.parse(delRaw) : [];
    return arr.filter(a => !deleted.includes(a.id));
  } catch {
    return [];
  }
}



const MOCK_ACTIVITIES = [
  { id: 1, text: 'Bạn đã duyệt 5 bài tập', sub: 'Tiếng Anh Lớp 3 - Unit 4', time: '1 giờ trước', type: 'success', Icon: CheckCircle2 },
  { id: 2, text: 'Bạn đã tạo bài kiểm tra mới', sub: 'Tiếng Anh Lớp 4 - Giữa kỳ', time: '3 giờ trước', type: 'purple', Icon: CalendarDays },
  { id: 3, text: 'Lê Minh Anh đã nộp bài tập', sub: 'Tiếng Anh Lớp 5 - Unit 6', time: '5 giờ trước', type: 'blue', Icon: User },
  { id: 4, text: 'Có 12 bài tập chờ duyệt mới', sub: 'Nhiều khóa học', time: 'Hôm qua', type: 'warning', Icon: ClipboardList },
  { id: 5, text: 'Bài kiểm tra sắp diễn ra', sub: 'Tiếng Anh Lớp 6 - Ngày mai', time: 'Hôm qua', type: 'blue', Icon: CalendarDays },
];

const MOCK_SUGGESTIONS = [
  { id: 1, title: 'Tạo khóa học mới', sub: 'Tạo khóa học cho lớp/nhóm mới', Icon: Plus, color: '#10b981', bg: '#d1fae5', action: 'create_course' },
];

/* ── CourseCard ──────────────────────────────────────────────────── */
const CourseCard = ({ course, onView }) => (
  <div className={styles.courseCard}>
    <div className={styles.courseHeader}>
      <div className={styles.courseVisual} style={{ borderColor: course.badgeBorder, background: '#fff' }}>
        <BookOpen size={28} color={course.badgeColor} strokeWidth={1.5} />
      </div>
      <div className={styles.courseTitleArea}>
        <h3 className={styles.courseName}>{course.name}</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={styles.courseBadge} style={{ color: course.badgeColor, borderColor: course.badgeBorder }}>
            {course.gradeLabel}
          </span>
          {course.level && (
            <span className={styles.courseBadge} style={{ color: '#0369a1', borderColor: '#bae6fd' }}>
              {course.level}
            </span>
          )}
          {course.status && (
            <span className={styles.courseBadge} style={{
              color: course.status === 'Hoạt động' ? '#10b981' : '#64748b',
              borderColor: course.status === 'Hoạt động' ? '#a7f3d0' : '#cbd5e1',
            }}>
              {course.status}
            </span>
          )}
        </div>
        {course.classCode && (
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.03em' }}>
            {course.classCode}
          </div>
        )}
      </div>
    </div>

    {/* ── Row 1: Unit count + Class count ── */}
    <div className={styles.courseStats}>
      <div className={styles.statItem}><Layers size={14} /><span>{course.unitCount} Unit</span></div>
      <div className={styles.statItem}><Users size={14} /><span>{course.classCount} lớp đang học</span></div>
    </div>

    {/* ── Row 2: Assignment stats & Actions ── */}
    <div className={styles.assignRow}>
      <div className={styles.assignLeft}>
        <span className={styles.assignRowLabel}>Đã giao:</span>
        {course.assignedTotal === 0 ? (
          <span className={styles.assignNoneBadge}>Chưa giao bài</span>
        ) : (
          <>
            <span className={styles.assignChip} style={{ color: '#4f46e5', borderColor: '#c7d2fe' }}>
              <ClipboardList size={13} strokeWidth={2.5} /> {course.assignedExercises} bài tập
            </span>
            <span className={styles.assignChip} style={{ color: '#10b981', borderColor: '#a7f3d0' }}>
              <CheckCircle size={13} strokeWidth={2.5} /> {course.assignedTests} kiểm tra
            </span>
          </>
        )}
      </div>
      
      <button className={styles.btnXem} onClick={() => onView(course.id)}>
        <Eye size={14} /> Xem
      </button>
    </div>
  </div>
);


/* ── Page ────────────────────────────────────────────────────────── */
export const AdminCoursesPage = () => {
  const navigate = useNavigate();
  const { courses, chapters, assignments } = useTeacher();
  const { students, classes } = useUserManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [showCreateCourse, setShowCreateCourse] = useState(false);

  const handleSuggestionClick = (action) => {
    if (action === 'create_course') {
      setShowCreateCourse(true);
    }
  };

  // remove diacritics utility for better search
  const removeDiacritics = (str) => {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  };

  // ── Statistics — số khóa học = số khối lớp duy nhất ─────────────────
  const uniqueGrades = useMemo(() =>
    [...new Set((classes || []).map(c => c.gradeLevel).filter(Boolean))].sort((a, b) => a - b)
  , [classes]);

  const totalCourses       = uniqueGrades.length;
  const totalUnits         = chapters?.length || 0;
  const pendingAssignments = assignments?.filter(a => !a.isTest)?.length || 0;
  const upcomingTests      = assignments?.filter(a => a.isTest)?.length || 0;

  // ── Grade options for filter dropdown ─────────────────────────────────
  const uniqueGradeOptions = uniqueGrades.map(level => ({ level, label: `Lớp ${level}` }));

  // ── Derive course cards: 1 card per grade level ────────────────────────
  const filteredCourses = useMemo(() => {
    // Group classes by gradeLevel
    const gradeMap = new Map();
    (classes || []).forEach(cls => {
      const g = Number(cls.gradeLevel) || 1;
      if (!gradeMap.has(g)) gradeMap.set(g, []);
      gradeMap.get(g).push(cls);
    });

    return [...gradeMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([gradeLevel, classList]) => {
        const courseId  = `course-lop${gradeLevel}`;
        const unitCount = (chapters || []).filter(ch => ch.courseId === courseId).length;
        const classCount = classList.length;

        // Assignments từ course-level localStorage
        const localItems        = readLocalAssignmentsForGrade(gradeLevel);
        const assignedExercises = localItems.filter(a => !a.isTest).length;
        const assignedTests     = localItems.filter(a => a.isTest).length;
        const assignedTotal     = localItems.length;

        const isPrimary  = gradeLevel <= 5;
        const badgeColor = isPrimary ? '#10b981' : '#8b5cf6';
        const badgeBorder= isPrimary ? '#a7f3d0' : '#ddd6fe';

        return {
          id:           courseId,
          name:         `Tiếng Anh lớp ${gradeLevel}`,
          gradeLevel,
          gradeLabel:   `Lớp ${gradeLevel}`,
          status:       'Hoạt động',
          badgeColor, badgeBorder,
          unitCount,
          studentCount: classCount, // reused field — now = số lớp đang học
          classCount,
          assignedExercises,
          assignedTests,
          assignedTotal,
        };
      });
  }, [classes, chapters]);

  // ─ Filter + sort ─
  const sortedCourses = useMemo(() => {
    const filtered = filteredCourses.filter(course => {
      if (selectedGrade !== 'all' && String(course.gradeLevel) !== String(selectedGrade)) return false;
      if (selectedStatus !== 'all' && course.status !== selectedStatus) return false;
      if (!searchQuery) return true;
      const term      = removeDiacritics(searchQuery.toLowerCase());
      const nameMatch  = removeDiacritics(course.name.toLowerCase()).includes(term);
      const gradeMatch = removeDiacritics(course.gradeLabel.toLowerCase()).includes(term);
      const idMatch    = removeDiacritics(course.id.toLowerCase()).includes(term);
      const codeMatch  = course.classCode ? removeDiacritics(course.classCode.toLowerCase()).includes(term) : false;
      const levelMatch = course.level ? removeDiacritics(course.level.toLowerCase()).includes(term) : false;
      return nameMatch || gradeMatch || idMatch || codeMatch || levelMatch;
    });

    return [...filtered].sort((a, b) => {
    switch (selectedSort) {
      case 'newest':
        return b.id.localeCompare(a.id); // Assuming higher ID means newer
      case 'oldest':
        return a.id.localeCompare(b.id);
      case 'nameAsc':
        return a.name.localeCompare(b.name);
      case 'nameDesc':
        return b.name.localeCompare(a.name);
      case 'studentsDesc':
        return b.studentCount - a.studentCount;
      case 'studentsAsc':
        return a.studentCount - b.studentCount;
      case 'unitsDesc':
        return b.unitCount - a.unitCount;
      case 'unitsAsc':
        return a.unitCount - b.unitCount;
      default:
        return 0;
    }
    });
  }, [filteredCourses, selectedGrade, selectedStatus, selectedSort, searchQuery]);

  // --- Derive Recent Activities ---
  const generatedActivities = [];

  // Courses
  courses?.forEach(c => {
    const ts = parseInt(c.id?.split('-')[1]);
    if (!isNaN(ts)) {
      generatedActivities.push({
        id: `act-c-${c.id}`,
        text: 'Bạn đã tạo khóa học mới',
        sub: c.name,
        timestamp: ts,
        type: 'blue',
        Icon: BookOpen
      });
    }
  });

  // Chapters
  chapters?.forEach(ch => {
    const ts = parseInt(ch.id?.split('-')[1]);
    const courseName = courses?.find(c => c.id === ch.courseId)?.name || 'Khóa học';
    if (!isNaN(ts)) {
      generatedActivities.push({
        id: `act-ch-${ch.id}`,
        text: 'Bạn đã tạo Unit mới',
        sub: `${courseName} - ${ch.name}`,
        timestamp: ts,
        type: 'warning',
        Icon: Layers
      });
    }
  });

  // Assignments
  assignments?.forEach(a => {
    const ts = new Date(a.createdAt).getTime() || parseInt(a.id?.split('-')[1]);
    const courseName = courses?.find(c => c.id === a.courseId)?.name || 'Khóa học';
    if (!isNaN(ts)) {
      generatedActivities.push({
        id: `act-a-${a.id}`,
        text: a.isTest ? 'Bạn đã tạo bài kiểm tra mới' : 'Bạn đã tạo bài tập mới',
        sub: `${courseName} - ${a.title}`,
        timestamp: ts,
        type: a.isTest ? 'purple' : 'success',
        Icon: a.isTest ? CalendarDays : ClipboardList
      });
    }
  });

  generatedActivities.sort((a, b) => b.timestamp - a.timestamp);

  const formattedActivities = generatedActivities.slice(0, 5).map(act => {
    const diff = Date.now() - act.timestamp;
    let timeStr = '';
    if (diff < 60000) timeStr = 'Vừa xong';
    else if (diff < 3600000) timeStr = `${Math.floor(diff / 60000)} phút trước`;
    else if (diff < 86400000) timeStr = `${Math.floor(diff / 3600000)} giờ trước`;
    else timeStr = `${Math.floor(diff / 86400000)} ngày trước`;
    return { ...act, time: timeStr };
  });

  const displayActivities = formattedActivities.length > 0 ? formattedActivities : MOCK_ACTIVITIES;

  return (
    <div className={styles.dashboard}>

      {/* ── MAIN CONTENT ── */}
      <div className={styles.mainContent}>

        {/* Header removed */}

        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrap}>
              <BookOpen size={24} strokeWidth={1.5} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Tổng khóa học</span>
              <span className={styles.kpiValue}>{totalCourses}</span>
              <span className={styles.kpiTrend}>+2 so với học kỳ trước</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrap}>
              <Layers size={24} strokeWidth={1.5} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Tổng Unit</span>
              <span className={styles.kpiValue}>{totalUnits}</span>
              <span className={styles.kpiTrend}>+18 so với học kỳ trước</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrap}>
              <ClipboardList size={24} strokeWidth={1.5} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Bài tập chờ duyệt</span>
              <span className={styles.kpiValue}>{pendingAssignments}</span>
              <span className={styles.kpiTrend}>↓ 5 so với tuần trước</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrap}>
              <CalendarDays size={24} strokeWidth={1.5} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Bài kiểm tra sắp diễn ra</span>
              <span className={styles.kpiValue}>{upcomingTests}</span>
              <span className={styles.kpiTrend}>Trong 7 ngày tới</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            <select
              className={styles.filterSelect}
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="all">Tất cả khối lớp</option>
              {uniqueGradeOptions.map(({ level, label }) => (
                <option key={level} value={level}>{label}</option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Vô hiệu">Vô hiệu</option>
            </select>
            <select
              className={styles.filterSelect}
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="nameAsc">Tên A-Z</option>
              <option value="nameDesc">Tên Z-A</option>
              <option value="studentsDesc">Nhiều học viên nhất</option>
              <option value="studentsAsc">Ít học viên nhất</option>
              <option value="unitsDesc">Nhiều Unit nhất</option>
              <option value="unitsAsc">Ít Unit nhất</option>
            </select>
          </div>
        </div>

        {/* Course Grid */}
        {sortedCourses.length > 0 ? (
          <>
            <div className={styles.courseGrid}>
              {sortedCourses.map(course => (
                // key = class ID (unique), navigate đến course detail qua courseId
                <CourseCard
                  key={course.id}
                  course={course}
                  onView={() => navigate(`/app/courses/${course.id}`)}
                />
              ))}
            </div>
            <div className={styles.loadMoreWrap}>
              <button className={styles.loadMoreBtn}>Xem thêm khóa học <ChevronDown size={16} /></button>
            </div>
          </>
        ) : (
          <div className={styles.emptyState} style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
            <BookOpen size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>Không tìm thấy khóa học phù hợp</h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Vui lòng thử lại với từ khóa khác.</p>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={styles.rightPanel}>

        {/* Recent Activities */}
        <div className={styles.panelSection}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Hoạt động gần đây</h3>
            <a href="#" className={styles.panelLink}>Xem tất cả</a>
          </div>
          <div className={styles.timeline}>
            {displayActivities.map(({ id, text, sub, time, type, Icon }) => (
              <div key={id} className={styles.timelineItem}>
                <div className={`${styles.timelineIcon} ${styles[`icon_${type}`]}`}>
                  <Icon size={16} strokeWidth={2.5} />
                </div>
                <div className={styles.timelineContent}>
                  <p className={styles.timelineText}>{text}</p>
                  <p className={styles.timelineSub}>{sub}</p>
                  <p className={styles.timelineTime}>{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className={styles.panelSection}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Gợi ý nhanh</h3>
          </div>
          <div className={styles.suggestionsList}>
            {MOCK_SUGGESTIONS.map(({ id, title, sub, Icon, color, bg, action }) => (
              <div key={id} className={styles.suggestionCard} onClick={() => handleSuggestionClick(action)}>
                <div className={styles.suggestionIcon} style={{ color, borderColor: bg }}>
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div className={styles.suggestionInfo}>
                  <p className={styles.suggestionTitle}>{title}</p>
                  <p className={styles.suggestionSub}>{sub}</p>
                </div>
                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)', color: '#94a3b8' }} />
              </div>
            ))}
          </div>
        </div>

      </div>

      {showCreateCourse && (
        <CreateCourseModal
          onClose={() => setShowCreateCourse(false)}
          onSuccess={(newCourse) => {
            navigate(`/app/courses/${newCourse.id}`);
          }}
        />
      )}
    </div>
  );
};
