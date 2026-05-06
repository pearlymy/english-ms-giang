/**
 * AdminCoursesPage.jsx — Table view with add/delete course CRUD
 */
import React, { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Trash2, GraduationCap } from 'lucide-react';

import { Button } from '../../design-system/components/Button/Button';
import { Modal } from '../../design-system/components/Modal/Modal';
import { TextField } from '../../design-system/components/TextField/TextField';
import { Select } from '../../design-system/components/Select/Select';
import { ToastContext } from '../../design-system/components/Toast/Toast';
import { Tooltip } from '../../design-system/components/Tooltip/Tooltip';

import { useTeacher } from '../../contexts/TeacherContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import styles from './AdminCoursesPage.module.css';

const useToast = () => useContext(ToastContext);

const GROUP_OPTIONS = [
  { value: 'Cấp 1', label: 'Cấp 1 (Lớp 1–5)' },
  { value: 'Cấp 2', label: 'Cấp 2 (Lớp 6–9)' },
];

/* ── Modal: tạo khóa học ─────────────────────────────────────────────────── */
const CreateCourseModal = ({ open, onClose }) => {
  const { createCourse } = useTeacher();
  const toast = useToast();
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [classGroup, setClassGroup] = useState('');

  const reset = () => { setName(''); setGradeLevel(''); setClassGroup(''); };

  const handleCreate = () => {
    if (!name || !gradeLevel || !classGroup) return;
    createCourse({ name, gradeLevel: Number(gradeLevel), classGroup });
    toast?.success(`Đã tạo khóa học "${name}"`);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}
      title="Tạo khóa học mới"
      primaryAction={{ label: 'Tạo khóa học', onClick: handleCreate }}
      secondaryAction={{ label: 'Hủy' }}
    >
      <div className={styles.formGrid}>
        <TextField
          label="Tên khóa học"
          placeholder="VD: Tiếng Anh Lớp 7"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <TextField
          label="Khối lớp"
          type="number"
          min="1"
          max="9"
          placeholder="VD: 7"
          value={gradeLevel}
          onChange={e => setGradeLevel(e.target.value)}
        />
        <Select
          label="Cấp học"
          placeholder="— Chọn cấp —"
          options={GROUP_OPTIONS}
          value={classGroup}
          onChange={setClassGroup}
        />
      </div>
    </Modal>
  );
};

/* ── Modal: xác nhận xóa ─────────────────────────────────────────────────── */
const ConfirmDeleteModal = ({ open, course, onConfirm, onClose }) => (
  <Modal
    open={open}
    onOpenChange={(v) => { if (!v) onClose(); }}
    title="Xóa khóa học"
    description={`Bạn có chắc muốn xóa khóa học "${course?.name}"?`}
    primaryAction={{ label: 'Xóa', danger: true, onClick: onConfirm }}
    secondaryAction={{ label: 'Hủy' }}
  >
    <div className={styles.deleteWarning}>
      <Trash2 size={16} />
      <span>Thao tác này <strong>không thể hoàn tác</strong>.</span>
    </div>
  </Modal>
);

/* ── Page ────────────────────────────────────────────────────────────────── */
const GROUP_ORDER = ['Cấp 1', 'Cấp 2'];

export const AdminCoursesPage = () => {
  const { courses, deleteCourse, getAssignmentsByCourse } = useTeacher();
  const { students: allStudents, classes } = useUserManagement();
  const navigate = useNavigate();
  const toast = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteCrs, setDeleteCrs] = useState(null);

  const handleConfirmDelete = () => {
    deleteCourse(deleteCrs.id);
    toast?.success(`Đã xóa khóa học "${deleteCrs.name}"`);
    setDeleteCrs(null);
  };

  /* Tìm classIds thuộc mỗi course (match bằng gradeLevel) */
  const classIdsByCourse = useMemo(() => {
    const map = {};
    for (const c of courses) {
      map[c.id] = classes
        .filter(cls => cls.gradeLevel === c.gradeLevel)
        .map(cls => cls.id);
    }
    return map;
  }, [courses, classes]);

  const grouped = useMemo(() =>
    GROUP_ORDER.map(group => ({
      group,
      items: courses
        .filter(c => c.classGroup === group)
        .sort((a, b) => (a.gradeLevel ?? 0) - (b.gradeLevel ?? 0)),
    })).filter(g => g.items.length > 0),
    [courses]);

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroIconWrap}>
          <BookOpen size={24} color="#fff" strokeWidth={1.6} />
        </div>
        <div>
          <h1 className={styles.heroTitle}>Khóa học &amp; Bài tập</h1>
          <p className={styles.heroSub}>Quản lý nội dung học tập từ Lớp 1 đến Lớp 9.</p>
        </div>
        <div className={styles.heroRight}>
          <span className={styles.heroStat}>{courses.length} khóa học</span>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Tạo khóa học
        </Button>
      </div>

      {/* ── Grouped Tables ── */}
      {grouped.map(({ group, items }) => (
        <section key={group} className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>{group}</span>
            <span className={styles.sectionBadge}>{items.length} khóa học</span>
          </div>

          <div className={styles.tablePanel}>
            {/* Header */}
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
              <span>Khóa học</span>
              <span>Số lớp</span>
              <span>Học viên</span>
              <span>Bài tập</span>
              <span />
            </div>

            {items.map(course => {
              const assignments = getAssignmentsByCourse(course.id);
              const courseClassIds = classIdsByCourse[course.id] || [];
              const activeStudents = allStudents.filter(
                s => s.isActive && courseClassIds.includes(s.classId)
              );
              return (
                <div
                  key={course.id}
                  className={`${styles.tableRow} ${styles.dataRow}`}
                  onClick={() => navigate(`/app/courses/${course.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Name + icon */}
                  <div className={styles.courseCell}>
                    <div className={styles.courseIcon} style={{ background: course.gradient }}>
                      <GraduationCap size={16} color="#fff" strokeWidth={1.6} />
                    </div>
                    <span className={styles.courseName}>{course.name}</span>
                  </div>

                  <div className={styles.mobileInfo}>
                    <span className={styles.cellText}>
                      {courseClassIds.length} lớp
                    </span>
                    <span className={styles.cellText}>{activeStudents.length} học viên</span>
                    <span className={styles.cellText}>{assignments.length} bài tập</span>
                  </div>

                  {/* Hover actions */}
                  <div className={styles.rowActions}>
                    <Tooltip content="Xóa khóa học" side="top">
                      <button
                        className={`${styles.rowActionBtn} ${styles.rowActionDelete}`}
                        onClick={(e) => { e.stopPropagation(); setDeleteCrs(course); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {courses.length === 0 && (
        <div className={styles.empty}>Chưa có khóa học nào. Hãy tạo khóa học đầu tiên!</div>
      )}

      <CreateCourseModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {deleteCrs && (
        <ConfirmDeleteModal
          open={!!deleteCrs}
          course={deleteCrs}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteCrs(null)}
        />
      )}
    </div>
  );
};
