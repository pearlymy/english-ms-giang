/**
 * AdminCourseDetail.jsx — Chapter & Assignment management
 * Chapter accordion with add/rename/delete.
 * Assignment list with add/delete, navigates to editor.
 * "Invite class" feature: assign classes to one assignment or all in a chapter.
 */
import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, ClipboardList, Headphones,
  BookOpen, Check, X as XIcon, Users, Send, Eye, EyeOff, Play,
  History, Folder, FileText, Calendar, GripVertical
} from 'lucide-react';

import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '../../design-system/components/Button/Button';
import { Modal } from '../../design-system/components/Modal/Modal';
import { TextField } from '../../design-system/components/TextField/TextField';
import { ToastContext } from '../../design-system/components/Toast/Toast';
import { Tooltip } from '../../design-system/components/Tooltip/Tooltip';

import { useTeacher } from '../../contexts/TeacherContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { DatePicker } from '../../components/DatePicker';
import styles from './AdminCourseDetail.module.css';

const useToast = () => useContext(ToastContext);

const TYPE_LABELS = {
  quiz: { label: 'Quiz', icon: ClipboardList },
  listening: { label: 'Listening', icon: Headphones },
};

/* ═══════════════════════════════════════════════════════════
   Modal: Thêm chương
══════════════════════════════════════════════════════════════ */
const AddChapterModal = ({ open, courseId, onClose }) => {
  const { createChapter } = useTeacher();
  const toast = useToast();
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    createChapter({ courseId, name: name.trim() });
    toast?.success(`Đã thêm chương "${name.trim()}"`);
    setName('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) { setName(''); onClose(); } }}
      title="Thêm chương mới"
      primaryAction={{ label: 'Thêm chương', onClick: handleAdd }}
      secondaryAction={{ label: 'Hủy' }}
    >
      <TextField
        label="Tên chương"
        placeholder="VD: Chương 1 — Chào hỏi & Giới thiệu"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
      />
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════
   Modal: Xóa chương
══════════════════════════════════════════════════════════════ */
const DeleteChapterModal = ({ open, chapter, assignmentCount, onConfirm, onClose }) => (
  <Modal
    open={open}
    onOpenChange={(v) => { if (!v) onClose(); }}
    title="Xóa chương"
    description={`Bạn có chắc muốn xóa "${chapter?.name}"?`}
    primaryAction={{ label: 'Xóa chương', danger: true, onClick: onConfirm }}
    secondaryAction={{ label: 'Hủy' }}
  >
    {assignmentCount > 0 && (
      <div className={styles.deleteWarning}>
        <Trash2 size={16} />
        <span>
          Chương này có <strong>{assignmentCount} bài tập</strong> — tất cả sẽ bị xóa theo.{' '}
          Thao tác <strong>không thể hoàn tác</strong>.
        </span>
      </div>
    )}
  </Modal>
);

/* ═══════════════════════════════════════════════════════════
   Modal: Thêm bài tập
══════════════════════════════════════════════════════════════ */
const AddAssignmentModal = ({ open, courseId, chapterId, onClose }) => {
  const { createAssignment } = useTeacher();
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('quiz');

  const handleAdd = () => {
    if (!title.trim()) return;
    createAssignment({ courseId, chapterId, title: title.trim(), type, questions: [] });
    toast?.success(`Đã tạo bài tập "${title.trim()}"`);
    setTitle('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) { setTitle(''); onClose(); } }}
      title="Thêm bài tập mới"
      primaryAction={{ label: 'Thêm bài tập', onClick: handleAdd }}
      secondaryAction={{ label: 'Hủy' }}
    >
      <div className={styles.formGrid}>
        <TextField
          label="Tên bài tập"
          placeholder="VD: Bài 1 — Từ vựng chủ đề gia đình"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        />
        <div className={styles.typeToggleGroup}>
          <span className={styles.typeToggleLabel}>Loại bài</span>
          <div className={styles.typeToggle}>
            {Object.entries(TYPE_LABELS).map(([val, { label, icon: Icon }]) => (
              <button
                key={val}
                className={`${styles.typeBtn} ${type === val ? styles.typeBtnActive : ''}`}
                onClick={() => setType(val)}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};


/* ═══════════════════════════════════════════════════════════
   Modal: Giao bài (Assign)
   - mode 'single' : giao 1 bài tập cụ thể
   - mode 'chapter': giao toàn bộ bài của chương (bỏ qua Draft)
══════════════════════════════════════════════════════════════ */
export const InviteClassModal = ({ open, mode, courseId, hwId, chapter, assignmentsInChapter, onClose }) => {
  const { classes } = useUserManagement();
  const { updateAssignment, createAssignmentLog, getAssignmentById } = useTeacher();
  const toast = useToast();

  // Always read fresh hw from context — never from a stale prop snapshot
  const hw = hwId ? getAssignmentById(hwId) : null;

  /* ── Initial state helpers ── */
  const getInitialClasses = () => {
    return new Set();
  };

  const getTPlus7 = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [selected, setSelected] = useState(() => getInitialClasses());
  const [deadline, setDeadline] = useState(() => getTPlus7());

  React.useEffect(() => {
    if (open) {
      setSelected(getInitialClasses());
      setDeadline(getTPlus7());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hwId, chapter?.id]);

  const toggle = (id) => setSelected(prev => {
    const n = new Set(prev);
    if (n.has(id)) {
      n.delete(id);
    } else {
      n.clear();
      n.add(id);
    }
    return n;
  });

  const handleConfirm = () => {
    if (!deadline) { toast?.error('Vui lòng chọn Hạn nộp bài'); return; }

    const ids = [...selected];
    const patch = { assignedClassIds: ids, dueDate: deadline };

    if (mode === 'single' && hw) {
      updateAssignment(hw.id, patch);
      if (ids.length > 0) {
        createAssignmentLog({
          courseId,
          type: 'single',
          targetId: hw.id,
          targetName: hw.title,
          assignedClasses: classes.filter(c => ids.includes(c.id)).map(c => c.name),
          dueDate: deadline,
          assignedHwIds: [hw.id]
        });
      }
      toast?.success(ids.length === 0
        ? `Đã bỏ tất cả lớp khỏi "${hw.title}"`
        : `Đã giao "${hw.title}" cho ${ids.length} lớp`);
    } else if (mode === 'chapter' && assignmentsInChapter) {
      const toAssign = assignmentsInChapter.filter(a => a.status !== 'draft');
      toAssign.forEach(a => updateAssignment(a.id, patch));

      if (ids.length > 0 && toAssign.length > 0) {
        createAssignmentLog({
          courseId,
          type: 'chapter',
          targetId: chapter.id,
          targetName: chapter.name,
          assignedClasses: classes.filter(c => ids.includes(c.id)).map(c => c.name),
          dueDate: deadline,
          assignedHwIds: toAssign.map(a => a.id)
        });
      }

      const skipped = assignmentsInChapter.length - toAssign.length;
      toast?.success(
        `Đã giao ${toAssign.length} bài của chương "${chapter?.name}" cho ${ids.length} lớp` +
        (skipped > 0 ? ` (bỏ qua ${skipped} bài Nháp)` : '')
      );
    }
    onClose();
  };

  /* ── Derived info for chapter mode ── */
  const publishedCount = mode === 'chapter'
    ? (assignmentsInChapter ?? []).filter(a => a.status !== 'draft').length : null;
  const draftCount = mode === 'chapter'
    ? (assignmentsInChapter ?? []).filter(a => a.status === 'draft').length : null;

  const modalTitle = mode === 'chapter'
    ? `Giao bài — ${chapter?.name}`
    : `Giao bài — ${hw?.title}`;
  const modalSub = mode === 'chapter'
    ? `Áp dụng cho ${publishedCount} bài Published${draftCount > 0 ? ` (bỏ qua ${draftCount} bài Nháp)` : ''}.`
    : `Học viên trong các lớp được chọn sẽ thấy và làm bài tập này.`;

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={modalTitle}
      description={modalSub}
      primaryAction={{ label: selected.size > 0 ? `Giao cho 1 lớp` : 'Giao bài', onClick: handleConfirm }}
      secondaryAction={{ label: 'Hủy' }}
    >
      {/* ── Deadline only ── */}
      <div className={styles.inviteDateRow} style={{ gridTemplateColumns: '1fr' }}>
        <div className={styles.inviteDateField}>
          <label className={styles.inviteDateLabel}>
            Hạn nộp bài <span className={styles.required}>*</span>
          </label>
          <DatePicker
            value={deadline}
            onChange={setDeadline}
            placeholder="dd/mm/yyyy"
          />
        </div>
      </div>

      <div className={styles.inviteDivider} />

      {/* Quick actions removed for single select */}

      {classes.length === 0 && (
        <p className={styles.inviteEmpty}>Chưa có lớp nào. Hãy tạo lớp trong Quản lý Người dùng.</p>
      )}

      <div className={styles.classList}>
        {classes.map(cls => {
          const on = selected.has(cls.id);
          return (
            <button
              key={cls.id}
              className={`${styles.classItem} ${on ? styles.classItemOn : ''}`}
              onClick={() => toggle(cls.id)}
            >
              <div className={`${styles.classCheckbox} ${on ? styles.classCheckboxOn : ''}`}>
              </div>
              <div className={styles.classInfo}>
                <span className={styles.className}>{cls.name}</span>
                <span className={styles.classCode}>{cls.code}</span>
              </div>
              <span className={styles.classGrade}>Lớp {cls.gradeLevel}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════
   Inline rename
══════════════════════════════════════════════════════════════ */

const RenameChapterInline = ({ chapter, onDone }) => {
  const { updateChapter } = useTeacher();
  const toast = useToast();
  const [val, setVal] = useState(chapter.name);

  const save = () => {
    if (val.trim() && val.trim() !== chapter.name) {
      updateChapter(chapter.id, { name: val.trim() });
      toast?.success('Đã đổi tên chương');
    }
    onDone();
  };

  return (
    <div className={styles.renameRow}>
      <input
        className={styles.renameInput}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') onDone();
        }}
        autoFocus
      />
      <button className={styles.renameConfirm} onClick={save}><Check size={14} /></button>
      <button className={styles.renameCancel} onClick={onDone}><XIcon size={14} /></button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   AssignedClassBadges — small chips showing invited classes
══════════════════════════════════════════════════════════════ */
const AssignedClassBadges = ({ assignedClassIds = [] }) => {
  const { classes } = useUserManagement();
  if (!assignedClassIds.length) return null;

  const names = assignedClassIds
    .map(id => classes.find(c => c.id === id))
    .filter(Boolean)
    .map(c => c.code ?? c.name);

  const MAX = 3;
  const shown = names.slice(0, MAX);
  const rest = names.length - MAX;

  return (
    <div className={styles.assignedBadges}>
      {shown.map((n, i) => (
        <span key={i} className={styles.assignedBadge}>{n}</span>
      ))}
      {rest > 0 && <span className={styles.assignedBadgeMore}>+{rest}</span>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SortableAssignmentRow — wraps each row with dnd-kit
══════════════════════════════════════════════════════════════ */
const SortableAssignmentRow = ({ hw, hwIdx, courseId, styles, navigate, updateAssignment, setInviteCtx, handleDeleteAssignment, isDragging }) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: selfDragging,
  } = useSortable({ id: hw.id });

  const TypeIcon = TYPE_LABELS[hw.type]?.icon ?? ClipboardList;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.16,1,0.3,1)',
    opacity: selfDragging ? 0.4 : 1,
    zIndex: selfDragging ? 999 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.assignmentRow} ${selfDragging ? styles.assignmentRowDragging : ''}`}
    >
      {/* Drag handle */}
      <button
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical size={15} />
      </button>

      <div className={styles.hwIcon}>
        <TypeIcon size={14} />
      </div>
      <div className={styles.hwMeta}>
        <span 
          className={styles.hwTitle} 
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/app/courses/${courseId}/assignments/${hw.id}`)}
        >
          <span className={styles.hwNum}>Bài {hwIdx + 1}.</span> {hw.title}
        </span>
        <div className={styles.hwInfoRow}>
          <span className={styles.hwInfo}>
            {TYPE_LABELS[hw.type]?.label ?? 'Quiz'} · {hw.questions?.length ?? 0} câu hỏi
          </span>
          {hw.status === 'draft' && (
            <span className={styles.draftBadge}>Nháp</span>
          )}
        </div>
      </div>
      <div className={styles.hwActions}>

        <Tooltip content="Giao bài cho lớp" side="top">
          <button
            className={`${styles.hwActionBtn} ${styles.hwActionInvite}`}
            onClick={() => setInviteCtx({ mode: 'single', hwId: hw.id })}
          >
            <Send size={13} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export const AdminCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    courses, getChaptersByCourse, getAssignmentsByChapter, getAssignmentsByCourse,
    deleteChapter, deleteAssignment, updateAssignment,
    getAssignmentLogsByCourse, getStudentProgress, deleteAssignmentLog, updateAssignmentLog,
    reorderAssignments, getAssignmentById
  } = useTeacher();
  const { classes, students: allStudents } = useUserManagement();

  const course = courses.find(c => c.id === courseId);
  if (!course) return <div className={styles.page}><p>Không tìm thấy khóa học.</p></div>;

  const chapters = getChaptersByCourse(courseId);
  const courseAssignments = getAssignmentsByCourse(courseId);
  const students = allStudents.filter(s => {
    const isAssigned = courseAssignments.some(a => a.assignedClassIds?.includes(s.classId));
    return isAssigned || s.enrolledCourseIds?.includes(courseId);
  });

  // UI state
  const [openChaps, setOpenChaps] = useState({});
  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [addHwCtx, setAddHwCtx] = useState(null);
  const [renamingChap, setRenamingChap] = useState(null);
  const [deleteChapCtx, setDeleteChapCtx] = useState(null);
  const [inviteCtx, setInviteCtx] = useState(null);
  const [detailLogCtx, setDetailLogCtx] = useState(null);
  const [activeTab, setActiveTab] = useState('chapters');
  const [activeHwId, setActiveHwId] = useState(null); // DnD drag overlay

  const toggleChap = (id) => setOpenChaps(p => ({ ...p, [id]: !p[id] }));

  // DnD sensors — require 5px movement before drag starts (avoids accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDeleteChap = () => {
    const hw = getAssignmentsByChapter(deleteChapCtx.id);
    deleteChapter(deleteChapCtx.id);
    toast?.success(`Đã xóa chương "${deleteChapCtx.name}" và ${hw.length} bài tập`);
    setDeleteChapCtx(null);
  };

  const handleDeleteAssignment = (hw) => {
    if (!window.confirm(`Xóa bài tập "${hw.title}"?`)) return;
    deleteAssignment(hw.id);
    toast?.success(`Đã xóa bài tập "${hw.title}"`);
  };

  const historyLogs = React.useMemo(() => {
    const rawLogs = getAssignmentLogsByCourse(courseId) || [];
    return rawLogs.map(log => {
      const assignedClassIds = classes.filter(c => log.assignedClasses.includes(c.name)).map(c => c.id);
      const targetedStudents = students.filter(s => assignedClassIds.includes(s.classId));

      // ── Look up chapter for this log ──
      let chapterName = null;
      let chapterOrder = null;
      if (log.type === 'single' && log.assignedHwIds?.length) {
        const hw = getAssignmentById(log.assignedHwIds[0]);
        if (hw) {
          const ch = chapters.find(c => c.id === hw.chapterId);
          if (ch) { chapterName = ch.name; chapterOrder = ch.order; }
        }
      } else if (log.type === 'chapter') {
        const ch = chapters.find(c => c.id === log.targetId);
        if (ch) { chapterName = ch.name; chapterOrder = ch.order; }
      }

      let completedCount = 0;
      const studentStats = targetedStudents.map(student => {
        const prog = getStudentProgress(student.id) || {};
        let isCompleted = true;
        let totalAttempts = 0;
        let scores = [];

        const hwIds = log.assignedHwIds || [];
        hwIds.forEach(hwId => {
          const hwProg = prog[hwId];
          if (!hwProg || hwProg.score === undefined || hwProg.score === null) {
            isCompleted = false;
          } else {
            totalAttempts += hwProg.attempts || 1;
            scores.push(hwProg.score);
          }
        });

        if (hwIds.length === 0) isCompleted = false;
        if (isCompleted) completedCount++;

        return {
          ...student,
          className: classes.find(c => c.id === student.classId)?.name || 'N/A',
          status: isCompleted ? 'completed' : 'missing',
          attempts: totalAttempts,
          scores: scores
        };
      });

      return {
        ...log,
        chapterName,
        chapterOrder,
        timestamp: new Date(log.assignedAt).toLocaleString('vi-VN', {
          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
        }),
        targetCount: log.type === 'chapter' ? (log.assignedHwIds?.length || 0) : 1,
        isOverdue: new Date(log.dueDate) < new Date(),
        progress: {
          total: targetedStudents.length,
          completed: completedCount,
          students: studentStats
        }
      };
    }).sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
  }, [courseId, getAssignmentLogsByCourse, classes, students, getStudentProgress, getAssignmentById, chapters]);

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <button className={styles.backBtn} onClick={() => navigate('/app/courses')}>
          <ChevronLeft size={16} /> Khóa học
        </button>
        <div className={styles.heroBody}>
          <h1 className={styles.heroTitle}>{course.name}</h1>
          <p className={styles.heroSub}>
            <span
              className={styles.heroDot}
              style={{ background: course.gradient }}
            />
            {course.classGroup} · {chapters.length} chương · {students.length} học viên
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'chapters' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('chapters')}
        >
          <BookOpen size={15} /> Chương &amp; Bài tập
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={15} /> Lịch sử giao bài
        </button>
      </div>

      {/* ════════ TAB: History ════════ */}
      {activeTab === 'history' && (
        <div className={styles.historySection}>
          {/* Top Bar */}
          <div className={styles.historyToolbar}>
            <div className={styles.historyStats}>
              <span className={styles.statLabel}>Lượt giao bài trong tháng:</span>
              <span className={styles.statValue}>{historyLogs.length}</span>
            </div>
            <div className={styles.historyFilters}>
              <button className={`${styles.filterBtn} ${styles.filterBtnActive}`}>Tất cả</button>
              <button className={styles.filterBtn}>Theo Chương</button>
              <button className={styles.filterBtn}>Theo Bài</button>
            </div>
          </div>

          {/* Timeline / Cards */}
          <div className={styles.historyTimeline}>
            {(() => {
              const groups = [];
              historyLogs.forEach(log => {
                const dateObj = new Date(log.assignedAt || log.timestamp); // Fallback if assignedAt is not available
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const y = dateObj.getFullYear();
                const monthYear = isNaN(y) ? 'Chưa rõ' : `${m}/${y}`;
                
                const d = String(dateObj.getDate()).padStart(2, '0');
                const mMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
                const hrs = String(dateObj.getHours()).padStart(2, '0');
                const mins = String(dateObj.getMinutes()).padStart(2, '0');
                
                const dateStr = isNaN(dateObj.getTime()) ? log.timestamp : `${d}/${mMonth}`;
                const timeStr = isNaN(dateObj.getTime()) ? '' : `${hrs}:${mins}`;

                const logWithTime = { ...log, dateStr, timeStr };

                const lastGroup = groups[groups.length - 1];
                if (lastGroup && lastGroup.monthYear === monthYear) {
                  lastGroup.logs.push(logWithTime);
                } else {
                  groups.push({ monthYear, logs: [logWithTime] });
                }
              });

              return groups.map(group => (
                <div key={group.monthYear} className={styles.historyMonthGroup}>
                  <div className={styles.historyMonthLabel}>{group.monthYear}</div>
                  {group.logs.map((log, idx) => {
                    const showDate = idx === 0 || log.dateStr !== group.logs[idx - 1].dateStr;
                    return (
                    <div key={log.id} className={styles.timelineItem}>
                      <div className={styles.timelineTimeBlock}>
                        {showDate && <div className={styles.timelineDate}>{log.dateStr}</div>}
                      </div>
                      
                      <div className={styles.timelineDivider}>
                        <div className={styles.timelineDot} style={{ background: log.type === 'chapter' ? 'var(--color-primary)' : 'var(--color-success)' }} />
                        {idx < group.logs.length - 1 && log.dateStr === group.logs[idx + 1].dateStr && (
                          <div className={styles.timelineLine} />
                        )}
                      </div>

                      <div className={styles.historyCard}>
                        <div className={styles.historyCardContent}>
                          <div className={styles.hcHeader}>
                            <h3 className={styles.hcTitle}>
                              {log.chapterName && (
                                <span className={styles.hcBreadcrumb}>
                                  {log.chapterName}
                                  {log.type === 'single' && <span className={styles.hcBreadcrumbSep}> | </span>}
                                </span>
                              )}
                              {log.type === 'single' && log.targetName}
                            </h3>
                            <span className={styles.hcIdBadge}>{log.id}</span>
                          </div>
                        <div className={styles.hcMeta}>
                          <span className={`${styles.hcDeadline} ${log.isOverdue ? styles.hcDeadlineOverdue : ''}`}>
                            <Calendar size={13} /> Hạn nộp: {log.dueDate}
                          </span>
                          {log.type === 'chapter' && <span className={styles.hcCount}>Bao gồm {log.targetCount} bài tập</span>}
                        </div>
                        <div className={styles.hcClasses}>
                          {log.assignedClasses.map(c => <span key={c} className={styles.hcClassBadge}>{c}</span>)}
                        </div>
                        <div className={styles.hcProgressBlock} onClick={() => setDetailLogCtx(log)}>
                          <div className={styles.hcProgressHeader}>
                            <span className={styles.hcProgressLabel}>Tiến độ hoàn thành:</span>
                            <span className={styles.hcProgressText}>{log.progress.completed}/{log.progress.total} học viên <span className={styles.hcProgressLink}>(Xem chi tiết)</span></span>
                          </div>
                          <div className={styles.hcProgressBar}>
                            <div className={styles.hcProgressFill} style={{ width: `${(log.progress.completed / log.progress.total) * 100}%`, background: log.progress.completed === log.progress.total ? 'var(--color-success)' : 'var(--color-primary)' }} />
                          </div>
                        </div>
                        <div className={styles.hcHoverActions}>
                          <Tooltip content="Sửa hạn nộp" side="top">
                            <button className={styles.hcIconBtn} onClick={() => {
                              const newDate = prompt('Nhập hạn nộp mới (VD: 2026-06-01):', log.dueDate);
                              if (newDate) {
                                updateAssignmentLog(log.id, { dueDate: newDate });
                                (log.assignedHwIds || []).forEach(hwId => updateAssignment(hwId, { dueDate: newDate }));
                                toast?.success('Đã cập nhật hạn nộp');
                              }
                            }}><Calendar size={15} /></button>
                          </Tooltip>
                          <Tooltip content="Thu hồi giao bài" side="top">
                            <button className={`${styles.hcIconBtn} ${styles.hcIconRevoke}`} onClick={() => {
                              if (window.confirm(`Thu hồi ${log.type === 'chapter' ? 'chương' : 'bài tập'} này?`)) {
                                deleteAssignmentLog(log.id);
                                (log.assignedHwIds || []).forEach(hwId => updateAssignment(hwId, { assignedClassIds: [] }));
                                toast?.success('Đã thu hồi giao bài');
                              }
                            }}><XIcon size={15} /></button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ════════ TAB: Chapters ════════ */}
      {activeTab === 'chapters' && (
        <div className={styles.chapterSection}>
          <div className={styles.toolbar}>
            <p className={styles.toolbarCount}>{chapters.length} chương</p>
            <Button variant="primary" size="sm" onClick={() => setAddChapterOpen(true)}>
              <Plus size={14} /> Thêm chương
            </Button>
          </div>

          <div className={styles.chapterList}>
            {chapters.length === 0 && (
              <div className={styles.empty}>
                Chưa có chương nào. Hãy thêm chương đầu tiên!
              </div>
            )}

            {chapters.map((ch) => {
              const assignments = getAssignmentsByChapter(ch.id);
              const expanded = openChaps[ch.id] !== false;

              return (
                <div key={ch.id} className={styles.chapterCard}>
                  {/* Chapter header */}
                  <div className={styles.chapterHeader}>
                    <button className={styles.chapterToggle} onClick={() => toggleChap(ch.id)}>
                      {expanded
                        ? <ChevronDown size={16} className={styles.chevron} />
                        : <ChevronRight size={16} className={styles.chevron} />}
                    </button>

                    <span className={styles.chapterOrder}>{ch.order ?? (chapters.indexOf(ch) + 1)}</span>

                    {renamingChap === ch.id ? (
                      <RenameChapterInline chapter={ch} onDone={() => setRenamingChap(null)} />
                    ) : (
                      <span className={styles.chapterName}>{ch.name}</span>
                    )}

                    <span className={styles.chapterCount}>{assignments.length} bài</span>

                    {/* Hover actions */}
                    <div className={styles.chapterActions}>
                      <Tooltip content="Giao bài cả chương" side="top">
                        <button
                          className={`${styles.chapterActionBtn} ${styles.chapterActionInvite}`}
                          onClick={() => setInviteCtx({
                            mode: 'chapter',
                            chapter: ch,
                            assignmentsInChapter: assignments,
                          })}
                        >
                          <Send size={13} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Thêm bài tập" side="top">
                        <button
                          className={styles.chapterActionBtn}
                          onClick={() => setAddHwCtx({ chapterId: ch.id })}
                        >
                          <Plus size={13} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Đổi tên chương" side="top">
                        <button
                          className={styles.chapterActionBtn}
                          onClick={() => setRenamingChap(ch.id)}
                        >
                          <Pencil size={13} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Xóa chương" side="top">
                        <button
                          className={`${styles.chapterActionBtn} ${styles.chapterActionDelete}`}
                          onClick={() => setDeleteChapCtx(ch)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Assignment list */}
                  <div className={`${styles.assignmentListWrapper} ${expanded ? styles.assignmentListWrapperExpanded : ''}`}>
                    <div className={styles.assignmentListInner}>
                      <div className={styles.assignmentList}>
                        {assignments.length === 0 && (
                          <button
                            className={styles.addFirstBtn}
                            onClick={() => setAddHwCtx({ chapterId: ch.id })}
                          >
                            <Plus size={14} /> Thêm bài tập đầu tiên
                          </button>
                        )}

                        {assignments.length > 0 && (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={({ active }) => setActiveHwId(active.id)}
                            onDragEnd={({ active, over }) => {
                              setActiveHwId(null);
                              if (!over || active.id === over.id) return;
                              const oldIdx = assignments.findIndex(a => a.id === active.id);
                              const newIdx = assignments.findIndex(a => a.id === over.id);
                              const newOrder = arrayMove(assignments, oldIdx, newIdx).map(a => a.id);
                              reorderAssignments(ch.id, newOrder);
                            }}
                          >
                            <SortableContext items={assignments.map(a => a.id)} strategy={verticalListSortingStrategy}>
                              {assignments.map((hw, hwIdx) => (
                                <SortableAssignmentRow
                                  key={hw.id}
                                  hw={hw}
                                  hwIdx={hwIdx}
                                  courseId={courseId}
                                  styles={styles}
                                  navigate={navigate}
                                  updateAssignment={updateAssignment}
                                  setInviteCtx={setInviteCtx}
                                  handleDeleteAssignment={handleDeleteAssignment}
                                />
                              ))}
                            </SortableContext>

                            {/* Floating drag overlay */}
                            <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.16,1,0.3,1)' }}>
                              {activeHwId ? (() => {
                                const dragHw = assignments.find(a => a.id === activeHwId);
                                if (!dragHw) return null;
                                const TypeIcon = TYPE_LABELS[dragHw.type]?.icon ?? ClipboardList;
                                return (
                                  <div className={`${styles.assignmentRow} ${styles.assignmentRowOverlay}`}>
                                    <button className={`${styles.dragHandle} ${styles.dragHandleActive}`} tabIndex={-1}>
                                      <GripVertical size={15} />
                                    </button>
                                    <div className={styles.hwIcon}><TypeIcon size={14} /></div>
                                    <div className={styles.hwMeta}>
                                      <span className={styles.hwTitle}>
                                        <span className={styles.hwNum}>Bài {assignments.findIndex(a => a.id === activeHwId) + 1}.</span> {dragHw.title}
                                      </span>
                                      <span className={styles.hwInfo}>{TYPE_LABELS[dragHw.type]?.label ?? 'Quiz'} · {dragHw.questions?.length ?? 0} câu hỏi</span>
                                    </div>
                                  </div>
                                );
                              })() : null}
                            </DragOverlay>
                          </DndContext>
                        )}

                        {assignments.length > 0 && (
                          <button
                            className={styles.addMoreBtn}
                            onClick={() => setAddHwCtx({ chapterId: ch.id })}
                          >
                            <Plus size={13} /> Thêm bài tập
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════ TAB: Students ════════ */}
      {activeTab === 'students' && (
        <div className={styles.studentTable}>
          <div className={`${styles.studentRow} ${styles.studentHeader}`}>
            <span>Học viên</span>
            <span>Email</span>
            <span>Lớp</span>
          </div>
          {students.length === 0 && (
            <div className={styles.empty}>Chưa có học viên đăng ký khóa học này.</div>
          )}
          {students.map((s) => {
            const initials = s.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
            return (
              <div key={s.id} className={styles.studentRow} onClick={() => navigate(`/app/students/${s.id}`)}>
                <div className={styles.studentCell}>
                  <div className={styles.avatar}>{initials}</div>
                  <span>{s.name}</span>
                </div>
                <span className={styles.studentEmail}>{s.email}</span>
                <span className={styles.studentClass}>{s.classGroup}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <AddChapterModal open={addChapterOpen} courseId={courseId} onClose={() => setAddChapterOpen(false)} />

      {addHwCtx && (
        <AddAssignmentModal
          open={!!addHwCtx}
          courseId={courseId}
          chapterId={addHwCtx.chapterId}
          onClose={() => setAddHwCtx(null)}
        />
      )}

      {deleteChapCtx && (
        <DeleteChapterModal
          open={!!deleteChapCtx}
          chapter={deleteChapCtx}
          assignmentCount={getAssignmentsByChapter(deleteChapCtx.id).length}
          onConfirm={handleDeleteChap}
          onClose={() => setDeleteChapCtx(null)}
        />
      )}

      {inviteCtx && (
        <InviteClassModal
          key={inviteCtx.hwId ?? inviteCtx.chapter?.id}
          open={!!inviteCtx}
          mode={inviteCtx.mode}
          courseId={courseId}
          hwId={inviteCtx.hwId}
          chapter={inviteCtx.chapter}
          assignmentsInChapter={inviteCtx.assignmentsInChapter}
          onClose={() => setInviteCtx(null)}
        />
      )}

      {/* ── Drawer: Progress Details ── */}
      {detailLogCtx && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setDetailLogCtx(null)} />
          <div className={styles.drawerContent}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Chi tiết: {detailLogCtx.targetName}</h3>
              <button className={styles.drawerClose} onClick={() => setDetailLogCtx(null)}><XIcon size={20} /></button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.progressDetailModal}>
                <div className={styles.pdmStats}>
                  <div className={styles.pdmStatBox}>
                    <span className={styles.pdmStatNum}>{detailLogCtx.progress.completed}</span>
                    <span className={styles.pdmStatLabel}>Đã nộp</span>
                  </div>
                  <div className={styles.pdmStatBoxWarning}>
                    <span className={styles.pdmStatNumWarning}>{detailLogCtx.progress.total - detailLogCtx.progress.completed}</span>
                    <span className={styles.pdmStatLabelWarning}>Chưa nộp</span>
                  </div>
                </div>

                <h4 className={styles.pdmListTitle}>Chưa nộp ({detailLogCtx.progress.total - detailLogCtx.progress.completed})</h4>
                <div className={styles.pdmList}>
                  {detailLogCtx.progress.students.filter(s => s.status === 'missing').map(student => (
                    <div key={student.id} className={styles.pdmStudentItem}>
                      <div className={styles.pdmAvatar}>{student.name.charAt(0)}</div>
                      <div className={styles.pdmInfo}>
                        <span className={styles.pdmName}>{student.name}</span>
                        <span className={styles.pdmClass}>{student.className}</span>
                      </div>
                      <div className={styles.pdmMetrics}>
                        <span className={styles.pdmStatusMissing}>Chưa làm bài</span>
                      </div>
                    </div>
                  ))}
                </div>

                <h4 className={styles.pdmListTitle} style={{ marginTop: '1.5rem' }}>Đã nộp ({detailLogCtx.progress.completed})</h4>
                <div className={styles.pdmList}>
                  {detailLogCtx.progress.students.filter(s => s.status === 'completed').map(student => (
                    <div key={student.id} className={styles.pdmStudentItem}>
                      <div className={styles.pdmAvatar}>{student.name.charAt(0)}</div>
                      <div className={styles.pdmInfo}>
                        <span className={styles.pdmName}>{student.name}</span>
                        <span className={styles.pdmClass}>{student.className}</span>
                      </div>
                      <div className={styles.pdmMetrics}>
                        <div className={styles.pdmMetric}><span className={styles.pdmMetricLabel}>Số lần:</span> {student.attempts}</div>
                        <div className={styles.pdmMetric}><span className={styles.pdmMetricLabel}>Điểm:</span> <span className={student.scores.every(s => s === 10) ? styles.pdmScoreSuccess : styles.pdmScore}>{student.scores.join(', ')}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
