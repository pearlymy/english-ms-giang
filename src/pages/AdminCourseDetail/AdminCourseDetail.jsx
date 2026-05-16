/**
 * AdminCourseDetail.jsx
 * Data: Supabase (chapters = units, assignments = items)
 */
import React, { useState, useContext, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ChevronDown, ChevronRight, Plus, Pencil, Trash2,
  ClipboardList, BookOpen, Users, Eye,
  CheckCircle, AlertCircle, Clock, Send, Loader2, X,
  History, Calendar, ChevronUp, GripVertical
} from 'lucide-react';

import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '../../design-system/components/Button/Button';
import { Modal } from '../../design-system/components/Modal/Modal';
import { ToastContext } from '../../design-system/components/Toast/Toast';
import { useTeacher } from '../../contexts/TeacherContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { DatePicker } from '../../components/DatePicker';
import { CreateAssignmentDrawer } from './components/CreateAssignmentDrawer';
import { CreateTestDrawer } from './components/CreateTestDrawer';
import { UnitModal } from './components/UnitModal';
import styles from './AdminCourseDetail.module.css';
import drawerStyles from './components/CreateAssignmentDrawer.module.css';

const useToast = () => useContext(ToastContext);

/* ── Mock classes (local dev — no DB required) ─────────────────────────── */
const MOCK_CLASSES = [
  { id: 'cls-1', name: 'Lớp 3A', code: '2026.03.01', gradeLevel: 3 },
  { id: 'cls-2', name: 'Lớp 3B', code: '2026.03.02', gradeLevel: 3 },
  { id: 'cls-3', name: 'Lớp 4A', code: '2026.04.01', gradeLevel: 4 },
  { id: 'cls-4', name: 'Lớp 4B', code: '2026.04.02', gradeLevel: 4 },
  { id: 'cls-5', name: 'Lớp 5A', code: '2026.05.01', gradeLevel: 5 },
];

/* ══════════════════════════════════════
   InviteClassModal
══════════════════════════════════════ */
export const InviteClassModal = ({ open, mode, courseId, hwId, chapter, unit, assignmentsInChapter, onClose }) => {
  const { classes } = useUserManagement();
  const { updateAssignment, getAssignmentById } = useTeacher();
  const toast = useToast();
  const hw = hwId ? getAssignmentById(hwId) : null;

  const getTPlus7 = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; };
  const [selected, setSelected] = useState(() => new Set());
  const [deadline, setDeadline] = useState(() => getTPlus7());

  React.useEffect(() => {
    if (open) { setSelected(new Set()); setDeadline(getTPlus7()); }
  }, [open, hwId, chapter?.id, unit?.id]);

  const toggle = (id) => setSelected(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else { n.clear(); n.add(id); } return n;
  });

  const getTitle = () => {
    if (mode === 'unit') return `Giao cả Unit — ${unit?.name}`;
    if (mode === 'chapter') return `Giao bài — ${chapter?.name}`;
    return `Giao bài — ${hw?.title}`;
  };

  const handleConfirm = () => {
    if (!deadline) { toast?.error('Vui lòng chọn Hạn nộp bài'); return; }
    if (selected.size === 0) { toast?.error('Vui lòng chọn ít nhất 1 lớp'); return; }
    const ids = [...selected];

    if (mode === 'unit' && unit) {
      const count = unit.items.length;
      toast?.success(`Đã giao ${count} bài của "${unit.name}" cho ${ids.length} lớp (hạn: ${new Date(deadline).toLocaleDateString('vi-VN')})`);
    } else if (mode === 'single' && hw) {
      updateAssignment(hw.id, { assignedClassIds: ids, dueDate: deadline });
      toast?.success(`Đã giao "${hw.title}" cho ${ids.length} lớp`);
    } else if (mode === 'chapter' && assignmentsInChapter) {
      assignmentsInChapter.filter(a => a.status !== 'draft')
        .forEach(a => updateAssignment(a.id, { assignedClassIds: ids, dueDate: deadline }));
      toast?.success(`Đã giao bài của "${chapter?.name}" cho ${ids.length} lớp`);
    }
    onClose();
  };

  const unitSummary = mode === 'unit' && unit ? (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      <span style={{ fontSize: 12.5, background: '#e0e7ff', color: '#4f46e5', padding: '3px 10px', borderRadius: 10, fontWeight: 600 }}>
        {unit.items.filter(i => i.type === 'exercise').length} bài tập
      </span>
      <span style={{ fontSize: 12.5, background: '#d1fae5', color: '#059669', padding: '3px 10px', borderRadius: 10, fontWeight: 600 }}>
        {unit.items.filter(i => i.type === 'test').length} kiểm tra
      </span>
      <span style={{ fontSize: 12, color: '#6b7280' }}>sẽ được giao cho lớp đã chọn</span>
    </div>
  ) : null;

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }}
      title={getTitle()}
      primaryAction={{ label: selected.size > 0 ? `Giao cho ${selected.size} lớp` : 'Chọn lớp để giao', onClick: handleConfirm }}
      secondaryAction={{ label: 'Hủy' }}>
      {unitSummary}
      <div className={styles.inviteDateRow} style={{ gridTemplateColumns: '1fr' }}>
        <div className={styles.inviteDateField}>
          <label className={styles.inviteDateLabel}>Hạn nộp bài <span className={styles.required}>*</span></label>
          <DatePicker value={deadline} onChange={setDeadline} placeholder="dd/mm/yyyy" />
        </div>
      </div>
      <div className={styles.inviteDivider} />
      {classes.length === 0 && <p className={styles.inviteEmpty}>Chưa có lớp nào.</p>}
      <div className={styles.classList}>
        {classes.map(cls => {
          const on = selected.has(cls.id);
          return (
            <button key={cls.id} className={`${styles.classItem} ${on ? styles.classItemOn : ''}`} onClick={() => toggle(cls.id)}>
              <div className={`${styles.classCheckbox} ${on ? styles.classCheckboxOn : ''}`} />
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

/* ── Helpers ── */
const getTPlus7 = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; };

/* ── localStorage helpers for class assignments ── */
const CLASS_ASSIGN_KEY = (classId) => `class_assignments_${classId}`;

const readClassAssignments = (classId) => {
  try { const s = localStorage.getItem(CLASS_ASSIGN_KEY(classId)); return s ? JSON.parse(s) : []; } catch { return []; }
};

const writeClassAssignments = (classId, data) => {
  try { localStorage.setItem(CLASS_ASSIGN_KEY(classId), JSON.stringify(data)); } catch { }
};

/* ──────────────────────
   AssignUnitModal — Giao Unit hoặc bài tập cho lớp (local state + persist)
────────────────────── */
const AssignUnitModal = ({ open, unit, item, onClose, courseGradeLevel }) => {
  const toast = useToast();
  const { classes: ctxClasses, getStudentsByClass, students } = useUserManagement();
  // Lọc chỉ lớp cùng khối với khóa học
  const allClasses = ctxClasses.length > 0 ? ctxClasses : MOCK_CLASSES;
  const classes = courseGradeLevel
    ? allClasses.filter(c => Number(c.gradeLevel) === Number(courseGradeLevel))
    : allClasses;

  const [selected, setSelected] = useState(new Set());
  const [deadline, setDeadline] = useState(() => getTPlus7());

  React.useEffect(() => {
    if (open) { setSelected(new Set()); setDeadline(getTPlus7()); }
  }, [open, unit?.id, item?.id]);

  // Tính lớp nào đã được giao bài/unit này rồi
  const alreadyAssigned = React.useMemo(() => {
    const assignmentIds = item
      ? [item.id]
      : (unit?.items ?? []).map(i => i.id);
    const result = new Set();
    const todayStr = new Date().toISOString().split('T')[0];

    classes.forEach(cls => {
      const records = readClassAssignments(cls.id);
      
      if (item) {
        // Giao theo bài: Nếu cùng ngày thì không cho giao trùng
        const isAssignedToday = records.some(r => {
          if (r.assignmentId !== item.id) return false;
          if (!r.assignedAt) return true; // Fallback an toàn nếu thiếu dữ liệu ngày
          return r.assignedAt.split('T')[0] === todayStr;
        });
        if (isAssignedToday) result.add(cls.id);
      } else {
        // Giao cả unit: Nếu trong unit còn bài tập chưa giao thì cho giao (chỉ block khi đã giao HẾT)
        if (assignmentIds.length === 0) {
          result.add(cls.id); // Unit trống không cho giao
        } else {
          const allAssigned = assignmentIds.every(aId => records.some(r => r.assignmentId === aId));
          if (allAssigned) result.add(cls.id);
        }
      }
    });
    return result;
  }, [open, unit?.id, unit?.items, item?.id, classes]);

  const toggle = (id) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const allSelected = selected.size === classes.length && classes.length > 0;

  const doAssign = () => {
    const now = new Date().toISOString();
    const assignedAt = now;

    // Danh sách item IDs được giao
    const assignmentIds = item
      ? [item.id]
      : (unit?.items ?? []).map(i => i.id);

    const totalStudents = [...selected].reduce((sum, cId) => {
      const count = getStudentsByClass ? getStudentsByClass(cId).length : (students ?? []).filter(s => s.classId === cId).length;
      return sum + count;
    }, 0);

    // Lưu vào localStorage cho từng lớp
    [...selected].forEach(classId => {
      const current = readClassAssignments(classId);
      assignmentIds.forEach(aId => {
        const existing = current.findIndex(x => x.assignmentId === aId);
        const record = {
          assignmentId: aId,
          unitId: item ? item._raw?.chapterId : unit?.id,
          unitName: item ? (unit?.name ?? '') : (unit?.name ?? ''),
          assignmentName: item ? item.name : (unit?.name + ' (cả Unit)'),
          isUnit: !item,
          deadline,
          assignedAt,
        };
        if (existing >= 0) {
          current[existing] = record; // overwrite
        } else {
          current.push(record);
        }
      });
      writeClassAssignments(classId, current);
    });

    const studentNote = totalStudents > 0 ? ` (${totalStudents} học viên sẽ nhận bài)` : '';
    toast?.success(item
      ? `Đã giao bài tập cho ${selected.size} lớp${studentNote}`
      : `Đã giao Unit "${unit?.name}" cho ${selected.size} lớp${studentNote}`);
    onClose(true); // true = refresh needed
  };

  const handleConfirm = () => {
    if (selected.size === 0) { toast?.error('Vui lòng chọn ít nhất 1 lớp'); return; }
    if (!deadline) { toast?.error('Vui lòng chọn hạn nộp bài'); return; }

    // Kiểm tra xem có lớp nào đã được giao rồi không
    const reAssignClasses = [...selected].filter(id => alreadyAssigned.has(id));
    if (reAssignClasses.length > 0) {
      const names = reAssignClasses
        .map(id => classes.find(c => c.id === id)?.name ?? id)
        .join(', ');
      const label = item ? `"${item.name}"` : `Unit "${unit?.name}"`;
      const confirmed = window.confirm(
        `⚠️ ${label} đã được giao cho: ${names}.\n\nBạn có muốn giao lại và cập nhật deadline mới không?`
      );
      if (!confirmed) return;
    }
    doAssign();
  };

  const exCount = unit?.items?.filter(i => i.type === 'exercise').length ?? 0;
  const tsCount = unit?.items?.filter(i => i.type === 'test').length ?? 0;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          background: 'rgba(0,0,0,0.45)',
          position: 'fixed', inset: 0, zIndex: 999,
          animation: 'fadeIn 150ms ease',
        }} />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 1000,
            width: 'min(480px, 94vw)',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-surface)',
            borderRadius: 20,
            boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            outline: 'none',
            animation: 'slideUp 180ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* ── HEADER ── */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <Dialog.Title style={{
                margin: 0, fontSize: 17, fontWeight: 700,
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-family-display)',
                lineHeight: 1.3,
              }}>
                {item ? 'Giao bài tập' : 'Giao Unit'}
              </Dialog.Title>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                {item ? item.name : unit?.name}
              </p>
            </div>
            <Dialog.Close asChild>
              <button style={{
                flexShrink: 0,
                width: 32, height: 32,
                borderRadius: '50%',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-alt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--color-text-secondary)',
                transition: 'all 0.15s',
              }}>
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* ── BODY (scrollable) ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>

            {/* Unit summary badges (Only if assigning unit) */}
            {!item && (
              <div style={{
                display: 'flex', gap: 8, flexWrap: 'wrap',
                alignItems: 'center', marginBottom: 16,
                padding: '10px 14px',
                background: 'var(--color-surface-alt)',
                borderRadius: 12,
                border: '1px solid var(--color-border)',
              }}>
                <span style={{
                  fontSize: 12, background: '#e0e7ff', color: '#4338ca',
                  padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                }}>
                  {exCount} bài tập
                </span>
                <span style={{
                  fontSize: 12, background: '#d1fae5', color: '#047857',
                  padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                }}>
                  {tsCount} kiểm tra
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  sẽ được giao cho lớp đã chọn
                </span>
              </div>
            )}

            {/* Deadline picker */}
            <div style={{
              marginBottom: 16,
              padding: '12px 14px',
              background: 'var(--color-surface-alt)',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
            }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
                <Calendar size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                Hạn nộp bài <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDeadline(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 8, fontSize: 14,
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-base)',
                  outline: 'none', cursor: 'pointer',
                }}
              />
            </div>

            {/* Select-all toolbar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Danh sách lớp
                {selected.size > 0 && (
                  <span style={{
                    marginLeft: 8, fontSize: 11.5, fontWeight: 700,
                    background: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    padding: '1px 8px', borderRadius: 20,
                  }}>
                    đã chọn {selected.size}
                  </span>
                )}
              </span>
              <button
                onClick={() => setSelected(allSelected ? new Set() : new Set(classes.map(c => c.id)))}
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '4px 12px',
                  background: allSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface-alt)',
                  color: allSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  border: `1px solid ${allSelected ? 'var(--color-primary-accent-border)' : 'var(--color-border)'}`,
                  borderRadius: 8, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {allSelected ? '✓ Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            {/* Class list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {classes.map(cls => {
                const on = selected.has(cls.id);
                const wasAssigned = alreadyAssigned.has(cls.id);
                // Đếm học viên trong lớp từ context (Supabase) hoặc mock
                const studentCount = getStudentsByClass
                  ? getStudentsByClass(cls.id).length
                  : (students ?? []).filter(s => s.classId === cls.id).length;
                return (
                  <button
                    key={cls.id}
                    disabled={wasAssigned}
                    onClick={() => !wasAssigned && toggle(cls.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '12px 14px',
                      background: wasAssigned
                        ? 'var(--color-surface-alt)'
                        : on
                          ? 'linear-gradient(135deg,rgba(77,201,230,0.08),rgba(99,102,241,0.08))'
                          : 'var(--color-surface)',
                      border: `1.5px solid ${wasAssigned ? 'var(--color-border)' : on ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 12,
                      cursor: wasAssigned ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s',
                      boxShadow: on ? '0 0 0 3px rgba(77,201,230,0.14)' : 'none',
                      opacity: wasAssigned ? 0.5 : 1,
                    }}
                  >
                    {/* Square checkbox */}
                    <div style={{
                      flexShrink: 0,
                      width: 20, height: 20,
                      borderRadius: 6,
                      border: `2px solid ${on ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
                      background: on ? 'var(--gradient-primary)' : 'var(--color-surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                      boxShadow: on ? '0 0 0 3px rgba(77,201,230,0.18)' : 'none',
                    }}>
                      {on && (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1 4L4.2 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    {/* Class info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        fontFamily: 'var(--font-family-display)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        {cls.name}
                        {wasAssigned && (
                          <span style={{
                            fontSize: 10.5, fontWeight: 700,
                            background: '#fef3c7', color: '#92400e',
                            border: '1px solid #fcd34d',
                            padding: '1px 7px', borderRadius: 20,
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            flexShrink: 0,
                          }}>
                            ⚠ Đã giao
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 11.5, color: 'var(--color-text-tertiary)',
                        fontWeight: 500, marginTop: 1,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span>{cls.code}</span>
                        <span style={{ color: 'var(--color-border-strong)' }}>·</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          color: studentCount > 0 ? '#059669' : '#9ca3af',
                          fontWeight: 600,
                        }}>
                          <Users size={10} />
                          {studentCount > 0 ? `${studentCount} học viên` : 'Chưa có học viên'}
                        </span>
                      </div>
                    </div>

                    {/* Grade badge */}
                    <span style={{
                      flexShrink: 0,
                      fontSize: 11, fontWeight: 700,
                      color: on ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      background: on ? 'var(--color-primary-subtle)' : 'var(--color-surface-alt)',
                      border: `1.5px solid ${on ? 'rgba(77,201,230,0.4)' : 'var(--color-border)'}`,
                      padding: '3px 10px', borderRadius: 20,
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}>
                      Khối {cls.gradeLevel}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* ── FOOTER ── */}
          {(() => {
            const totalSelectedStudents = [...selected].reduce((sum, cId) => {
              const count = getStudentsByClass ? getStudentsByClass(cId).length : (students ?? []).filter(s => s.classId === cId).length;
              return sum + count;
            }, 0);
            return (
              <div style={{
                padding: '14px 24px 20px',
                borderTop: '1px solid var(--color-border)',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                background: 'var(--color-surface)',
              }}>
                {/* Tổng học viên sẽ nhận bài */}
                {selected.size > 0 && totalSelectedStudents > 0 ? (
                  <span style={{
                    fontSize: 12.5, color: '#059669', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: '#ecfdf5', padding: '5px 10px', borderRadius: 20,
                    border: '1px solid #a7f3d0',
                  }}>
                    <Users size={12} />
                    {totalSelectedStudents} học viên sẽ nhận bài
                  </span>
                ) : (
                  <span />
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <Dialog.Close asChild>
                    <button style={{
                      padding: '9px 20px',
                      fontSize: 13.5, fontWeight: 600,
                      border: '1.5px solid var(--color-border)',
                      borderRadius: 10,
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                      Hủy
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleConfirm}
                    style={{
                      padding: '9px 22px',
                      fontSize: 13.5, fontWeight: 700,
                      border: 'none',
                      borderRadius: 10,
                      background: selected.size > 0
                        ? 'var(--gradient-primary)'
                        : 'var(--color-border)',
                      color: selected.size > 0 ? '#fff' : 'var(--color-text-tertiary)',
                      cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.18s',
                      boxShadow: selected.size > 0 ? '0 4px 12px rgba(77,201,230,0.35)' : 'none',
                    }}
                  >
                    {selected.size > 0 ? `Giao cho ${selected.size} lớp` : 'Chọn lớp để giao'}
                  </button>
                </div>
              </div>
            );
          })()}

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/* ══════════════════════════════════════
   DeleteItemModal
══════════════════════════════════════ */
const DeleteItemModal = ({ open, item, onConfirm, onClose }) => (
  <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }}
    title="Xác nhận xóa"
    primaryAction={{ label: 'Xóa', onClick: onConfirm, variant: 'danger' }}
    secondaryAction={{ label: 'Hủy' }}>
    <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
      Bạn có chắc muốn xóa <strong>"{item?.name}"</strong>?<br />
      <span style={{ color: '#6b7280', fontSize: 13 }}>Hành động này không thể hoàn tác.</span>
    </p>
  </Modal>
);

/* ══════════════════════════════════════
   SortableUnit
══════════════════════════════════════ */
const SortableUnit = ({ unit, expanded, ex, ts, onToggle, onCreateAssignment, onCreateTest, onAssignUnit, onEditUnit, onDeleteUnit, onToggleStatus, onViewItem, onEditItem, onAssignItem, onDeleteItem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: unit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className={`${styles.unitCard} ${expanded ? styles.unitCardOpen : ''} ${isDragging ? styles.unitCardDragging : ''}`}>
      {/* Unit Header */}
      <div className={styles.unitHeader} onClick={() => onToggle(unit.id)}>
        <div className={styles.unitDragHandle} {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
          <GripVertical size={16} />
        </div>
        <div className={styles.unitToggleWrap}>
          {expanded ? <ChevronDown size={18} className={styles.unitChevron} /> : <ChevronRight size={18} className={styles.unitChevron} />}
        </div>
        <div className={styles.unitOrderBadge}>{unit.order}</div>
        <div className={styles.unitInfo}>
          <h3 className={styles.unitName}>{unit.name}</h3>
          <div className={styles.unitCountRow}>
            <span className={styles.unitCountPill}>
              <ClipboardList size={11} /> {ex} bài tập
            </span>
            <span className={styles.unitCountPill}>
              <CheckCircle size={11} /> {ts} kiểm tra
            </span>
          </div>
        </div>

        <div className={styles.unitHeaderActions} onClick={e => e.stopPropagation()}>
          <button className={styles.unitActionBtnSm} onClick={() => onCreateAssignment(unit)}>
            <Plus size={13} /> Tạo bài tập
          </button>
          <button className={`${styles.unitActionBtnSm} ${styles.unitActionBtnSmTest}`} onClick={() => onCreateTest(unit)}>
            <Plus size={13} /> Tạo kiểm tra
          </button>
          <button className={`${styles.unitActionBtnSm} ${styles.unitActionBtnSmAssign}`} onClick={() => onAssignUnit(unit)} title="Giao Unit">
            <Send size={15} />
          </button>
          <button className={styles.unitEditBtn} onClick={() => onEditUnit(unit)} title="Chỉnh sửa">
            <Pencil size={15} />
          </button>
          <button className={styles.unitEditBtn} onClick={() => onDeleteUnit(unit.id)} title="Xóa Unit" style={{ color: '#ef4444' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Unit Body */}
      {expanded && (
        <div className={styles.unitBody}>
          {unit.items.length > 0 ? (
            <div className={styles.unitItemList}>
              {unit.items.map(item => (
                <div key={item.id} className={styles.unitItem}>
                  <div className={`${styles.unitItemIcon} ${item.type === 'test' ? styles.unitItemIconTest : ''}`}>
                    {item.type === 'test' ? <CheckCircle size={14} /> : <ClipboardList size={14} />}
                  </div>
                  <div className={styles.unitItemInfo}>
                    <span className={styles.unitItemName}>{item.name}</span>
                    <div className={styles.unitItemMeta}>
                      <span className={styles.unitItemType}>{item.type === 'test' ? 'Bài kiểm tra' : 'Bài tập'}</span>
                      <button
                        className={`${styles.unitItemStatusBtn} ${item.status === 'published' ? styles.statusPublished : styles.statusDraft}`}
                        onClick={() => onToggleStatus(item)}
                        title="Click để thay đổi trạng thái"
                      >
                        {item.status === 'published' ? '● Đã tạo' : '○ Bản nháp'}
                      </button>
                      <span className={styles.unitItemDate}><Clock size={11} /> {item.updatedAt}</span>
                    </div>
                  </div>
                  <div className={styles.unitItemActions}>
                    <button className={styles.unitItemBtnLabel} title="Xem chi tiết" onClick={() => onViewItem(item)}>
                      <Eye size={13} /> Xem
                    </button>
                    <button className={styles.unitItemBtnLabel} title="Chỉnh sửa" onClick={() => onEditItem(item)}>
                      <Pencil size={13} /> Sửa
                    </button>
                    <button className={styles.unitItemBtnLabel} title="Giao bài cho lớp" onClick={() => onAssignItem(item)}>
                      <Send size={13} /> Giao
                    </button>
                    <button className={`${styles.unitItemBtnLabel} ${styles.unitItemBtnLabelDanger}`} title="Xóa" onClick={() => onDeleteItem(item)}>
                      <Trash2 size={13} /> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.unitEmpty}>
              <ClipboardList size={24} />
              <p>Chưa có bài tập nào trong unit này</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   UnitAccordion
══════════════════════════════════════ */
const UnitAccordion = ({ units, onCreateAssignment, onCreateTest, onEditUnit, onDeleteUnit, onToggleStatus, onDeleteItem, onAssignItem, onAssignUnit, onViewItem, onEditItem, expandedUnitId, onReorderUnits }) => {
  const [openUnits, setOpenUnits] = useState(() => expandedUnitId ? { [expandedUnitId]: true } : {});
  const toggle = (id) => setOpenUnits(p => ({ ...p, [id]: !p[id] }));

  // Auto-expand khi expandedUnitId thay đổi (sau khi tạo bài)
  React.useEffect(() => {
    if (expandedUnitId) setOpenUnits(p => ({ ...p, [expandedUnitId]: true }));
  }, [expandedUnitId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = units.findIndex(u => u.id === active.id);
      const newIndex = units.findIndex(u => u.id === over.id);
      const newUnits = arrayMove(units, oldIndex, newIndex);
      if (onReorderUnits) onReorderUnits(newUnits);
    }
  };

  if (units.length === 0) {
    return (
      <div className={styles.unitEmpty} style={{ padding: '48px 0', textAlign: 'center' }}>
        <BookOpen size={32} style={{ color: '#d1d5db', marginBottom: 12 }} />
        <p style={{ color: '#9ca3af', margin: 0 }}>Chưa có Unit nào. Nhấn "+ Thêm Unit" để bắt đầu.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={units.map(u => u.id)} strategy={verticalListSortingStrategy}>
        <div className={styles.unitList}>
          {units.map((unit) => {
            const expanded = !!openUnits[unit.id];
            const ex = unit.items.filter(i => i.type === 'exercise').length;
            const ts = unit.items.filter(i => i.type === 'test').length;
            
            return (
              <SortableUnit
                key={unit.id}
                unit={unit}
                expanded={expanded}
                ex={ex}
                ts={ts}
                onToggle={toggle}
                onCreateAssignment={onCreateAssignment}
                onCreateTest={onCreateTest}
                onAssignUnit={onAssignUnit}
                onEditUnit={onEditUnit}
                onDeleteUnit={onDeleteUnit}
                onToggleStatus={onToggleStatus}
                onViewItem={onViewItem}
                onEditItem={onEditItem}
                onAssignItem={onAssignItem}
                onDeleteItem={onDeleteItem}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};

/* ══════════════════════════════════════
   AssignmentHistoryTab — Lịch sử giao bài
══════════════════════════════════════ */
const AssignmentHistoryTab = ({ classes, gradeLevel, historyVersion }) => {
  const toast = useToast();
  const { classes: allCtxClasses, students: allStudents, getStudentsByClass } = useUserManagement();
  const allClasses = allCtxClasses.length > 0 ? allCtxClasses : MOCK_CLASSES;
  const gradeClasses = gradeLevel
    ? allClasses.filter(c => Number(c.gradeLevel) === Number(gradeLevel))
    : allClasses;

  // Đọc submissions từ localStorage — HomeworkContext lưu theo từng học sinh:
  // key: hw_submissions_${studentId}  (mảng { assignmentId, studentId, score, ... })
  // Gom tất cả submissions của học sinh trong lớp thành 1 mảng phẳng.
  const getSubmissionsForClass = (classId) => {
    try {
      const classStudentList = getStudentsByClass
        ? getStudentsByClass(classId)
        : (allStudents ?? []).filter(s => s.classId === classId);
      const all = [];
      classStudentList.forEach(student => {
        try {
          const raw = localStorage.getItem(`hw_submissions_${student.id}`);
          if (raw) {
            const subs = JSON.parse(raw);
            // Đảm bảo mỗi record có studentId để lọc theo học viên
            subs.forEach(sub => all.push({ ...sub, studentId: sub.studentId ?? student.id }));
          }
        } catch { }
      });
      return all;
    } catch { return []; }
  };

  const getStudentCountForClass = (classId) => {
    if (getStudentsByClass) return getStudentsByClass(classId).length;
    return (allStudents ?? []).filter(s => s.classId === classId).length;
  };

  // Đọc tất cả lịch sử giao bài (trigger lại khi historyVersion thay đổi)
  const [historyData, setHistoryData] = useState(() => {
    const result = {};
    gradeClasses.forEach(cls => { result[cls.id] = readClassAssignments(cls.id); });
    return result;
  });

  React.useEffect(() => {
    const result = {};
    gradeClasses.forEach(cls => { result[cls.id] = readClassAssignments(cls.id); });
    setHistoryData(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyVersion]);

  // Gia hạn deadline cho 1 lớp × 1 bài
  const [extendCtx, setExtendCtx] = useState(null); // { classId, assignmentId, currentDeadline }
  const [newDeadline, setNewDeadline] = useState('');
  // Expand danh sách học viên per assignment — phải đặt TRƯỚC early return
  const [expandedRecord, setExpandedRecord] = useState(null); // `${classId}_${assignmentId}`

  const handleExtend = () => {
    if (!newDeadline) { toast?.error('Vui lòng chọn deadline mới'); return; }
    const { classId, assignmentId } = extendCtx;
    const current = readClassAssignments(classId);
    const updated = current.map(r =>
      r.assignmentId === assignmentId ? { ...r, deadline: newDeadline } : r
    );
    writeClassAssignments(classId, updated);
    setHistoryData(prev => ({ ...prev, [classId]: updated }));
    toast?.success('Đã gia hạn thành công');
    setExtendCtx(null);
  };

  const totalAssigned = gradeClasses.reduce((s, cls) => s + (historyData[cls.id]?.length ?? 0), 0);

  if (totalAssigned === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
        <History size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
        <p style={{ margin: 0, fontWeight: 500 }}>Chưa có bài nào được giao</p>
        <p style={{ margin: '6px 0 0', fontSize: 13 }}>Chuyển qua tab Nội dung và nhấn nút <strong>Giao</strong> trên Unit hoặc bài tập.</p>
      </div>
    );
  }

  return (
    <div>
      {gradeClasses.map(cls => {
        const records = historyData[cls.id] ?? [];
        if (records.length === 0) return null;
        const submissions = getSubmissionsForClass(cls.id);
        const totalStudents = getStudentCountForClass(cls.id);
        // Lấy danh sách học viên của lớp
        const classStudents = getStudentsByClass ? getStudentsByClass(cls.id) : (allStudents ?? []).filter(s => s.classId === cls.id);

        return (
          <div key={cls.id} style={{
            marginBottom: 20,
            border: '1px solid var(--color-border)',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            {/* Class header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: 'var(--color-surface-alt)',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <Users size={15} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{cls.name}</span>
              {totalStudents > 0 && (
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  ({totalStudents} học viên)
                </span>
              )}
              <span style={{
                marginLeft: 'auto', fontSize: 11.5, fontWeight: 600,
                background: '#fff', color: '#4f46e5',
                border: '1px solid #c7d2fe',
                padding: '3px 10px', borderRadius: 100,
              }}>{records.length} bài đã giao</span>
            </div>

            {/* Records table */}
            <div style={{ padding: '8px 0' }}>
              {records.map((r, i) => {
                const deadlineDate = r.deadline ? new Date(r.deadline) : null;
                const isOverdue = deadlineDate && deadlineDate < new Date();
                // Đếm số học sinh unique đã nộp (1 học sinh nộp nhiều lần chỉ đếm 1)
                const submittedStudentIds = new Set(
                  submissions
                    .filter(s => s.assignmentId === r.assignmentId)
                    .map(s => s.studentId)
                    .filter(Boolean)
                );
                const submitted = submittedStudentIds.size;
                const pending = Math.max(0, totalStudents - submitted);
                const expandKey = `${cls.id}_${r.assignmentId}`;
                const isExpanded = expandedRecord === expandKey;

                return (
                  <div key={r.assignmentId + i} style={{
                    borderBottom: i < records.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}>
                    {/* Assignment row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px',
                    }}>
                      <div style={{
                        flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                        background: '#fff', border: '1px solid #e2e8f0',
                        color: r.isUnit ? '#4338ca' : '#059669',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {r.isUnit ? <Send size={13} /> : <ClipboardList size={13} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.assignmentName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={11} />
                          Giao lúc: {r.assignedAt ? new Date(r.assignedAt).toLocaleString('vi-VN') : '—'}
                        </div>
                        {/* Submission counts + expand toggle */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                          <span style={{
                            fontSize: 11.5, fontWeight: 600,
                            background: '#fff', color: '#059669',
                            border: '1px solid #a7f3d0',
                            padding: '3px 10px', borderRadius: 100,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <CheckCircle size={10} /> Đã nộp: {submitted}
                          </span>
                          <span style={{
                            fontSize: 11.5, fontWeight: 600,
                            background: '#fff',
                            color: pending > 0 ? '#ea580c' : '#6b7280',
                            border: `1px solid ${pending > 0 ? '#fed7aa' : '#e5e7eb'}`,
                            padding: '3px 10px', borderRadius: 100,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <AlertCircle size={10} /> Chưa nộp: {pending}
                          </span>
                          {classStudents.length > 0 && (
                            <button
                              onClick={() => setExpandedRecord(isExpanded ? null : expandKey)}
                              style={{
                                fontSize: 11.5, fontWeight: 600,
                                padding: '3px 10px',
                                border: isExpanded ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                                borderRadius: 100,
                                background: '#fff',
                                color: isExpanded ? '#4f46e5' : '#475569',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                                transition: 'all 0.15s',
                              }}
                            >
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              {isExpanded ? 'Thu gọn' : 'Xem học viên'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block', fontSize: 12, fontWeight: 600,
                          color: isOverdue ? '#ef4444' : '#059669',
                          background: '#fff',
                          border: `1px solid ${isOverdue ? '#fecaca' : '#a7f3d0'}`,
                          padding: '3px 10px', borderRadius: 100, marginBottom: 4,
                        }}>
                          {isOverdue ? 'Quá hạn' : 'Còn hạn'}: {deadlineDate?.toLocaleDateString('vi-VN') ?? '—'}
                        </span>
                        <div>
                          <button
                            onClick={() => { setExtendCtx({ classId: cls.id, assignmentId: r.assignmentId, currentDeadline: r.deadline }); setNewDeadline(r.deadline ?? ''); }}
                            style={{
                              fontSize: 11.5, fontWeight: 600, padding: '3px 10px',
                              border: '1px solid var(--color-border)', borderRadius: 100,
                              background: '#fff', color: 'var(--color-text-secondary)',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            <Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />
                            Gia hạn
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable: danh sách học viên */}
                    {isExpanded && classStudents.length > 0 && (
                      <div style={{
                        margin: '0 16px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        overflow: 'hidden',
                        background: 'var(--color-surface-alt)',
                      }}>
                        <div style={{
                          padding: '8px 14px',
                          fontSize: 11.5, fontWeight: 700,
                          color: 'var(--color-text-secondary)',
                          background: 'var(--color-surface)',
                          borderBottom: '1px solid var(--color-border)',
                          display: 'flex', justifyContent: 'space-between',
                        }}>
                          <span>Danh sách học viên</span>
                          <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                            {classStudents.length} học viên
                          </span>
                        </div>
                        {classStudents.map((student, si) => {
                          // Tìm submission record của học viên này cho bài này
                          const submissionRecord = submissions.find(s =>
                            s.assignmentId === r.assignmentId && s.studentId === student.id
                          );
                          const hasSubmitted = !!submissionRecord;
                          const score = submissionRecord?.score ?? submissionRecord?.grade ?? null;
                          const scoreColor = score !== null
                            ? (score >= 8 ? '#16a34a' : score >= 6 ? '#d97706' : '#dc2626')
                            : null;
                          return (
                            <div key={student.id} style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 14px',
                              borderBottom: si < classStudents.length - 1 ? '1px solid var(--color-border)' : 'none',
                            }}>
                              <div style={{
                                flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                                background: hasSubmitted ? '#dcfce7' : '#f3f4f6',
                                color: hasSubmitted ? '#16a34a' : '#9ca3af',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700,
                              }}>
                                {student.name ? student.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                  {student.name}
                                </div>
                                <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>
                                  {student.username}
                                </div>
                              </div>
                              {/* Badge trạng thái + điểm */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                {hasSubmitted && score !== null && (
                                  <span style={{
                                    fontSize: 12, fontWeight: 700,
                                    color: scoreColor,
                                    background: '#fff',
                                    border: `1px solid ${score >= 8 ? '#86efac' : score >= 6 ? '#fcd34d' : '#fca5a5'}`,
                                    padding: '3px 10px', borderRadius: 100,
                                    letterSpacing: '0.02em',
                                  }}>
                                    {score}/10
                                  </span>
                                )}
                                <span style={{
                                  fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 100,
                                  background: '#fff',
                                  color: hasSubmitted ? '#059669' : '#ea580c',
                                  border: `1px solid ${hasSubmitted ? '#a7f3d0' : '#fed7aa'}`,
                                  display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                  {hasSubmitted
                                    ? <><CheckCircle size={10} /> Đã nộp</>
                                    : <><AlertCircle size={10} /> Chưa nộp</>
                                  }
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Extend Deadline Modal */}
      {extendCtx && (
        <Dialog.Root open={!!extendCtx} onOpenChange={(v) => { if (!v) setExtendCtx(null); }}>
          <Dialog.Portal>
            <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999 }} />
            <Dialog.Content style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              background: 'var(--color-surface)', borderRadius: 16,
              padding: 24, width: 'min(380px,90vw)', zIndex: 10000,
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
            }}>
              <Dialog.Title style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Gia hạn deadline
              </Dialog.Title>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Deadline hiện tại: <strong>{extendCtx.currentDeadline ? new Date(extendCtx.currentDeadline).toLocaleDateString('vi-VN') : '—'}</strong>
              </p>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
                Deadline mới <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={newDeadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setNewDeadline(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 14,
                  border: '1.5px solid var(--color-border)', borderRadius: 8,
                  background: 'var(--color-surface)', color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-base)', outline: 'none', marginBottom: 20,
                }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Dialog.Close asChild>
                  <button style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                    Hủy
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleExtend}
                  style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--gradient-primary)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Lưu gia hạn
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export const AdminCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    courses, chapters, assignments,
    isLoading,
    createChapter, updateChapter, deleteChapter,
    createAssignment, updateAssignment, deleteAssignment,
    getChaptersByCourse, getAssignmentsByCourse,
  } = useTeacher();
  const { students: allStudents, classes } = useUserManagement();

  // ── Modal/Drawer state ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [testDrawerOpen, setTestDrawerOpen] = useState(false);
  const [activeUnit, setActiveUnit] = useState(null);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [unitModalMode, setUnitModalMode] = useState('add');
  const [editingUnit, setEditingUnit] = useState(null);
  const [deleteUnitCtx, setDeleteUnitCtx] = useState(null); // { unitId, name }
  const [deleteCtx, setDeleteCtx] = useState(null);
  const [inviteCtx, setInviteCtx] = useState(null);
  const [viewItemCtx, setViewItemCtx] = useState(null); // { item }
  const [editItemCtx, setEditItemCtx] = useState(null); // { item }
  const [assignItemCtx, setAssignItemCtx] = useState(null); // { item }
  const [savingItem, setSavingItem] = useState(false);
  const [assignUnitCtx, setAssignUnitCtx] = useState(null); // { unit }
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'history'
  const [historyVersion, setHistoryVersion] = useState(0); // bump to refresh history
  const [expandedUnitId, setExpandedUnitId] = useState(null); // auto-expand unit after adding item
  const [localAssignments, setLocalAssignments] = useState(() => {
    try { const s = localStorage.getItem(`localAssignments_${courseId}`); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [localDeletedAssignments, setLocalDeletedAssignments] = useState(() => {
    try { const s = localStorage.getItem(`localDeletedAssignments_${courseId}`); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [localUnitEdits, setLocalUnitEdits] = useState(() => {
    const saved = localStorage.getItem(`localUnitEdits_${courseId}`);
    return saved ? JSON.parse(saved) : {};
  });
  // ── Local chapters (units) — sở cho course-lop route, không lệ thuộc Supabase ID ──
  const [localChapters, setLocalChapters] = useState(() => {
    try { const s = localStorage.getItem(`localChapters_${courseId}`); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  // ── CRITICAL: Reset local state khi courseId thay đổi (navigate giữa các khóa học) ──
  // useState lazy initializer chỉ chạy 1 lần lúc mount → cần useEffect để reload khi route đổi
  const prevCourseIdRef = React.useRef(courseId);
  React.useEffect(() => {
    if (prevCourseIdRef.current === courseId) return;
    prevCourseIdRef.current = courseId;
    isResettingRef.current = true; // Guard against overwriting during route change
    // Reload tất cả local state từ key mới
    try {
      const assignments = localStorage.getItem(`localAssignments_${courseId}`);
      setLocalAssignments(assignments ? JSON.parse(assignments) : []);
      const deleted = localStorage.getItem(`localDeletedAssignments_${courseId}`);
      setLocalDeletedAssignments(deleted ? JSON.parse(deleted) : []);
      const edits = localStorage.getItem(`localUnitEdits_${courseId}`);
      setLocalUnitEdits(edits ? JSON.parse(edits) : {});
      const chapters = localStorage.getItem(`localChapters_${courseId}`);
      setLocalChapters(chapters ? JSON.parse(chapters) : []);
    } catch { }
    // Reset UI state về trạng thái mặc định
    setActiveTab('content');
    setActiveUnit(null);
    setDrawerOpen(false);
    setTestDrawerOpen(false);
    setUnitModalOpen(false);
    setEditingUnit(null);
    setDeleteCtx(null);
    setDeleteUnitCtx(null);
    setViewItemCtx(null);
    setEditItemCtx(null);
    setAssignUnitCtx(null);
    setAssignItemCtx(null);
    setInviteCtx(null);
  }, [courseId]);

  // Guard: không ghi localStorage trong chu kỳ đầu sau khi reset
  const isResettingRef = React.useRef(false);

  React.useEffect(() => {
    if (isResettingRef.current) return;
    localStorage.setItem(`localAssignments_${courseId}`, JSON.stringify(localAssignments));
  }, [localAssignments, courseId]);

  React.useEffect(() => {
    if (isResettingRef.current) return;
    localStorage.setItem(`localDeletedAssignments_${courseId}`, JSON.stringify(localDeletedAssignments));
  }, [localDeletedAssignments, courseId]);

  React.useEffect(() => {
    if (isResettingRef.current) return;
    localStorage.setItem(`localUnitEdits_${courseId}`, JSON.stringify(localUnitEdits));
  }, [localUnitEdits, courseId]);

  React.useEffect(() => {
    if (isResettingRef.current) return;
    localStorage.setItem(`localChapters_${courseId}`, JSON.stringify(localChapters));
  }, [localChapters, courseId]);

  // Finally reset the ref AFTER all the save effects have had a chance to evaluate
  React.useEffect(() => {
    if (isResettingRef.current) {
      // Use setTimeout to ensure this runs after all synchronous render effects
      setTimeout(() => { isResettingRef.current = false; }, 0);
    }
  }, [courseId]);

  // ── Resolve course từ URL ────────────────────────────────────────────────
  // Pattern 1: /app/courses/course-lop{N} → Khóa lớp N (mới)
  // Pattern 2: /app/courses/class-{classId} → mỗi lớp có URL riêng (legacy)
  // Pattern 3: /app/courses/{courseId}       → URL cũ (legacy)
  const isCourseRoute = courseId?.startsWith('course-lop');
  const isClassRoute = courseId?.startsWith('class-');
  const classId = isClassRoute ? courseId.replace('class-', '') : null;
  const gradeLevel = isCourseRoute ? parseInt(courseId.replace('course-lop', '')) : null;

  // Tìm class cụ thể (chỉ dùng cho legacy class route)
  const linkedClass = classId
    ? classes?.find(c => c.id === classId)
    : null;

  // courseId thực để tra chapters/assignments từ Supabase
  const realCourseId = courseId;

  // Resolve tên khóa học
  let course = courses.find(c => c.id === realCourseId);
  if (!course && isCourseRoute && gradeLevel) {
    // Mô hình mới: khóa học theo khối lớp
    course = {
      id: realCourseId,
      name: `Tiếng Anh lớp ${gradeLevel}`,
      gradeLevel,
      gradeLabel: `Lớp ${gradeLevel}`,
    };
  } else if (!course && linkedClass) {
    // Legacy: class-specific URL
    course = {
      id: realCourseId,
      name: `Tiếng Anh ${linkedClass.name}`,
      gradeLevel: linkedClass.gradeLevel,
      gradeLabel: `Lớp ${linkedClass.gradeLevel}`,
      classCode: linkedClass.code,
    };
  }

  // ── Derive units ────────────────────────────────────────────────────────
  // Dùng localChapters khi là course-lop route (local-only)
  // Dùng rawChapters khi là legacy class-{id} route (Supabase)
  const rawChapters = useMemo(() => getChaptersByCourse(realCourseId), [chapters, realCourseId]);
  const rawAssignments = useMemo(() => getAssignmentsByCourse(realCourseId), [assignments, realCourseId]);

  const effectiveChapters = isCourseRoute ? localChapters : rawChapters;

  const units = useMemo(() =>
    effectiveChapters
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((ch, idx) => {
        const edits = localUnitEdits[ch.id] ?? {};

        // Items: local-only for course-lop route (tránh duplicate với Supabase)
        const localItems = localAssignments
          .filter(a => a.chapterId === ch.id && !localDeletedAssignments.includes(a.id))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map(a => ({
            id: a.id,
            name: a.title,
            type: a.isTest ? 'test' : 'exercise',
            status: a.status ?? 'published',
            updatedAt: new Date(a.createdAt).toLocaleDateString('vi-VN'),
            _raw: a,
          }));

        // Kết hợp server items chỉ khi là legacy route
        const serverItems = isCourseRoute ? [] : rawAssignments
          .filter(a => a.chapterId === ch.id && !localDeletedAssignments.includes(a.id))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map(a => ({
            id: a.id,
            name: a.title,
            type: a.isTest ? 'test' : 'exercise',
            status: a.status ?? 'published',
            updatedAt: a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '—',
            _raw: a,
          }));

        // Loại trừ duplicate: nếu ID đã có trong localItems thì bỏ serverItems trùng
        const localIds = new Set(localItems.map(i => i.id));
        const dedupedServer = serverItems.filter(i => !localIds.has(i.id));

        return {
          id: ch.id,
          order: idx + 1,
          name: edits.name ?? ch.name,
          desc: edits.desc ?? ch.desc ?? '',
          items: [...dedupedServer, ...localItems],
        };
      }),
    [effectiveChapters, rawAssignments, localAssignments, localDeletedAssignments, localUnitEdits, isCourseRoute]
  );

  // ── Stats ──
  const totalExercises = useMemo(() => {
    const localEx = localAssignments.filter(a => !a.isTest && !localDeletedAssignments.includes(a.id)).length;
    const serverEx = isCourseRoute ? 0 : rawAssignments.filter(a => !a.isTest).length;
    return localEx + serverEx;
  }, [localAssignments, localDeletedAssignments, rawAssignments, isCourseRoute]);

  const totalTests = useMemo(() => {
    const localTs = localAssignments.filter(a => a.isTest && !localDeletedAssignments.includes(a.id)).length;
    const serverTs = isCourseRoute ? 0 : rawAssignments.filter(a => a.isTest).length;
    return localTs + serverTs;
  }, [localAssignments, localDeletedAssignments, rawAssignments, isCourseRoute]);

  // ── Handlers: Unit CRUD ──
  const handleAddUnit = () => { setUnitModalMode('add'); setEditingUnit(null); setUnitModalOpen(true); };
  const handleEditUnit = (unit) => { setUnitModalMode('edit'); setEditingUnit(unit); setUnitModalOpen(true); };

  const handleSaveUnit = async ({ name, desc }) => {
    // Validation: Không được trùng tên Unit
    const isDuplicate = units.some(u =>
      u.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      u.id !== editingUnit?.id
    );
    if (isDuplicate) {
      toast?.error('Tên Unit đã tồn tại trong khóa học này!');
      return;
    }

    if (unitModalMode === 'add') {
      if (isCourseRoute) {
        // Local-only cho course-lop route (tránh phụ thuộc Supabase ID)
        const newChapter = {
          id: `ch-${Date.now()}`,
          courseId: realCourseId,
          name: name.trim(),
          desc: desc?.trim() ?? '',
          order: localChapters.length + 1,
          createdAt: new Date().toISOString(),
        };
        setLocalChapters(prev => [...prev, newChapter]);
        toast?.success(`Đã thêm Unit "${name}"`);
        setUnitModalOpen(false);
      } else {
        // Legacy class-{id} route: vẫn gọi API
        try {
          await createChapter({ id: `ch-${Date.now()}`, courseId: realCourseId, courseName: course?.name, name, order: rawChapters.length + 1 });
          toast?.success(`Đã thêm Unit "${name}"`);
          setUnitModalOpen(false);
        } catch (err) {
          toast?.error(`Lỗi: ${err.message}`);
        }
      }
    } else {
      // Chỉnh sửa: local state only
      setLocalUnitEdits(prev => ({ ...prev, [editingUnit.id]: { name: name.trim(), desc: (desc ?? '').trim() } }));
      toast?.success('Cập nhật thành công');
      setUnitModalOpen(false);
    }
  };

  const handleDeleteUnit = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setDeleteUnitCtx({ unitId: unit.id, name: unit.name });
    }
  };

  const confirmDeleteUnit = async () => {
    if (!deleteUnitCtx) return;
    if (isCourseRoute) {
      // Local-only: xóa khỏi localChapters + xóa assignments thuộc unit
      const { unitId } = deleteUnitCtx;
      setLocalChapters(prev => prev.filter(c => c.id !== unitId));
      setLocalAssignments(prev => prev.filter(a => a.chapterId !== unitId));
      toast?.success(`Đã xóa "${deleteUnitCtx.name}"`);
      setDeleteUnitCtx(null);
    } else {
      try {
        await deleteChapter(deleteUnitCtx.unitId);
        toast?.success(`Đã xóa "${deleteUnitCtx.name}"`);
      } catch (err) {
        toast?.error(`Lỗi khi xóa: ${err.message}`);
      } finally {
        setDeleteUnitCtx(null);
      }
    }
  };

  const handleReorderUnits = async (newUnits) => {
    // newUnits is the reordered array of unit objects
    if (isCourseRoute) {
      // Local mode
      setLocalChapters(prev => {
        const next = [...prev];
        // Sort according to newUnits
        next.sort((a, b) => {
          const idxA = newUnits.findIndex(u => u.id === a.id);
          const idxB = newUnits.findIndex(u => u.id === b.id);
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
        // Update order_index locally
        return next.map((ch, idx) => ({ ...ch, order_index: idx + 1 }));
      });
      toast?.success('Đã cập nhật thứ tự Unit');
    } else {
      // Supabase mode
      try {
        await Promise.all(newUnits.map((u, idx) => 
          updateChapter(u.id, { order: idx + 1 })
        ));
        toast?.success('Đã cập nhật thứ tự Unit');
      } catch (err) {
        toast?.error(`Lỗi cập nhật thứ tự: ${err.message}`);
      }
    }
  };

  // ── Handlers: Drawer open ──
  const handleCreateAssignment = (unit) => { setActiveUnit(unit); setDrawerOpen(true); };
  const handleCreateTest = (unit) => { setActiveUnit(unit); setTestDrawerOpen(true); };




  // ── Handler: Save Assignment (from drawer) ──
  const handleSaveAssignment = useCallback((payload) => {
    const { title, status, questions } = payload;
    if (!title?.trim()) { toast?.error('Vui lòng nhập tên bài tập'); return; }

    // Validation: Không được trùng tên trong cùng một lớp
    const allNames = units.flatMap(u => u.items.map(i => i.name.toLowerCase()));
    if (allNames.includes(title.trim().toLowerCase())) {
      toast?.error('Tên bài tập/kiểm tra đã tồn tại trong lớp này!');
      return;
    }

    const newItem = {
      id: `hw-${Date.now()}`,
      courseId: realCourseId,
      chapterId: activeUnit?.id ?? null,
      isTest: false,
      title: title.trim(),
      status: status ?? 'published',
      createdAt: new Date().toISOString(),
      questions: questions ?? [],
    };
    setLocalAssignments(prev => [...prev, newItem]);
    setExpandedUnitId(activeUnit?.id ?? null); // auto-expand unit
    toast?.success('Tạo bài tập thành công');
    setDrawerOpen(false);
  }, [activeUnit, realCourseId, toast, units]);

  // ── Handler: Save Test (from drawer) ──
  const handleSaveTest = useCallback((payload) => {
    const { title, status, questions, settings } = payload;
    if (!title?.trim()) { toast?.error('Vui lòng nhập tên bài kiểm tra'); return; }

    // Validation
    const allNames = units.flatMap(u => u.items.map(i => i.name.toLowerCase()));
    if (allNames.includes(title.trim().toLowerCase())) {
      toast?.error('Tên bài tập/kiểm tra đã tồn tại trong lớp này!');
      return;
    }

    const newItem = {
      id: `test-${Date.now()}`,
      courseId: realCourseId,
      chapterId: activeUnit?.id ?? null,
      isTest: true,
      title: title.trim(),
      status: status ?? 'published',
      timeLimitMin: settings?.timeLimitMin ?? 45,
      maxAttempts: settings?.attempts ?? 1,
      showAnswer: settings?.showAnswer ?? 'Có',
      shuffle: settings?.shuffle === 'Bật',
      createdAt: new Date().toISOString(),
      questions: questions ?? [],
    };
    setLocalAssignments(prev => [...prev, newItem]);
    setExpandedUnitId(activeUnit?.id ?? null); // auto-expand unit
    toast?.success('Tạo bài kiểm tra thành công');
    setTestDrawerOpen(false);
  }, [activeUnit, realCourseId, toast, units]);

  // ── Handler: Toggle status (draft ↔ published) ──
  const handleToggleStatus = useCallback(async (item) => {
    const next = item.status === 'published' ? 'draft' : 'published';
    try {
      await updateAssignment(item.id, { status: next });
      toast?.success(
        next === 'published' ? `Đã công bố "${item.name}"` : `Đã chuyển về bản nháp "${item.name}"`
      );
    } catch (err) {
      toast?.error(`Lỗi: ${err.message}`);
    }
  }, [updateAssignment, toast]);

  // ── Handler: Delete item ──
  const handleDeleteItem = (item) => setDeleteCtx({ item });

  const confirmDeleteItem = () => {
    if (!deleteCtx) return;
    const item = deleteCtx.item;
    if (localAssignments.some(a => a.id === item.id)) {
      setLocalAssignments(prev => prev.filter(a => a.id !== item.id));
    } else {
      setLocalDeletedAssignments(prev => [...prev, item.id]);
    }
    toast?.success('Xóa bài tập thành công');
    setDeleteCtx(null);
  };

  const handleAssignItem = (item) => setAssignItemCtx({ item });
  const handleAssignUnit = (unit) => setAssignUnitCtx({ unit });
  const handleViewItem = (item) => setViewItemCtx({ item });
  const handleEditItem = (item) => setEditItemCtx({ item });

  const handleSaveEditItem = (updatedItemData) => {
    setLocalAssignments(prev => prev.map(a =>
      a.id === updatedItemData.id ? { ...a, ...updatedItemData } : a
    ));
    toast?.success('Cập nhật bài tập thành công');
    setEditItemCtx(null);
  };

  // ── Course not found ──
  if (!isLoading && !course) {
    return (
      <div className={styles.pageNew}>
        <div className={styles.page}>
          <p>Không tìm thấy khóa học.</p>
          <Button variant="outline" onClick={() => navigate('/app/courses')}>← Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div key={courseId} className={`${styles.pageNew} ${styles.pageTransition}`}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.pageTitle}>
            {course?.name ?? '…'}
          </h1>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 13 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải...
            </div>
          ) : (
            <div className={styles.courseMetaBadges}>
              <span className={styles.metaBadge}><BookOpen size={13} /> {units.length} Unit</span>
              <span className={styles.metaBadge}><ClipboardList size={13} /> {totalExercises} bài tập</span>
              <span className={styles.metaBadge}><CheckCircle size={13} /> {totalTests} kiểm tra</span>
              <span className={styles.metaBadge} style={{ color: '#10b981', borderColor: '#a7f3d0', background: '#fff' }}>
                <CheckCircle size={13} /> Đang hoạt động
              </span>
            </div>
          )}
        </div>
        <div className={styles.pageHeaderRight}>
          <button className={styles.btnAddGradient} onClick={handleAddUnit}>
            <Plus size={14} strokeWidth={2.5} /> Thêm Unit
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{
        display: 'flex', gap: 4,
        padding: '0 0 0 0',
        borderBottom: '2px solid var(--color-border)',
        marginBottom: 24,
      }}>
        {[
          { key: 'content', label: 'Nội dung', icon: BookOpen },
          { key: 'history', label: 'Lịch sử giao bài', icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px',
              fontSize: 13.5, fontWeight: activeTab === key ? 700 : 500,
              color: activeTab === key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              background: 'none', border: 'none',
              borderBottom: activeTab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderRadius: 0,
            }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Nội dung (Units) ── */}
      {activeTab === 'content' && (
        <div className={styles.tabContent}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <>
              <UnitAccordion
                units={units}
                onCreateAssignment={handleCreateAssignment}
                onCreateTest={handleCreateTest}
                onEditUnit={handleEditUnit}
                onDeleteUnit={handleDeleteUnit}
                onToggleStatus={handleToggleStatus}
                onDeleteItem={handleDeleteItem}
                onAssignItem={handleAssignItem}
                onAssignUnit={handleAssignUnit}
                onViewItem={handleViewItem}
                onEditItem={handleEditItem}
                expandedUnitId={expandedUnitId}
                onReorderUnits={handleReorderUnits}
              />
              <button className={styles.addUnitBtnMain} onClick={handleAddUnit}>
                <Plus size={16} /> Thêm Unit mới
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Lịch sử giao bài ── */}
      {activeTab === 'history' && (
        <AssignmentHistoryTab
          classes={classes}
          gradeLevel={gradeLevel}
          historyVersion={historyVersion}
        />
      )}

      {/* ── Drawers & Modals ── */}
      <CreateAssignmentDrawer
        open={drawerOpen}
        unitName={activeUnit?.name}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveAssignment}
      />

      <CreateTestDrawer
        open={testDrawerOpen}
        unitName={activeUnit?.name}
        onClose={() => setTestDrawerOpen(false)}
        onSave={handleSaveTest}
      />

      <UnitModal
        open={unitModalOpen}
        mode={unitModalMode}
        unit={editingUnit}
        onSave={handleSaveUnit}
        onClose={() => setUnitModalOpen(false)}
      />

      <DeleteItemModal
        open={!!deleteCtx}
        item={deleteCtx?.item}
        onConfirm={confirmDeleteItem}
        onClose={() => setDeleteCtx(null)}
      />

      {inviteCtx && (
        <InviteClassModal
          open={!!inviteCtx}
          mode={inviteCtx.mode}
          courseId={courseId}
          hwId={inviteCtx.hwId}
          unit={inviteCtx.unit}
          chapter={inviteCtx.chapter}
          assignmentsInChapter={inviteCtx.assignmentsInChapter}
          onClose={() => setInviteCtx(null)}
        />
      )}

      {assignUnitCtx && (
        <AssignUnitModal
          open={!!assignUnitCtx}
          unit={assignUnitCtx.unit}
          courseGradeLevel={gradeLevel}
          onClose={(refreshed) => { setAssignUnitCtx(null); if (refreshed) setHistoryVersion(v => v + 1); }}
        />
      )}

      {assignItemCtx && (
        <AssignUnitModal
          open={!!assignItemCtx}
          item={assignItemCtx.item}
          courseGradeLevel={gradeLevel}
          onClose={(refreshed) => { setAssignItemCtx(null); if (refreshed) setHistoryVersion(v => v + 1); }}
        />
      )}

      {viewItemCtx && (
        <ViewItemModal
          open={!!viewItemCtx}
          item={viewItemCtx.item}
          onClose={() => setViewItemCtx(null)}
        />
      )}

      {editItemCtx && (
        <EditItemModal
          open={!!editItemCtx}
          item={editItemCtx.item}
          onClose={() => setEditItemCtx(null)}
          onSave={handleSaveEditItem}
        />
      )}

      {/* ── Delete Unit Modal ── */}
      <Dialog.Root open={!!deleteUnitCtx} onOpenChange={(val) => !val && setDeleteUnitCtx(null)}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, backdropFilter: 'blur(2px)' }} />
          <Dialog.Content style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: 24, borderRadius: 16, width: 400, zIndex: 10000, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#fef2f2', padding: 10, borderRadius: '50%', color: '#ef4444' }}>
                <Trash2 size={24} />
              </div>
              <Dialog.Title style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
                Xác nhận xóa Unit
              </Dialog.Title>
            </div>
            <div style={{ fontSize: 15, color: '#475569', marginBottom: 24, lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa Unit <strong>"{deleteUnitCtx?.name}"</strong> và tất cả nội dung bên trong? Hành động này không thể hoàn tác.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="outline" onClick={() => setDeleteUnitCtx(null)}>Hủy</Button>
              <Button onClick={confirmDeleteUnit} style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>
                Xóa Unit
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

/* ══════════════════════
   ViewItemModal — Xem chi tiết bài tập/kiểm tra
══════════════════════ */
const getNormalizedOptions = (q) => {
  if (Array.isArray(q.options) && q.options.length > 0) {
    return q.options.map((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      if (typeof opt === 'string') {
        const text = opt.replace(/^[A-E]\.\s*/, '');
        const isCorrect = (q.detectedAnswer === letter) || (q.answer === letter) || (Array.isArray(q.detectedAnswer) && q.detectedAnswer.includes(letter)) || (Array.isArray(q.answers) && q.answers.includes(letter));
        return { text, isCorrect, original: opt };
      }
      return { ...opt, text: opt.text || '', isCorrect: !!opt.isCorrect };
    });
  }
  if (q.type === 'multiple_choice' || q.type === 'multiple_response') {
    const arr = [];
    if (q.optA !== undefined) arr.push({ text: q.optA, isCorrect: q.answer === 'A' || q.detectedAnswer === 'A' || q.answers?.includes('A') });
    if (q.optB !== undefined) arr.push({ text: q.optB, isCorrect: q.answer === 'B' || q.detectedAnswer === 'B' || q.answers?.includes('B') });
    if (q.optC !== undefined) arr.push({ text: q.optC, isCorrect: q.answer === 'C' || q.detectedAnswer === 'C' || q.answers?.includes('C') });
    if (q.optD !== undefined) arr.push({ text: q.optD, isCorrect: q.answer === 'D' || q.detectedAnswer === 'D' || q.answers?.includes('D') });
    if (arr.length > 0) return arr;
  }
  if (q.type === 'true_false') {
    return [
      { text: 'Đúng', isCorrect: q.answer === 'Đúng' || q.answer === 'A' },
      { text: 'Sai', isCorrect: q.answer === 'Sai' || q.answer === 'B' }
    ];
  }
  return [];
};

const ViewItemModal = ({ open, item, onClose }) => {
  if (!item) return null;
  const raw = item._raw || {};
  const questions = raw.questions || [];
  const isTest = raw.isTest ?? item.type === 'test';

  const renderQuestion = (q, i) => {
    if (!q) return null;

    // ── Listening type: render riêng ──
    if (q.type === 'listening') {
      const subs = q.subQuestions ?? [];
      const gdriveId = q.audioUrl
        ? q.audioUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1]
        : null;
      return (
        <div key={q.id || i} style={{
          marginBottom: 16, borderRadius: 14, overflow: 'hidden',
          border: '1.5px solid #c7d2fe', background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
        }}>
          {/* Listening header */}
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #ddd6fe' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 12 }}>🎧</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase' }}>
              Câu {i + 1} — Bài Nghe ({subs.length} câu hỏi)
            </span>
          </div>

          {/* Audio player */}
          {q.audioUrl ? (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #ddd6fe' }}>
              {gdriveId ? (
                <div style={{ borderRadius: 8, overflow: 'hidden', background: 'white', border: '1px solid #e0e7ff' }}>
                  <iframe src={`https://drive.google.com/file/d/${gdriveId}/preview`}
                    width="100%" height="52" style={{ border: 'none', display: 'block' }} allow="autoplay" />
                </div>
              ) : (
                <audio controls src={q.audioUrl} style={{ width: '100%', height: 36, display: 'block', accentColor: '#6366f1' }} />
              )}
            </div>
          ) : (
            <div style={{ padding: '8px 16px', background: '#fff7ed', borderBottom: '1px solid #ddd6fe', fontSize: 12, color: '#92400e' }}>
              ⚠️ Chưa có file audio — có thể upload sau khi lưu bài tập
            </div>
          )}

          {/* Sub-questions */}
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subs.length === 0 ? (
              (q.content || q.text || q.answer) ? (
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.5, color: '#1e293b', fontWeight: 500 }}>
                    {q.content || q.text || '(Chưa có nội dung)'}
                  </p>
                  {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                      {q.options.map((opt, oi) => {
                        const letter = ['A', 'B', 'C', 'D'][oi];
                        const isCorrect = (q.answer === letter || q.answer === opt || q.answer === opt.charAt(0));
                        return (
                          <div key={opt} style={{
                            padding: '4px 10px', borderRadius: 7, fontSize: 12,
                            background: isCorrect ? '#dcfce7' : '#f8fafc',
                            border: `1px solid ${isCorrect ? '#86efac' : '#e2e8f0'}`,
                            color: isCorrect ? '#166534' : '#475569',
                            fontWeight: isCorrect ? 700 : 400,
                            display: 'flex', gap: 6, alignItems: 'center',
                          }}>
                            {isCorrect && <span>✓</span>}
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {(!q.options || q.options.length === 0) && q.answer && (
                    <div style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, background: '#dcfce7', border: '1px solid #86efac', color: '#166534' }}>
                      ✓ Đáp án: {Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Chưa có câu hỏi con</div>
              )
            ) : null}
            {subs.map((sq, si) => {
              const sqOpts = [];
              if (sq.type === 'multiple_choice' && sq.options && typeof sq.options === 'object') {
                ['A','B','C','D'].forEach(l => {
                  if (sq.options[l]) sqOpts.push({ letter: l, text: sq.options[l], isCorrect: sq.answer === l });
                });
              }
              const hasAns = !!sq.answer;
              return (
                <div key={sq.id || si} style={{
                  background: 'white', borderRadius: 10, padding: '10px 12px',
                  border: `1px solid ${hasAns ? '#c7d2fe' : '#fca5a5'}`,
                }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    {hasAns ? <span style={{ color: '#10b981', fontSize: 12 }}>✓</span> : <span style={{ color: '#ef4444', fontSize: 12 }}>!</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>Câu {si + 1}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{sq.type}</span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.5, color: '#1e293b', fontWeight: 500 }}>
                    {sq.content || '(Chưa có nội dung)'}
                  </p>
                  {sqOpts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {sqOpts.map(opt => (
                        <div key={opt.letter} style={{
                          padding: '4px 10px', borderRadius: 7, fontSize: 12,
                          background: opt.isCorrect ? '#dcfce7' : '#f8fafc',
                          border: `1px solid ${opt.isCorrect ? '#86efac' : '#e2e8f0'}`,
                          color: opt.isCorrect ? '#166534' : '#475569',
                          fontWeight: opt.isCorrect ? 700 : 400,
                          display: 'flex', gap: 6, alignItems: 'center',
                        }}>
                          {opt.isCorrect && <span>✓</span>}
                          <span style={{ minWidth: 16, fontWeight: 700 }}>{opt.letter}.</span>
                          {opt.text}
                        </div>
                      ))}
                    </div>
                  )}
                  {sqOpts.length === 0 && sq.answer && (
                    <div style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, background: '#dcfce7', border: '1px solid #86efac', color: '#166534' }}>
                      ✓ Đáp án: {sq.answer}
                    </div>
                  )}
                  {!hasAns && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>⚠ Chưa có đáp án</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Normalize options từ cả 2 format: { optA, optB, ... } và { options: [...] }
    let opts = [];
    if (Array.isArray(q.options) && q.options.length > 0) {
      opts = q.options.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const text = typeof opt === 'string' ? opt.replace(/^[A-E]\.\s*/, '') : (opt.text || '');
        const isCorrect =
          q.detectedAnswer === letter || q.answer === letter ||
          (Array.isArray(q.detectedAnswer) && q.detectedAnswer.includes(letter)) ||
          (Array.isArray(q.answers) && q.answers.includes(letter));
        return { letter, text, isCorrect };
      });
    } else {
      // ManualMode format: optA, optB, optC, optD
      ['A', 'B', 'C', 'D'].forEach(l => {
        const text = q[`opt${l}`];
        if (text) {
          const isCorrect =
            q.answer === l ||
            (Array.isArray(q.answers) && q.answers.includes(l));
          opts.push({ letter: l, text, isCorrect });
        }
      });
    }

    // Đáp án hiển thị
    let displayAnswer = '';
    if (q.type === 'fill_in' || q.type === 'fill_blank' || q.type === 'short_answer') {
      displayAnswer = q.answer || q.detectedAnswer || '';
    } else if (q.type === 'true_false') {
      displayAnswer = q.answer || q.detectedAnswer || '';
    } else if (q.type === 'ordering') {
      displayAnswer = (q.orderItems || []).join(' → ');
    } else if (q.type === 'matching') {
      displayAnswer = (q.pairs || []).map(p => `${p.left} → ${p.right}`).join(', ');
    } else if (Array.isArray(q.answers)) {
      displayAnswer = q.answers.join(', ');
    } else {
      const correctOpt = opts.find(o => o.isCorrect);
      displayAnswer = q.answer || q.detectedAnswer || (correctOpt ? correctOpt.letter : '');
      if (Array.isArray(displayAnswer)) displayAnswer = displayAnswer.join(', ');
    }

    const hasAnswer = !!displayAnswer || opts.some(o => o.isCorrect);

    return (
      <div key={q.id || i} style={{
        marginBottom: 16,
        background: 'var(--color-surface-alt)',
        borderRadius: 12,
        padding: '14px 16px',
        border: `1px solid ${hasAnswer ? 'var(--color-border)' : '#fca5a5'}`,
      }}>
        {/* Question header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {hasAnswer
            ? <CheckCircle size={14} color="#10b981" />
            : <AlertCircle size={14} color="#ef4444" />}
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            Câu {i + 1}
          </span>
        </div>

        {/* Question content */}
        <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.5, color: 'var(--color-text-primary)', fontWeight: 500 }}
          dangerouslySetInnerHTML={{ __html: q.content || q.text || '(Chưa có nội dung)' }}
        />

        {/* Options */}
        {opts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {opts.map(opt => (
              <div key={opt.letter} style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 13,
                background: opt.isCorrect ? '#dcfce7' : 'var(--color-surface)',
                border: `1px solid ${opt.isCorrect ? '#86efac' : 'var(--color-border)'}`,
                color: opt.isCorrect ? '#166534' : 'var(--color-text-secondary)',
                fontWeight: opt.isCorrect ? 700 : 400,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {opt.isCorrect && <CheckCircle size={12} color="#16a34a" />}
                <span style={{ color: 'var(--color-text-tertiary)', minWidth: 18, fontWeight: 600 }}>{opt.letter}.</span>
                {opt.text}
              </div>
            ))}
          </div>
        )}

        {/* Answer display for non-option types */}
        {opts.length === 0 && displayAnswer && (
          <div style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 13,
            background: '#dcfce7', border: '1px solid #86efac', color: '#166534',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <CheckCircle size={12} /> Đáp án: {displayAnswer}
          </div>
        )}
        {!hasAnswer && (
          <div style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <AlertCircle size={11} /> Chưa có đáp án
          </div>
        )}

        {/* Explanation */}
        {q.explanation && (
          <div style={{
            marginTop: 8, padding: '6px 10px', borderRadius: 8, fontSize: 12,
            background: '#fefce8', border: '1px solid #fde68a', color: '#92400e',
          }}>
            💡 {q.explanation}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          background: 'rgba(0,0,0,0.45)',
          position: 'fixed', inset: 0, zIndex: 9999,
          animation: 'fadeIn 150ms ease',
        }} />
        <Dialog.Content style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 10000,
          width: 'min(720px, 95vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface)',
          borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          outline: 'none',
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
            background: isTest ? 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)' : 'var(--color-surface)',
          }}>
            <div>
              <Dialog.Title style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {item.name}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {/* Meta grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isTest ? '1fr 1fr 1fr 1fr' : '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ background: 'var(--color-surface-alt)', padding: '10px 14px', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 3 }}>Số câu hỏi</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{questions.length} câu</div>
              </div>
              <div style={{ background: 'var(--color-surface-alt)', padding: '10px 14px', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 3 }}>Ngày tạo</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {raw.createdAt ? new Date(raw.createdAt).toLocaleDateString('vi-VN') : '—'}
                </div>
              </div>
              {isTest && (
                <>
                  <div style={{ background: '#ede9fe', padding: '10px 14px', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: '#7c3aed', marginBottom: 3 }}>⏱ Thời gian</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#5b21b6' }}>
                      {raw.timeLimitMin || 45} phút
                    </div>
                  </div>
                  <div style={{ background: '#ede9fe', padding: '10px 14px', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: '#7c3aed', marginBottom: 3 }}>🔄 Số lần làm</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#5b21b6' }}>
                      {raw.maxAttempts || 1} lần
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Questions list */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Danh sách câu hỏi
              </h4>
              {questions.length > 0 ? (
                questions.map((q, i) => renderQuestion(q, i))
              ) : (
                <div style={{
                  textAlign: 'center', padding: '40px 0',
                  color: 'var(--color-text-tertiary)', fontSize: 14, fontStyle: 'italic',
                }}>
                  <AlertCircle size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                  Chưa có câu hỏi nào trong bài này.
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/* ══════════════════════
   EditItemModal — Sửa bài tập
══════════════════════ */
const EditItemModal = ({ open, item, onClose, onSave }) => {
  if (!item) return null;
  const raw = item._raw || {};

  const [title, setTitle] = useState(item.name || '');
  const [dueDate, setDueDate] = useState(raw.dueDate || '');
  const [description, setDescription] = useState(raw.description || '');
  const [questions, setQuestions] = useState(raw.questions || []);

  const handleQChange = (id, field, value) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleSave = () => {
    onSave({
      id: item.id,
      title: title.trim(),
      dueDate,
      description: description.trim(),
      questions,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          background: 'rgba(0,0,0,0.45)',
          position: 'fixed', inset: 0, zIndex: 999,
          animation: 'fadeIn 150ms ease',
        }} />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 1000,
            width: 'min(700px, 94vw)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-surface)',
            borderRadius: 20,
            boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            outline: 'none',
            animation: 'slideUp 180ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Dialog.Title style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Chỉnh sửa {item.type === 'test' ? 'bài kiểm tra' : 'bài tập'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Tên bài tập <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14 }}
                value={title} onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Hạn nộp</label>
              <input
                type="date"
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14 }}
                value={dueDate} onChange={e => setDueDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Mô tả</label>
              <textarea
                rows={3}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, resize: 'vertical' }}
                value={description} onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: 15, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
                Danh sách câu hỏi
              </h4>
              {Array.isArray(questions) && questions.length > 0 ? (
                <div className={drawerStyles.previewQuestions}>
                  {questions.map((q, i) => {
                    if (!q) return null;

                    // ── Listening: render subQuestions riêng ──
                    if (q.type === 'listening') {
                      const subs = q.subQuestions ?? [];
                      const handleSubChange = (si, field, value) => {
                        const newSubs = [...subs];
                        newSubs[si] = { ...newSubs[si], [field]: value };
                        setQuestions(prev => prev.map(qq => qq.id === q.id
                          ? { ...qq, subQuestions: newSubs }
                          : qq));
                      };
                      const gdriveId = q.audioUrl?.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                      return (
                        <div key={q.id || i} style={{
                          marginBottom: 4, borderRadius: 14, overflow: 'hidden',
                          border: '1.5px solid #c7d2fe',
                          background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
                        }}>
                          {/* Header */}
                          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #ddd6fe' }}>
                            <span style={{ fontSize: 18 }}>🎧</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#4338ca' }}>
                              Câu {i + 1} — Bài Nghe ({subs.length} câu hỏi)
                            </span>
                          </div>

                          {/* Audio link display */}
                          <div style={{ padding: '8px 14px', borderBottom: '1px solid #ddd6fe' }}>
                            {q.audioUrl ? (
                              gdriveId ? (
                                <div style={{ borderRadius: 8, overflow: 'hidden', background: 'white', border: '1px solid #e0e7ff' }}>
                                  <iframe src={`https://drive.google.com/file/d/${gdriveId}/preview`}
                                    width="100%" height="48" style={{ border: 'none', display: 'block' }} allow="autoplay" />
                                </div>
                              ) : (
                                <audio controls src={q.audioUrl} style={{ width: '100%', height: 34, display: 'block', accentColor: '#6366f1' }} />
                              )
                            ) : (
                              <div style={{ fontSize: 12, color: '#92400e', background: '#fff7ed', padding: '6px 10px', borderRadius: 8 }}>
                                ⚠️ Chưa có file audio
                              </div>
                            )}
                          </div>

                          {/* Sub-questions / Single Question content */}
                          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {subs.length === 0 && (q.content || q.text || q.answer) && (
                              <div style={{
                                background: 'white', borderRadius: 10, padding: '10px 12px',
                                border: '1px solid #e0e7ff',
                              }}>
                                <textarea
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 50, boxSizing: 'border-box' }}
                                  value={q.content || q.text || ''}
                                  onChange={e => {
                                    setQuestions(prev => prev.map(qq => qq.id === q.id ? { ...qq, content: e.target.value } : qq));
                                  }}
                                  placeholder="Nội dung câu hỏi..."
                                />
                                {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '6px 0' }}>
                                    {q.options.map((opt, oi) => {
                                      const letter = ['A','B','C','D'][oi];
                                      return (
                                        <div key={opt} style={{
                                          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                                          borderRadius: 7, border: '1px solid #e2e8f0',
                                          background: (q.answer === letter || q.answer === opt) ? '#dcfce7' : '#f8fafc',
                                        }}>
                                          <span style={{ fontWeight: 700, fontSize: 12, minWidth: 18 }}>{letter}.</span>
                                          <input
                                            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13 }}
                                            value={opt}
                                            onChange={e => {
                                              const newOpts = [...q.options];
                                              newOpts[oi] = e.target.value;
                                              setQuestions(prev => prev.map(qq => qq.id === q.id ? { ...qq, options: newOpts } : qq));
                                            }}
                                          />
                                          <button
                                            style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, border: `1px solid ${(q.answer === letter || q.answer === opt) ? '#86efac' : '#e2e8f0'}`, background: (q.answer === letter || q.answer === opt) ? '#dcfce7' : 'white', cursor: 'pointer', color: (q.answer === letter || q.answer === opt) ? '#166534' : '#64748b', fontWeight: 600 }}
                                            onClick={() => setQuestions(prev => prev.map(qq => qq.id === q.id ? { ...qq, answer: letter } : qq))}
                                          >{(q.answer === letter || q.answer === opt) ? '✓ Đúng' : 'Chọn'}</button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {(!q.options || q.options.length === 0) && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: q.answer ? '#16a34a' : '#ef4444' }}>
                                      {q.answer ? '✓ Đáp án:' : '✗ Đáp án:'}
                                    </span>
                                    <input
                                      style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}
                                      value={q.answer || ''}
                                      onChange={e => setQuestions(prev => prev.map(qq => qq.id === q.id ? { ...qq, answer: e.target.value } : qq))}
                                      placeholder="Nhập đáp án..."
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {subs.map((sq, si) => {
                              const sqOpts = sq.type === 'multiple_choice' && sq.options && typeof sq.options === 'object'
                                ? ['A','B','C','D'].filter(l => sq.options[l]).map(l => ({ letter: l, text: sq.options[l] }))
                                : [];
                              return (
                                <div key={sq.id || si} style={{
                                  background: 'white', borderRadius: 10, padding: '10px 12px',
                                  border: '1px solid #e0e7ff',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>Câu {si + 1}</span>
                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{sq.type}</span>
                                  </div>
                                  <textarea
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 50, boxSizing: 'border-box' }}
                                    value={sq.content || ''}
                                    onChange={e => handleSubChange(si, 'content', e.target.value)}
                                    placeholder="Nội dung câu hỏi..."
                                  />
                                  {sqOpts.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '6px 0' }}>
                                      {sqOpts.map(opt => (
                                        <div key={opt.letter} style={{
                                          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                                          borderRadius: 7, border: '1px solid #e2e8f0',
                                          background: sq.answer === opt.letter ? '#dcfce7' : '#f8fafc',
                                        }}>
                                          <span style={{ fontWeight: 700, fontSize: 12, minWidth: 18 }}>{opt.letter}.</span>
                                          <input
                                            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13 }}
                                            value={opt.text}
                                            onChange={e => {
                                              const newOpts = { ...sq.options, [opt.letter]: e.target.value };
                                              handleSubChange(si, 'options', newOpts);
                                            }}
                                          />
                                          <button
                                            style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, border: `1px solid ${sq.answer === opt.letter ? '#86efac' : '#e2e8f0'}`, background: sq.answer === opt.letter ? '#dcfce7' : 'white', cursor: 'pointer', color: sq.answer === opt.letter ? '#166534' : '#64748b', fontWeight: 600 }}
                                            onClick={() => handleSubChange(si, 'answer', opt.letter)}
                                          >{sq.answer === opt.letter ? '✓ Đúng' : 'Chọn'}</button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {sqOpts.length === 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: sq.answer ? '#16a34a' : '#ef4444' }}>
                                        {sq.answer ? '✓ Đáp án:' : '✗ Đáp án:'}
                                      </span>
                                      <input
                                        style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}
                                        value={sq.answer || ''}
                                        onChange={e => handleSubChange(si, 'answer', e.target.value)}
                                        placeholder="Nhập đáp án..."
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // ── Other types ──
                    const normOpts = getNormalizedOptions(q);
                    const hasCorrectOption = normOpts.some(o => o.isCorrect);
                    const isMissing = !q.detectedAnswer && !hasCorrectOption && !q.answer && !(Array.isArray(q.answers) && q.answers.length > 0);

                    let inputValue = q.detectedAnswer || q.answer || (Array.isArray(q.answers) ? q.answers.join(', ') : '') || (hasCorrectOption ? String.fromCharCode(65 + normOpts.findIndex(o => o.isCorrect)) : '');
                    if (Array.isArray(inputValue)) inputValue = inputValue.join(', ');

                    return (
                      <div key={q.id || i} className={`${drawerStyles.previewQuestion} ${isMissing ? drawerStyles.previewQuestionMissing : ''}`}>
                        <div className={drawerStyles.previewQNum}>
                          {isMissing ? <AlertCircle size={14} color="#ef4444" /> : <CheckCircle size={14} color="#10b981" />}
                          <span>Câu {i + 1}</span>
                        </div>

                        <textarea
                          className={drawerStyles.previewTitleInput}
                          style={{ fontSize: 13.5, marginBottom: 10, resize: 'vertical', minHeight: 60 }}
                          value={q.content || q.text || ''}
                          onChange={e => handleQChange(q.id, q.text ? 'text' : 'content', e.target.value)}
                          placeholder="Nội dung câu hỏi..."
                        />

                        {normOpts.length > 0 && (
                          <div className={drawerStyles.previewOptions}>
                            {normOpts.map((opt, oIdx) => {
                              return (
                                <div key={oIdx} className={`${drawerStyles.previewOption} ${opt.isCorrect ? drawerStyles.previewOptionCorrect : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + oIdx)}.</span>
                                  <input
                                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'inherit' }}
                                    value={opt.text}
                                    onChange={e => {
                                      if (Array.isArray(q.options) && q.options.length > 0) {
                                        const newOpts = [...q.options];
                                        if (typeof newOpts[oIdx] === 'string') {
                                          newOpts[oIdx] = `${String.fromCharCode(65 + oIdx)}. ${e.target.value}`;
                                        } else {
                                          newOpts[oIdx] = { ...newOpts[oIdx], text: e.target.value };
                                        }
                                        handleQChange(q.id, 'options', newOpts);
                                      } else {
                                        const letter = String.fromCharCode(65 + oIdx);
                                        handleQChange(q.id, `opt${letter}`, e.target.value);
                                      }
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className={drawerStyles.previewAnswer}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={isMissing ? drawerStyles.previewAnswerRed : drawerStyles.previewAnswerGreen} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {isMissing ? '✗ Đáp án:' : '✓ Đáp án:'}
                            </span>
                            <input
                              style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 12.5 }}
                              value={inputValue}
                              onChange={e => {
                                const val = e.target.value;
                                if (q.detectedAnswer !== undefined || q.type === 'multiple_choice') {
                                  handleQChange(q.id, q.detectedAnswer !== undefined ? 'detectedAnswer' : 'answer', val);
                                } else if (Array.isArray(q.options)) {
                                  const charVal = val.toUpperCase();
                                  const idx = charVal.charCodeAt(0) - 65;
                                  const newOpts = [...q.options].map((o, i) => ({ ...(typeof o === 'string' ? { text: o } : o), isCorrect: i === idx }));
                                  handleQChange(q.id, 'options', newOpts);
                                } else {
                                  handleQChange(q.id, 'answer', val);
                                }
                              }}
                              placeholder="Nhập đáp án (VD: A, B, hoặc nội dung)..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                  Không có câu hỏi nào.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}>
            <Dialog.Close asChild>
              <button style={{
                padding: '9px 20px', fontSize: 13.5, fontWeight: 600,
                border: '1.5px solid var(--color-border)', borderRadius: 10,
                background: 'var(--color-surface)', color: 'var(--color-text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                Hủy
              </button>
            </Dialog.Close>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              style={{
                padding: '9px 22px', fontSize: 13.5, fontWeight: 700,
                border: 'none', borderRadius: 10,
                background: title.trim() ? 'var(--gradient-primary)' : 'var(--color-border)',
                color: title.trim() ? '#fff' : 'var(--color-text-tertiary)',
                cursor: title.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Lưu thay đổi
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
