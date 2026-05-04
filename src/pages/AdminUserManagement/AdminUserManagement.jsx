/**
 * AdminUserManagement.jsx — v3 Clean
 * Features: gradient hero, inline column-header filters, hover-only actions,
 * delete student, delete class (cascades), edit class name, no courseId in create.
 */
import React, { useState, useMemo, useContext } from 'react';
import {
  Users, BookOpen, Plus, Search,
  Eye, EyeOff, Pencil, KeyRound,
  ToggleLeft, ToggleRight, ChevronDown, Trash2, X,
} from 'lucide-react';

import { Button }       from '../../design-system/components/Button/Button';
import { Badge }        from '../../design-system/components/Badge/Badge';
import { Modal }        from '../../design-system/components/Modal/Modal';
import { Tabs }         from '../../design-system/components/Tabs/Tabs';
import { TextField }    from '../../design-system/components/TextField/TextField';
import { Select }       from '../../design-system/components/Select/Select';
import { ToastContext } from '../../design-system/components/Toast/Toast';

import { useUserManagement } from '../../contexts/UserManagementContext';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
/** Generate class code: YYYY.GG.SS */
const generateClassCode = (gradeLevel, existingClasses = []) => {
  const year  = new Date().getFullYear();
  const grade = String(gradeLevel).padStart(2, '0');
  const sameGroup = existingClasses.filter(
    (c) => c.year === year && Number(c.gradeLevel ?? c.grade_level) === Number(gradeLevel)
  );
  const seq = String(sameGroup.length + 1).padStart(2, '0');
  return `${year}.${grade}.${seq}`;
};

import styles from './AdminUserManagement.module.css';

/* ── Hooks ───────────────────────────────────────────────────────────────── */
const useToast = () => useContext(ToastContext);

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const getInitials = (name) =>
  name ? name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?';

const AV_COLORS = ['#dbeafe','#ede9fe','#d1fae5','#fce7f3','#cffafe','#fef3c7'];
const AV_TEXT   = ['#1d4ed8','#6d28d9','#065f46','#9d174d','#0e7490','#92400e'];


/* ════════════════════════════════════════════════════════════════════════════
   MODAL — Tạo lớp (no courseId)
════════════════════════════════════════════════════════════════════════════ */
const ClassModal = ({ open, onClose, classes }) => {
  const { createClass } = useUserManagement();
  const toast = useToast();
  const [gradeLevel, setGradeLevel] = useState('');
  const [name,       setName]       = useState('');

  const previewCode = gradeLevel ? generateClassCode(gradeLevel, classes) : '—';
  const reset = () => { setGradeLevel(''); setName(''); };

  const handleCreate = () => {
    if (!gradeLevel || !name) return;
    createClass({ gradeLevel, name, courseId: null });
    toast?.success(`Đã tạo lớp ${name}`, { title: 'Tạo lớp thành công' });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}
      title="Tạo lớp mới"
      description="Mã lớp sẽ được tự động sinh theo khối và năm học."
      primaryAction={{ label: 'Tạo lớp', onClick: handleCreate }}
      secondaryAction={{ label: 'Hủy' }}
    >
      <div className={styles.formGrid}>
        <div>
          <TextField label="Khối lớp (số)" type="number" min="1" max="12"
            placeholder="VD: 7" value={gradeLevel}
            onChange={e => setGradeLevel(e.target.value)} />
          {gradeLevel && (
            <p className={styles.codePreview}>Mã tự sinh: <strong>{previewCode}</strong></p>
          )}
        </div>
        <TextField label="Tên lớp" placeholder="VD: Lớp 7" value={name}
          onChange={e => setName(e.target.value)} />
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MODAL — Sửa tên lớp
════════════════════════════════════════════════════════════════════════════ */
const EditClassModal = ({ open, cls, onClose }) => {
  const { updateClass } = useUserManagement();
  const toast = useToast();
  const [name, setName] = useState(cls?.name ?? '');

  const handleSave = () => {
    if (!name.trim()) return;
    updateClass(cls.id, { name: name.trim() });
    toast?.success(`Đã cập nhật tên lớp thành "${name.trim()}"`);
    onClose();
  };

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }}
      title="Sửa tên lớp"
      description={`Mã lớp: ${cls?.code}`}
      primaryAction={{ label: 'Lưu', onClick: handleSave }}
      secondaryAction={{ label: 'Hủy' }}
    >
      <TextField label="Tên lớp" value={name} onChange={e => setName(e.target.value)} />
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MODAL — Tạo / Sửa học viên
════════════════════════════════════════════════════════════════════════════ */
const StudentModal = ({ open, student, onClose, classes }) => {
  const { createStudent, updateStudent } = useUserManagement();
  const toast  = useToast();
  const isEdit = !!student;

  const [form, setForm] = useState(() => ({
    username: student?.username ?? '',
    name:     student?.name     ?? '',
    email:    student?.email    ?? '',
    phone:    student?.phone    ?? '',
    password: '',
    classId:  student?.classId  ?? '',
    isActive: student?.isActive ?? true,
  }));
  const [showPw, setShowPw] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const classOptions = classes.map(c => ({ value: c.id, label: `${c.code} — ${c.name}` }));

  const handleSave = () => {
    if (!form.username || !form.name || !form.email) return;
    if (isEdit) {
      updateStudent(student.id, form);
      toast?.success(`Đã cập nhật thông tin ${form.name}`);
    } else {
      createStudent(form);
      toast?.success(`Đã thêm học viên ${form.name}`, { title: 'Thêm thành công' });
    }
    onClose();
  };

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }}
      title={isEdit ? 'Sửa thông tin học viên' : 'Thêm học viên mới'}
      contentClassName={styles.modalWide}
      primaryAction={{ label: isEdit ? 'Lưu thay đổi' : 'Thêm học viên', onClick: handleSave }}
      secondaryAction={{ label: 'Hủy' }}
    >
      <div className={styles.formGrid}>
        <TextField label="Username" placeholder="hocsinh01"
          value={form.username} onChange={e => set('username', e.target.value)} />
        <TextField label="Họ tên" placeholder="Nguyễn Văn A"
          value={form.name} onChange={e => set('name', e.target.value)} />
        <TextField label="Email" type="email" placeholder="email@hgenglish.vn"
          value={form.email} onChange={e => set('email', e.target.value)} />
        <TextField label="Số điện thoại" placeholder="0909 123 456"
          value={form.phone} onChange={e => set('phone', e.target.value)} />
        <div className={styles.pwField}>
          <TextField label="Mật khẩu" type={showPw ? 'text' : 'password'}
            placeholder="Mật khẩu" value={form.password}
            onChange={e => set('password', e.target.value)} />
          <button type="button" className={styles.eyeToggle} onClick={() => setShowPw(p => !p)}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <Select label="Lớp học" placeholder="— Chọn lớp —"
          options={classOptions} value={form.classId} onChange={v => set('classId', v)} />
      </div>
      <div className={styles.activeRow}>
        <span className={styles.activeLabel}>Trạng thái tài khoản</span>
        <button type="button"
          className={`${styles.togglePill} ${form.isActive ? styles.togglePillOn : ''}`}
          onClick={() => set('isActive', !form.isActive)}>
          {form.isActive
            ? <><ToggleRight size={18} /> Hoạt động</>
            : <><ToggleLeft  size={18} /> Vô hiệu hóa</>}
        </button>
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MODAL — Đặt lại mật khẩu
════════════════════════════════════════════════════════════════════════════ */
const PasswordModal = ({ open, student, onClose }) => {
  const { updatePassword } = useUserManagement();
  const toast = useToast();
  const [pw,   setPw]   = useState('');
  const [show, setShow] = useState(false);

  const handleSave = () => {
    if (!pw) return;
    updatePassword(student.id, pw);
    toast?.success(`Đã đặt lại mật khẩu cho ${student.name}`);
    setPw(''); onClose();
  };

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) { setPw(''); onClose(); } }}
      title="Đặt lại mật khẩu" description={`Học viên: ${student?.name ?? ''}`}
      primaryAction={{ label: 'Lưu mật khẩu', onClick: handleSave }}
      secondaryAction={{ label: 'Hủy' }}
    >
      <div className={styles.pwField}>
        <TextField label="Mật khẩu mới" type={show ? 'text' : 'password'}
          placeholder="Nhập mật khẩu mới" value={pw}
          onChange={e => setPw(e.target.value)} />
        <button type="button" className={styles.eyeToggle} onClick={() => setShow(s => !s)}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   ROW MENU — student actions
════════════════════════════════════════════════════════════════════════════ */
const RowMenu = ({ student, onEdit, onPassword, onToggle, onDelete }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.rowMenuWrap}>
      <button className={styles.rowMenuTrigger} onClick={() => setOpen(o => !o)} aria-label="Tùy chọn">
        <ChevronDown size={13} />
      </button>
      {open && (
        <>
          <div className={styles.rowMenuBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.rowMenuPanel}>
            <button onClick={() => { onEdit();     setOpen(false); }}><Pencil   size={13} /> Sửa thông tin</button>
            <button onClick={() => { onPassword(); setOpen(false); }}><KeyRound size={13} /> Đặt lại mật khẩu</button>
            <button onClick={() => { onToggle();   setOpen(false); }}>
              {student.isActive
                ? <><ToggleLeft  size={13} /> Vô hiệu hóa</>
                : <><ToggleRight size={13} /> Kích hoạt</>}
            </button>
            <button className={styles.menuDeleteBtn} onClick={() => { onDelete(); setOpen(false); }}>
              <Trash2 size={13} /> Xóa học viên
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   INLINE HEADER FILTER — custom dropdown matching design system
════════════════════════════════════════════════════════════════════════════ */
const HeaderFilter = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.headerFilterWrap}>
      <div
        className={`${styles.headerFilterTrigger} ${value !== 'all' ? styles.headerFilterActive : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.headerFilterLabel}>{label}</span>
        <ChevronDown size={11} className={styles.headerFilterChevron} />
      </div>

      {open && (
        <>
          <div className={styles.headerFilterBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.headerFilterPanel}>
            {options.map(o => (
              <button
                key={o.value}
                className={`${styles.headerFilterOption} ${value === o.value ? styles.headerFilterOptionActive : ''}`}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB — Học viên
════════════════════════════════════════════════════════════════════════════ */
const TabStudents = () => {
  const { students, classes, toggleActive, deleteStudent } = useUserManagement();
  const toast = useToast();
  const [search,       setSearch]       = useState('');
  const [filterClass,  setFilterClass]  = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [addOpen,      setAddOpen]      = useState(false);
  const [editStudent,  setEditStudent]  = useState(null);
  const [pwStudent,    setPwStudent]    = useState(null);

  const classFilterOptions = [
    { value: 'all', label: 'Tất cả lớp' },
    ...classes.map(c => ({ value: c.id, label: c.code })),
  ];
  const statusFilterOptions = [
    { value: 'all',      label: 'Tất cả' },
    { value: 'active',   label: 'Hoạt động' },
    { value: 'inactive', label: 'Vô hiệu' },
  ];

  const filtered = useMemo(() => students.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q ||
      s.name.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q);
    const matchClass  = filterClass  === 'all' || s.classId === filterClass;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? s.isActive : !s.isActive);
    return matchQ && matchClass && matchStatus;
  }), [students, search, filterClass, filterStatus]);

  const getClass = (classId) => classes.find(c => c.id === classId);

  const handleToggle = (s) => {
    toggleActive(s.id);
    toast?.info(s.isActive ? `Đã vô hiệu hóa ${s.name}` : `Đã kích hoạt ${s.name}`);
  };

  const handleDelete = (s) => {
    if (!window.confirm(`Xóa học viên ${s.name}? Thao tác này không thể hoàn tác.`)) return;
    deleteStudent(s.id);
    toast?.success(`Đã xóa học viên ${s.name}`);
  };

  return (
    <div className={styles.tabSection}>
      {/* Toolbar: search + Add button */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput}
            placeholder="Tìm tên, username, email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')} type="button">
              <X size={13} />
            </button>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Thêm học viên
        </Button>
      </div>

      {/* Table panel */}
      <div className={styles.tablePanel}>
        {/* Header with inline filters */}
        <div className={`${styles.tableRow} ${styles.tableHeader}`}>
          <span>Học viên</span>
          <span>Username</span>
          {/* Lớp — inline filter */}
          <HeaderFilter
            label="Lớp"
            options={classFilterOptions}
            value={filterClass}
            onChange={setFilterClass}
          />
          <span>SĐT</span>
          {/* Trạng thái — inline filter */}
          <HeaderFilter
            label="Trạng thái"
            options={statusFilterOptions}
            value={filterStatus}
            onChange={setFilterStatus}
          />
          <span />
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>Không tìm thấy học viên nào.</div>
        )}

        {filtered.map((s, i) => {
          const cls = getClass(s.classId);
          return (
            <div key={s.id} className={styles.tableRow}>
              {/* Avatar + name + email */}
              <div className={styles.studentCell}>
                <div className={styles.avatarCircle}
                  style={{ background: AV_COLORS[i % AV_COLORS.length], color: AV_TEXT[i % AV_TEXT.length] }}>
                  {getInitials(s.name)}
                </div>
                <div className={styles.studentMeta}>
                  <span className={styles.studentName}>{s.name}</span>
                  <span className={styles.studentEmail}>{s.email}</span>
                </div>
              </div>

              <span className={styles.cellText}>{s.username}</span>

              <span className={styles.cellText}>
                {cls ? cls.code : '—'}
              </span>

              <span className={styles.cellText}>{s.phone || '—'}</span>

              {/* Status — clickable toggle */}
              <button className={styles.statusToggle}
                onClick={() => handleToggle(s)}
                title={s.isActive ? 'Nhấn để vô hiệu hóa' : 'Nhấn để kích hoạt'}>
                <Badge variant={s.isActive ? 'success' : 'default'}>
                  <span className={styles.statusDot} />
                  {s.isActive ? 'Hoạt động' : 'Vô hiệu'}
                </Badge>
              </button>

              <RowMenu student={s}
                onEdit={() => setEditStudent(s)}
                onPassword={() => setPwStudent(s)}
                onToggle={() => handleToggle(s)}
                onDelete={() => handleDelete(s)}
              />
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <StudentModal open={addOpen} classes={classes} onClose={() => setAddOpen(false)} />
      {editStudent && (
        <StudentModal open={!!editStudent} student={editStudent} classes={classes}
          onClose={() => setEditStudent(null)} />
      )}
      {pwStudent && (
        <PasswordModal open={!!pwStudent} student={pwStudent} onClose={() => setPwStudent(null)} />
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB — Quản lý Lớp
════════════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════════
   MODAL — Xác nhận xóa lớp
════════════════════════════════════════════════════════════════════════════ */
const ConfirmDeleteClassModal = ({ open, cls, studentCount, onConfirm, onClose }) => (
  <Modal
    open={open}
    onOpenChange={(v) => { if (!v) onClose(); }}
    title="Xóa lớp học"
    description={`Bạn có chắc muốn xóa lớp “${cls?.name}” (${cls?.code})?`}
    primaryAction={{
      label: 'Xóa lớp',
      danger: true,
      onClick: onConfirm,
    }}
    secondaryAction={{ label: 'Hủy' }}
  >
    {studentCount > 0 ? (
      <div className={styles.deleteWarning}>
        <Trash2 size={16} />
        <span>
          Khi xóa lớp, toàn bộ <strong>{studentCount} học viên</strong> trong
          lớp cũng sẽ bị xóa theo. Thao tác này <strong>không thể hoàn tác</strong>.
        </span>
      </div>
    ) : (
      <div className={styles.deleteWarning}>
        <Trash2 size={16} />
        <span>Thao tác này <strong>không thể hoàn tác</strong>.</span>
      </div>
    )}
  </Modal>
);


const TabClasses = () => {
  const { classes, students, deleteClass } = useUserManagement();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCls,    setEditCls]    = useState(null);
  const [deleteCls,  setDeleteCls]  = useState(null);

  const studentCount = deleteCls
    ? students.filter(s => s.classId === deleteCls.id).length
    : 0;

  const handleConfirmDelete = () => {
    deleteClass(deleteCls.id);
    toast?.success(
      `Đã xóa lớp ${deleteCls.code}${studentCount > 0 ? ` và ${studentCount} học viên` : ''}`
    );
    setDeleteCls(null);
  };

  return (
    <div className={styles.tabSection}>
      <div className={styles.toolbar}>
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Tạo lớp mới
        </Button>
      </div>

      <div className={styles.tablePanel}>
        <div className={`${styles.classRow} ${styles.tableHeader}`}>
          <span>Mã lớp</span>
          <span>Tên lớp</span>
          <span>Học viên</span>
          <span>Năm</span>
          <span />
        </div>

        {classes.length === 0 && (
          <div className={styles.empty}>Chưa có lớp nào. Hãy tạo lớp đầu tiên!</div>
        )}

        {classes.map(cls => {
          const count = students.filter(s => s.classId === cls.id).length;
          return (
            <div key={cls.id} className={`${styles.classRow} ${styles.classRowData}`}>
              <span className={styles.cellText}>{cls.code}</span>
              <span className={styles.className}>{cls.name}</span>
              <span className={styles.cellText}>{count} học viên</span>
              <span className={styles.cellText}>{cls.year}</span>
              {/* Actions: only visible on hover */}
              <div className={styles.rowActions}>
                <button className={styles.rowActionBtn}
                  title="Sửa tên lớp"
                  onClick={() => setEditCls(cls)}>
                  <Pencil size={14} />
                </button>
                <button className={`${styles.rowActionBtn} ${styles.rowActionDelete}`}
                  title="Xóa lớp"
                  onClick={() => setDeleteCls(cls)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ClassModal open={createOpen} classes={classes} onClose={() => setCreateOpen(false)} />
      {editCls && (
        <EditClassModal open={!!editCls} cls={editCls} onClose={() => setEditCls(null)} />
      )}
      {deleteCls && (
        <ConfirmDeleteClassModal
          open={!!deleteCls}
          cls={deleteCls}
          studentCount={studentCount}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteCls(null)}
        />
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   PAGE ROOT
════════════════════════════════════════════════════════════════════════════ */
export const AdminUserManagement = () => {
  const { students } = useUserManagement();
  const active   = students.filter(s => s.isActive).length;
  const inactive = students.filter(s => !s.isActive).length;

  return (
    <div className={styles.page}>
      {/* Hero gradient banner */}
      <div className={styles.hero}>
        <div className={styles.heroIconWrap}>
          <Users size={24} strokeWidth={1.6} color="#fff" />
        </div>
        <div>
          <h1 className={styles.heroTitle}>Quản lý Người dùng</h1>
          <p className={styles.heroSub}>Quản lý lớp học và tài khoản học viên của bạn</p>
        </div>
        <div className={styles.statChips}>
          <span className={styles.chip}><span className={styles.chipVal}>{students.length}</span> tổng</span>
          <span className={styles.chip}><span className={styles.chipDot} /><span className={styles.chipVal}>{active}</span> hoạt động</span>
          <span className={styles.chip}><span className={styles.chipDot} /><span className={styles.chipVal}>{inactive}</span> vô hiệu</span>
        </div>
      </div>

      <Tabs defaultValue="students" tabs={[
        { value: 'students', label: 'Học viên',     icon: <Users    size={14} />, content: <TabStudents /> },
        { value: 'classes',  label: 'Quản lý Lớp', icon: <BookOpen size={14} />, content: <TabClasses  /> },
      ]} />
    </div>
  );
};
