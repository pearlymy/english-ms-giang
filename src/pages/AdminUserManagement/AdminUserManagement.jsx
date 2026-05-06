/**
 * AdminUserManagement.jsx — v3 Clean
 * Features: gradient hero, inline column-header filters, hover-only actions,
 * delete student, delete class (cascades), edit class name, no courseId in create.
 * v4: Import from Excel / Export to Excel.
 */
import React, { useState, useMemo, useContext, useRef } from 'react';

import * as XLSX from 'xlsx';
import {
  Users, BookOpen, Plus, Search,
  Eye, EyeOff, Pencil, KeyRound,
  ToggleLeft, ToggleRight, ChevronDown, Trash2, X,
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Info,
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
   INLINE HEADER FILTER — searchable dropdown
════════════════════════════════════════════════════════════════════════════ */
const HeaderFilter = ({ label, options, value, onChange, searchable = false }) => {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState('');
  const inputRef = useRef(null);

  const selectedLabel = options.find(o => o.value === value)?.label ?? label;

  const filtered = searchable && query.trim()
    ? options.filter(o =>
        o.value === 'all' ||
        o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const handleOpen = () => {
    setOpen(o => !o);
    setQuery('');
    // Focus search input after render
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClose = () => { setOpen(false); setQuery(''); };

  return (
    <div className={styles.headerFilterWrap}>
      <div
        className={`${styles.headerFilterTrigger} ${value !== 'all' ? styles.headerFilterActive : ''}`}
        onClick={handleOpen}
      >
        <span className={styles.headerFilterLabel}>
          {value !== 'all' ? selectedLabel : label}
        </span>
        <ChevronDown size={11} className={styles.headerFilterChevron} />
      </div>

      {open && (
        <>
          <div className={styles.headerFilterBackdrop} onClick={handleClose} />
          <div className={styles.headerFilterPanel}>
            {/* Search box (only when searchable=true) */}
            {searchable && (
              <div className={styles.headerFilterSearch}>
                <Search size={12} className={styles.headerFilterSearchIcon} />
                <input
                  ref={inputRef}
                  className={styles.headerFilterSearchInput}
                  placeholder="Tìm lớp..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                {query && (
                  <button
                    className={styles.headerFilterSearchClear}
                    onClick={e => { e.stopPropagation(); setQuery(''); inputRef.current?.focus(); }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )}

            <div className={styles.headerFilterOptions}>
              {filtered.length === 0 && (
                <div className={styles.headerFilterEmpty}>Không tìm thấy</div>
              )}
              {filtered.map(o => (
                <button
                  key={o.value}
                  className={`${styles.headerFilterOption} ${value === o.value ? styles.headerFilterOptionActive : ''}`}
                  onClick={() => { onChange(o.value); handleClose(); }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   IMPORT EXCEL MODAL
════════════════════════════════════════════════════════════════════════════ */
const REQUIRED_COLS = ['username', 'name', 'email'];
const TEMPLATE_HEADERS = ['username', 'name', 'email', 'phone', 'password', 'class_code'];

/** Map cột Excel → field app */
const normalizeHeader = (h) => {
  const map = {
    'username': 'username', 'tên đăng nhập': 'username', 'ten dang nhap': 'username',
    'name': 'name', 'họ tên': 'name', 'ho ten': 'name', 'họ và tên': 'name',
    'email': 'email',
    'phone': 'phone', 'sdt': 'phone', 'số điện thoại': 'phone', 'so dien thoai': 'phone',
    'password': 'password', 'mật khẩu': 'password', 'mat khau': 'password',
    'class_code': 'class_code', 'mã lớp': 'class_code', 'ma lop': 'class_code', 'lớp': 'class_code',
  };
  return map[h.trim().toLowerCase()] ?? null;
};

const validateRow = (row, idx) => {
  const errors = [];
  if (!row.username) errors.push('Thiếu username');
  if (!row.name)     errors.push('Thiếu họ tên');
  if (!row.email || !row.email.includes('@')) errors.push('Email không hợp lệ');
  if (!row.password) errors.push('Thiếu mật khẩu');
  return errors;
};

const ImportModal = ({ open, onClose, classes }) => {
  const { bulkCreateStudents } = useUserManagement();
  const toast   = useToast();
  const [rows,       setRows]       = useState([]);
  const [rowErrors,  setRowErrors]  = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importing,  setImporting]  = useState(false);
  const [fileName,   setFileName]   = useState('');
  const fileInputRef = useRef(null);

  const reset = () => { setRows([]); setRowErrors([]); setFileName(''); setImporting(false); };

  const parseFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
      // Normalize headers
      const normalized = raw.map((rawRow) => {
        const out = {};
        Object.entries(rawRow).forEach(([k, v]) => {
          const field = normalizeHeader(k);
          if (field) out[field] = String(v).trim();
        });
        return out;
      });
      const errors = normalized.map((r, i) => validateRow(r, i));
      setRows(normalized);
      setRowErrors(errors);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    parseFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e) => parseFile(e.target.files[0]);

  const validRows  = rows.filter((_, i) => rowErrors[i]?.length === 0);
  const errorCount = rows.filter((_, i) => rowErrors[i]?.length > 0).length;

  const handleImport = async () => {
    if (!validRows.length) return;
    setImporting(true);
    // Map class_code → classId
    const payload = validRows.map((r) => {
      const cls = r.class_code
        ? classes.find((c) => c.code?.toLowerCase() === r.class_code.toLowerCase())
        : null;
      return { ...r, classId: cls?.id ?? null };
    });
    const { succeeded, failed } = await bulkCreateStudents(payload);
    setImporting(false);
    if (succeeded.length > 0) {
      toast?.success(`Đã thêm ${succeeded.length} học viên thành công`, { title: 'Import hoàn tất' });
    }
    if (failed.length > 0) {
      toast?.error(`${failed.length} học viên không thể tạo (xem console)`, { title: 'Có lỗi khi import' });
      console.warn('Import failures:', failed);
    }
    reset(); onClose();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS,
      ['hocsinh01', 'Nguyễn Văn A', 'a@example.com', '0909123456', 'matkhau123', '2026.07.01'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_hoc_vien.xlsx');
  };

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}
      title="Import học viên từ Excel"
      contentClassName={styles.importModalWide}
      primaryAction={{
        label: importing ? 'Đang import...' : `Import ${validRows.length} học viên`,
        onClick: handleImport,
        disabled: importing || validRows.length === 0,
      }}
      secondaryAction={{ label: 'Hủy' }}
    >
      {/* Drop zone */}
      {rows.length === 0 && (
        <>
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
          >
            <div className={styles.dropZoneIcon}><FileSpreadsheet size={24} /></div>
            <p className={styles.dropZoneTitle}>Kéo thả file Excel vào đây</p>
            <p className={styles.dropZoneSub}>hoặc nhấn để chọn file • Hỗ trợ .xlsx, .xls, .csv</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className={styles.dropZoneFileInput}
              onChange={handleFileChange}
            />
          </div>
          <div className={styles.templateHint}>
            <Info size={13} />
            <span>Tải file mẫu để biết định dạng yêu cầu:</span>
            <button className={styles.templateDownloadBtn} onClick={downloadTemplate}>
              template_hoc_vien.xlsx
            </button>
          </div>
        </>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>Xem trước: {fileName}</span>
            <button className={styles.templateDownloadBtn} onClick={reset}>Chọn file khác</button>
          </div>

          <div className={styles.importSummary}>
            <span>Tổng: <strong>{rows.length}</strong> dòng</span>
            <span className={styles.importSummaryOk}>✓ {validRows.length} hợp lệ</span>
            {errorCount > 0 && <span className={styles.importSummaryErr}>✗ {errorCount} lỗi (sẽ bỏ qua)</span>}
          </div>

          {importing && (
            <div className={styles.importingBar}>
              <Loader2 size={15} className={styles.spinIcon} />
              Đang tạo tài khoản... vui lòng đợi
            </div>
          )}

          <div className={styles.previewTableWrap}>
            <table className={styles.previewTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Mã lớp</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.username || '—'}</td>
                    <td>{r.name || '—'}</td>
                    <td>{r.email || '—'}</td>
                    <td>{r.phone || '—'}</td>
                    <td>{r.class_code || '—'}</td>
                    <td>
                      {rowErrors[i]?.length === 0
                        ? <span className={styles.rowStatusOk}><CheckCircle2 size={10} /> Hợp lệ</span>
                        : <span className={styles.rowStatusError} title={rowErrors[i].join(', ')}>
                            <AlertCircle size={10} /> {rowErrors[i][0]}
                          </span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB — Học viên
════════════════════════════════════════════════════════════════════════════ */
const LS_PAGE_SIZE_KEY = 'hg_students_page_size';
const PAGE_SIZE_OPTIONS = [20, 50, 100];

const TabStudents = () => {
  const { students, classes, toggleActive, deleteStudent } = useUserManagement();
  const toast = useToast();
  const [search,       setSearch]       = useState('');
  const [filterClass,  setFilterClass]  = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [addOpen,      setAddOpen]      = useState(false);
  const [importOpen,   setImportOpen]   = useState(false);
  const [editStudent,  setEditStudent]  = useState(null);
  const [pwStudent,    setPwStudent]    = useState(null);

  /* ── Pagination ──────────────────────────────────────────────────────── */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = parseInt(localStorage.getItem(LS_PAGE_SIZE_KEY), 10);
    return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 20;
  });

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
    localStorage.setItem(LS_PAGE_SIZE_KEY, size);
  };

  // Reset về trang 1 khi filter thay đổi
  const handleFilterClass  = (v) => { setFilterClass(v);  setPage(1); };
  const handleFilterStatus = (v) => { setFilterStatus(v); setPage(1); };
  const handleSearch       = (v) => { setSearch(v);       setPage(1); };

  const classFilterOptions = [
    { value: 'all', label: 'Tất cả lớp' },
    ...classes.map(c => ({ value: c.id, label: `${c.code} — ${c.name}` })),
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

  const totalPages   = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage     = Math.min(page, totalPages);
  const paged        = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

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

  /** Export danh sách học viên đang hiển thị ra Excel */
  const handleExport = () => {
    const data = filtered.map((s) => {
      const cls = getClass(s.classId);
      return {
        'Username':   s.username ?? '',
        'Họ tên':     s.name,
        'Email':      s.email,
        'Số ĐT':      s.phone ?? '',
        'Mã lớp':     cls?.code ?? '',
        'Tên lớp':    cls?.name ?? '',
        'Trạng thái': s.isActive ? 'Hoạt động' : 'Vô hiệu',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    // Tự động căn rộng cột
    const colWidths = Object.keys(data[0] ?? {}).map((k) => ({
      wch: Math.max(k.length, ...data.map((r) => String(r[k] ?? '').length)) + 2,
    }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Học viên');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `danh_sach_hoc_vien_${dateStr}.xlsx`);
    toast?.success(`Đã xuất ${filtered.length} học viên ra file Excel`);
  };

  return (
    <div className={styles.tabSection}>
      {/* Toolbar: search + Import/Export + Add button */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput}
            placeholder="Tìm tên, username, email..."
            value={search} onChange={e => handleSearch(e.target.value)} />
          {search && (
            <button className={styles.searchClear} onClick={() => handleSearch('')} type="button">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Import Excel */}
        <button
          className={`${styles.toolbarIconBtn} ${styles.toolbarIconBtnBlue}`}
          onClick={() => setImportOpen(true)}
          title="Import học viên từ file Excel"
        >
          <Upload size={14} /> Import Excel
        </button>

        {/* Export Excel */}
        <button
          className={`${styles.toolbarIconBtn} ${styles.toolbarIconBtnGreen}`}
          onClick={handleExport}
          disabled={filtered.length === 0}
          title={`Xuất ${filtered.length} học viên ra Excel`}
        >
          <Download size={14} /> Export Excel
        </button>

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
          <HeaderFilter
            label="Mã Lớp"
            options={classFilterOptions}
            value={filterClass}
            onChange={handleFilterClass}
            searchable
          />
          <span>Tên Lớp</span>
          <span>SĐT</span>
          <HeaderFilter
            label="Trạng thái"
            options={statusFilterOptions}
            value={filterStatus}
            onChange={handleFilterStatus}
          />
          <span />
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>Không tìm thấy học viên nào.</div>
        )}

        {paged.map((s, i) => {
          const cls = getClass(s.classId);
          return (
            <div key={s.id} className={styles.tableRow}>
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

              <span className={styles.cellText}>
                {cls ? cls.name : '—'}
              </span>

              <span className={styles.cellText}>{s.phone || '—'}</span>

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

      {/* ── Pagination bar ─────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className={styles.paginationBar}>
          {/* Left: info + page size selector */}
          <div className={styles.paginationInfo}>
            <span className={styles.paginationCount}>
              Hiển {Math.min((safePage - 1) * pageSize + 1, filtered.length)}–{Math.min(safePage * pageSize, filtered.length)}
              {' '}<span className={styles.paginationTotal}>/ {filtered.length} học viên</span>
            </span>
            <div className={styles.pageSizeWrap}>
              <span className={styles.pageSizeLabel}>/trang:</span>
              {PAGE_SIZE_OPTIONS.map(sz => (
                <button
                  key={sz}
                  className={`${styles.pageSizeBtn} ${pageSize === sz ? styles.pageSizeBtnActive : ''}`}
                  onClick={() => handlePageSizeChange(sz)}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Right: page buttons */}
          <div className={styles.paginationPages}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              title="Trang trước"
            >
              ‹
            </button>

            {/* Page number pills */}
            {(() => {
              const pages = [];
              const delta = 2;
              const left  = Math.max(1, safePage - delta);
              const right = Math.min(totalPages, safePage + delta);
              if (left > 1)  { pages.push(1); if (left > 2) pages.push('...'); }
              for (let p = left; p <= right; p++) pages.push(p);
              if (right < totalPages) { if (right < totalPages - 1) pages.push('...'); pages.push(totalPages); }
              return pages.map((p, idx) =>
                p === '...' ? (
                  <span key={`e${idx}`} className={styles.pageEllipsis}>…</span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === safePage ? styles.pageBtnActive : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              );
            })()}

            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              title="Trang sau"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <StudentModal open={addOpen} classes={classes} onClose={() => setAddOpen(false)} />
      <ImportModal open={importOpen} classes={classes} onClose={() => setImportOpen(false)} />
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
