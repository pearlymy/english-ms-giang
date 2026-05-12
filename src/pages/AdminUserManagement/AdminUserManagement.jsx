/**
 * AdminUserManagement.jsx — v3 Clean
 * Features: gradient hero, inline column-header filters, hover-only actions,
 * delete student, delete class (cascades), edit class name, no courseId in create.
 * v4: Import from Excel / Export to Excel.
 */
import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';

import * as XLSX from 'xlsx';
import {
  Users, BookOpen, Plus, Search,
  Eye, EyeOff, Pencil, KeyRound,
  ToggleLeft, ToggleRight, ChevronDown, Trash2, X,
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Info,
  ArrowRightLeft, Lightbulb, Lock, Zap,
} from 'lucide-react';

import { Button } from '../../design-system/components/Button/Button';
import { Badge } from '../../design-system/components/Badge/Badge';
import { Modal } from '../../design-system/components/Modal/Modal';
import { Tabs } from '../../design-system/components/Tabs/Tabs';
import { TextField } from '../../design-system/components/TextField/TextField';
import { Select } from '../../design-system/components/Select/Select';
import { ToastContext } from '../../design-system/components/Toast/Toast';

import { useUserManagement } from '../../contexts/UserManagementContext';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
/** Generate class code: YYYY.GG.SS */
const generateClassCode = (gradeLevel, existingClasses = []) => {
  const year = new Date().getFullYear();
  const grade = String(gradeLevel).padStart(2, '0');
  const sameGroup = existingClasses.filter(
    (c) => c.year === year && Number(c.gradeLevel ?? c.grade_level) === Number(gradeLevel)
  );
  const seq = String(sameGroup.length + 1).padStart(2, '0');
  return `${year}.${grade}.${seq}`;
};

import styles from './AdminUserManagement.module.css';
import {
  generateUsernameBase,
  generateUniqueUsername,
  validateFullName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateStudentForm,
  isFormValid,
  capitalizeEachWord,
} from '../../utils/validators';

/* ── Hooks ───────────────────────────────────────────────────────────────── */
const useToast = () => useContext(ToastContext);

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const getInitials = (name) =>
  name ? name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?';

/** Xóa dấu tiếng Việt để tìm kiếm không dấu */
const removeDiacritics = (str) =>
  str ? str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : '';

const AV_COLORS = ['#dbeafe', '#ede9fe', '#d1fae5', '#fce7f3', '#cffafe', '#fef3c7'];
const AV_TEXT = ['#1d4ed8', '#6d28d9', '#065f46', '#9d174d', '#0e7490', '#92400e'];


/* ════════════════════════════════════════════════════════════════════════════
   MODAL — Tạo lớp (no courseId)
════════════════════════════════════════════════════════════════════════════ */
const ClassModal = ({ open, onClose, classes }) => {
  const { createClass } = useUserManagement();
  const toast = useToast();
  const [gradeLevel, setGradeLevel] = useState('');
  const [name, setName] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [gradeErr, setGradeErr] = useState('');

  const previewCode = gradeLevel ? generateClassCode(gradeLevel, classes) : '—';

  // Tên đầy đủ sẽ lưu: "Lớp {gradeLevel} - {Tên lớp}"
  const fullName = gradeLevel && name.trim()
    ? `Lớp ${gradeLevel} - ${capitalizeEachWord(name.trim())}`
    : '';

  const reset = () => { setGradeLevel(''); setName(''); setNameErr(''); setGradeErr(''); };

  /** Validate khối lớp */
  const validateGrade = (val) => {
    if (!val || !val.trim()) return 'Khối lớp là bắt buộc';
    const n = Number(val);
    if (!Number.isInteger(n) || n < 1 || n > 12) return 'Khối lớp phải là số từ 1 đến 12';
    return '';
  };

  /** Validate tên lớp: chỉ chữ cái (tiếng Việt), khoảng trắng, dấu gạch ngang */
  const validateClassName = (val) => {
    if (!val || !val.trim()) return 'Tên lớp là bắt buộc';
    if (/\d/.test(val)) return 'Tên lớp không được chứa số';
    if (/[^a-zA-ZÀ-ỹĐđ\s-]/.test(val)) return 'Tên lớp không được chứa ký tự đặc biệt';
    if (/\s{2,}/.test(val)) return 'Không được có khoảng trắng liên tiếp';
    return '';
  };

  const handleGradeChange = (val) => {
    setGradeLevel(val);
    if (gradeErr) setGradeErr(validateGrade(val));
  };

  const handleNameChange = (raw) => {
    const clean = raw.replace(/[^a-zA-ZÀ-ỹĐđ\s-]/g, '');
    setName(clean);
    if (nameErr) setNameErr(validateClassName(clean));
  };

  const handleCreate = () => {
    const gErr = validateGrade(gradeLevel);
    const nErr = validateClassName(name);
    setGradeErr(gErr);
    setNameErr(nErr);
    if (gErr || nErr) return;
    createClass({ gradeLevel, name: fullName, courseId: null });
    toast?.success(`Đã tạo lớp "${fullName}"`, { title: 'Tạo lớp thành công' });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}
      title="Tạo lớp mới"
      description="Tên lớp sẽ tự động được định dạng theo khối. Mã lớp tự sinh."
      primaryAction={{ label: 'Tạo lớp', onClick: handleCreate }}
      secondaryAction={{ label: 'Hủy' }}
    >
      <div className={styles.formGrid}>
        <div>
          <TextField label="Khối lớp (số)" type="number" min="1" max="12"
            placeholder="VD: 1" value={gradeLevel}
            onChange={e => handleGradeChange(e.target.value)}
            onBlur={() => setGradeErr(validateGrade(gradeLevel))}
            error={gradeErr}
          />
          {gradeLevel && !gradeErr && (
            <p className={styles.codePreview}>Mã tự sinh: <strong>{previewCode}</strong></p>
          )}
        </div>
        <div>
          <TextField
            label="Tên lớp"
            placeholder="VD: Cá Nhân"
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            onBlur={() => setNameErr(validateClassName(name))}
            error={nameErr}
            helperText={!nameErr ? 'Chỉ chữ cái và dấu gạch ngang' : ''}
          />
        </div>
      </div>
      {/* Preview tên đầy đủ */}
      {fullName && !gradeErr && !nameErr && (
        <p className={styles.classNamePreview}>
          Tên lớp sẽ hiển thị: <strong>{fullName}</strong>
        </p>
      )}
    </Modal>
  );
};


/* ════════════════════════════════════════════════════════════════════════════
   MODAL — Sửa tên lớp
════════════════════════════════════════════════════════════════════════════ */
const EditClassModal = ({ open, cls, onClose }) => {
  const { updateClass } = useUserManagement();
  const toast = useToast();

  const prefixMatch = cls?.name?.match(/^(Lớp(?:.*?) - )/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const initialName = prefixMatch ? cls.name.slice(prefix.length) : (cls?.name ?? '');

  const [name, setName] = useState(initialName);

  const handleSave = () => {
    if (!name.trim()) return;
    const finalName = prefix + capitalizeEachWord(name.trim());
    updateClass(cls.id, { name: finalName });
    toast?.success(`Đã cập nhật tên lớp thành "${finalName}"`);
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
      {name.trim() && (
        <p className={styles.classNamePreview} style={{ marginTop: 'var(--spacing-md)' }}>
          Tên lớp sẽ hiển thị: <strong>{prefix + capitalizeEachWord(name.trim())}</strong>
        </p>
      )}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MODAL — Tạo / Sửa học viên
   v5: Auto-generate username · Realtime validation · Required fields
════════════════════════════════════════════════════════════════════════════ */
const StudentModal = ({ open, student, onClose, classes }) => {
  const { createStudent, updateStudent, students } = useUserManagement();
  const toast = useToast();
  const isEdit = !!student;

  /* ── Form state ── */
  const initForm = () => ({
    username: student?.username ?? '',
    name: student?.name ?? '',
    email: student?.email ?? '',
    phone: student?.phone ?? '',
    password: '',
    classId: student?.classId ?? '',
    isActive: student?.isActive ?? true,
  });

  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Reset form khi modal đóng / mở lại */
  useEffect(() => {
    if (open) {
      setForm(initForm());
      setErrors({});
      setTouched({});
      setShowPw(false);
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── Danh sách username hiện có (để check duplicate) ── */
  const existingUsernames = useMemo(
    () => students.map((s) => s.username).filter(Boolean),
    [students]
  );

  /* ── Auto-generate username khi tên thay đổi (chỉ khi tạo mới) ── */
  const autoUsername = useMemo(() => {
    if (isEdit) return form.username; // sửa thì giữ nguyên
    const base = generateUsernameBase(form.name);
    if (!base) return '';
    return generateUniqueUsername(base, existingUsernames);
  }, [form.name, isEdit, existingUsernames, form.username]);

  /* Sync username vào form khi auto thay đổi */
  useEffect(() => {
    if (!isEdit) {
      setForm((f) => ({ ...f, username: autoUsername }));
    }
  }, [autoUsername, isEdit]);

  /* ── Helpers ── */
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));

  /* Validate 1 field realtime */
  const validateField = (key, value) => {
    let err = '';
    switch (key) {
      case 'name': err = validateFullName(value); break;
      case 'email': err = validateEmail(value); break;
      case 'phone': err = validatePhone(value); break;
      case 'password': err = validatePassword(value, !isEdit); break;
      default: break;
    }
    setErrors((e) => ({ ...e, [key]: err }));
    return err;
  };

  /* onChange handler: update + validate realtime nếu đã touch */
  const handleChange = (key, raw) => {
    let value = raw;

    /* Họ và tên: chặn số + ký tự đặc biệt khi nhập, tự capitalize */
    if (key === 'name') {
      // Chặn số và ký tự đặc biệt (chỉ cho chữ cái Unicode + space)
      value = raw.replace(/[^a-zA-ZÀ-ỹĐđ\s]/g, '');
      // Không cho khoảng trắng đầu
      if (value.startsWith(' ')) value = value.trimStart();
      // Auto-capitalize mỗi từ
      value = capitalizeEachWord(value);
    }

    /* SĐT: chặn mọi ký tự không phải số (chữ, dấu đặc biệt, khoảng trắng) */
    if (key === 'phone') {
      value = raw.replace(/[^0-9]/g, '');
    }

    set(key, value);
    if (touched[key]) validateField(key, value);
  };

  /* onBlur: đánh dấu touched + validate */
  const handleBlur = (key) => {
    touch(key);
    validateField(key, form[key]);
  };

  /* ── Save ── */
  const handleSave = async () => {
    /* Validate tất cả, mark all touched */
    const allTouched = { name: true, email: true, phone: true, password: true };
    setTouched(allTouched);
    const allErrors = validateStudentForm(form, !isEdit);
    setErrors(allErrors);
    if (!isFormValid(allErrors)) return;

    setSaving(true);
    try {
      if (isEdit) {
        await updateStudent(student.id, form);
        toast?.success(`Cập nhật thông tin học viên thành công`);
      } else {
        await createStudent({ ...form, username: autoUsername || form.username });
        toast?.success('Tạo học viên thành công');
      }
      onClose();
    } catch (err) {
      const msg = err?.message ?? 'Đã xảy ra lỗi';
      toast?.error(msg, { title: 'Lỗi' });
    } finally {
      setSaving(false);
    }
  };

  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }));

  /* ── Render ── */
  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={isEdit ? 'Sửa thông tin học viên' : 'Thêm học viên mới'}
      contentClassName={styles.modalWide}
      primaryAction={{
        label: saving ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm học viên'),
        onClick: handleSave,
        disabled: saving,
      }}
      secondaryAction={{ label: 'Hủy' }}
    >
      <div className={styles.formGrid}>
        {/* Username — readonly, auto-generated */}
        <TextField
          label="Username"
          readOnly
          value={isEdit ? form.username : (autoUsername || '—')}
          placeholder="Tự động sinh từ họ tên"
          helperText={!isEdit && form.name.trim() ? undefined : (!isEdit ? 'Nhập họ tên để tự động sinh' : undefined)}
        />

        {/* Họ và tên */}
        <TextField
          label="Họ và tên"
          required
          placeholder="Nguyễn Văn An"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          error={touched.name ? errors.name : ''}
        />

        {/* Email — optional */}
        <TextField
          label="Email"
          type="email"
          placeholder="abc@gmail.com (không bắt buộc)"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : ''}
          helperText={!touched.email || !errors.email ? 'Không bắt buộc' : ''}
        />

        {/* SĐT — bắt buộc */}
        <TextField
          label="Số điện thoại"
          required
          placeholder="VD: 0912 345 678"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          error={touched.phone ? errors.phone : ''}
          helperText={
            touched.phone && errors.phone
              ? '' // đã có error hiện rồi
              : form.phone.length > 0 && form.phone.length < 10
                ? `Đã nhập ${form.phone.length}/10 số`
                : '10 chữ số, bắt đầu 03 • 05 • 07 • 08 • 09'
          }
          maxLength={10}
          inputMode="numeric"
        />

        {/* Mật khẩu */}
        <div className={styles.pwField}>
          <TextField
            label="Mật khẩu"
            required={!isEdit}
            type={showPw ? 'text' : 'password'}
            placeholder={isEdit ? 'Để trống nếu không đổi' : 'Tối thiểu 6 ký tự'}
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            error={touched.password ? errors.password : ''}
          />
          <button
            type="button"
            className={styles.eyeToggle}
            onClick={() => setShowPw((p) => !p)}
            tabIndex={-1}
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {/* Lớp học */}
        <Select
          label="Lớp học"
          placeholder="— Chọn lớp —"
          options={classOptions}
          value={form.classId}
          onChange={(v) => set('classId', v)}
        />
      </div>

      {/* Trạng thái */}
      <div className={styles.activeRow}>
        <span className={styles.activeLabel}>Trạng thái tài khoản</span>
        <button
          type="button"
          className={`${styles.togglePill} ${form.isActive ? styles.togglePillOn : ''}`}
          onClick={() => set('isActive', !form.isActive)}
        >
          {form.isActive
            ? <><ToggleRight size={18} /> Hoạt động</>
            : <><ToggleLeft size={18} /> Vô hiệu hóa</>}
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
  const [pw, setPw] = useState('');
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
            <button onClick={() => { onEdit(); setOpen(false); }}><Pencil size={13} /> Sửa thông tin</button>
            <button onClick={() => { onPassword(); setOpen(false); }}><KeyRound size={13} /> Đặt lại mật khẩu</button>
            <button onClick={() => { onToggle(); setOpen(false); }}>
              {student.isActive
                ? <><ToggleLeft size={13} /> Vô hiệu hóa</>
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const inputRef = useRef(null);
  const triggerRef = useRef(null);

  const selectedLabel = options.find(o => o.value === value)?.label ?? label;

  const filtered = searchable && query.trim()
    ? options.filter(o =>
      o.value === 'all' ||
      removeDiacritics(o.label).includes(removeDiacritics(query))
    )
    : options;

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(o => !o);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClose = () => { setOpen(false); setQuery(''); };

  const isFiltered = value !== 'all';

  return (
    <div className={styles.headerFilterWrap}>
      <div
        ref={triggerRef}
        className={`${styles.headerFilterTrigger} ${isFiltered ? styles.headerFilterActive : ''}`}
        onClick={handleOpen}
      >
        <span className={styles.headerFilterLabel}>{label}</span>
        {isFiltered && <span className={styles.headerFilterDot} />}
        <ChevronDown size={11} className={styles.headerFilterChevron} />
      </div>

      {open && (
        <>
          <div className={styles.headerFilterBackdrop} onClick={handleClose} />
          <div
            className={styles.headerFilterPanel}
            style={{ position: 'fixed', top: panelPos.top, left: panelPos.left }}
          >
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
const REQUIRED_COLS = ['name', 'email'];
const TEMPLATE_HEADERS = ['name', 'email', 'phone', 'password', 'class_code'];

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

const validateRow = (row, idx, rows, existingStudents, classes) => {
  const errors = [];

  // 1. Validate Họ tên
  const nameErr = validateFullName(row.name);
  if (nameErr) errors.push(nameErr);

  // 2. Validate Email — chỉ kiểm tra format, không check trùng
  if (row.email) {
    const emailErr = validateEmail(row.email);
    if (emailErr) errors.push(emailErr);
  }

  // 3. Validate SĐT — check format + check trùng cặp (họ tên + SĐT)
  const phoneErr = validatePhone(row.phone);
  if (phoneErr) errors.push(phoneErr);
  else {
    const normName = (row.name ?? '').trim().toLowerCase();
    const normPhone = (row.phone ?? '').trim();

    // Trùng trong file
    const dupInFile = rows.some((r, i) =>
      i < idx &&
      r.name?.trim().toLowerCase() === normName &&
      r.phone?.trim() === normPhone
    );
    if (dupInFile) errors.push('Trùng họ tên + số điện thoại với dòng khác trong file');

    // Trùng trong hệ thống
    const dupInDb = existingStudents.some(s =>
      s.name?.trim().toLowerCase() === normName &&
      s.phone?.trim() === normPhone
    );
    if (dupInDb) errors.push('Học viên này (họ tên + SĐT) đã tồn tại trong hệ thống');
  }

  // 4. Validate Mật khẩu
  const passErr = validatePassword(row.password, true);
  if (passErr) errors.push(passErr);

  // 5. Validate Mã lớp
  if (row.class_code) {
    const cls = classes.find(c => c.code?.toLowerCase() === row.class_code.toLowerCase());
    if (!cls) errors.push(`Mã lớp "${row.class_code}" không tồn tại`);
  }

  return errors;
};


const ImportModal = ({ open, onClose, classes }) => {
  const { students: existingStudents, bulkCreateStudents } = useUserManagement();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
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

      // 1. Normalize headers & format data
      const normalized = raw.map((rawRow) => {
        const out = {};
        Object.entries(rawRow).forEach(([k, v]) => {
          const field = normalizeHeader(k);
          if (field) out[field] = String(v).trim();
        });
        // Auto-format name
        if (out.name) out.name = capitalizeEachWord(out.name);
        return out;
      });

      // 2. Generate unique usernames
      // Seed set với usernames đã có trong DB
      const tempUsernames = new Set(
        existingStudents.map(s => s.username?.toLowerCase()).filter(Boolean)
      );
      const withUsernames = normalized.map((r) => {
        if (!r.name) return { ...r, username: '' };

        // Nếu file cung cấp username (không rỗng) → dùng username đó,
        // nhưng vẫn đảm bảo unique để tránh va chạm
        const base = (r.username && r.username.trim())
          ? r.username.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
          : generateUsernameBase(r.name);

        // Nếu base vẫn rỗng (tên không sinh được base) → fallback
        const safeBase = base || 'user';
        const unique = generateUniqueUsername(safeBase, [...tempUsernames]);
        tempUsernames.add(unique.toLowerCase());
        return { ...r, username: unique };
      });

      // 3. Validate rows
      const errors = withUsernames.map((r, i) => validateRow(r, i, withUsernames, existingStudents, classes));

      setRows(withUsernames);
      setRowErrors(errors);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    parseFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e) => parseFile(e.target.files[0]);

  const validRows = rows.filter((_, i) => rowErrors[i]?.length === 0);
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
    const data = [
      TEMPLATE_HEADERS,
      ['Nguyễn Văn A', 'a@example.com', '0912345678', '123456', '2026.01.01'],
      ['Trần Thị B', 'b@example.com', '0987654321', '123456', '2026.01.02'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_hoc_vien_ms_giang.xlsx');
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
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [pwStudent, setPwStudent] = useState(null);

  /* ── Selection (bulk delete) ─────────────────────────────────────────── */
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDelOpen, setBulkDelOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  // Reset về trang 1 + bỏ selection khi filter thay đổi
  const handleFilterClass = (v) => { setFilterClass(v); setPage(1); setSelectedIds(new Set()); };
  const handleFilterStatus = (v) => { setFilterStatus(v); setPage(1); setSelectedIds(new Set()); };
  const handleSearch = (v) => { setSearch(v); setPage(1); setSelectedIds(new Set()); };

  const classFilterOptions = [
    { value: 'all', label: 'Tất cả lớp' },
    ...classes.map(c => ({ value: c.id, label: `${c.code} — ${c.name}` })),
  ];
  const statusFilterOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Vô hiệu' },
  ];

  const filtered = useMemo(() => students.filter(s => {
    const q = removeDiacritics(search.trim());
    const matchQ = !q ||
      removeDiacritics(s.name ?? '').includes(q) ||
      removeDiacritics(s.username ?? '').includes(q) ||
      removeDiacritics(s.email ?? '').includes(q) ||
      (s.phone ?? '').includes(q);
    const matchClass = filterClass === 'all' || s.classId === filterClass;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? s.isActive : !s.isActive);
    return matchQ && matchClass && matchStatus;
  }), [students, search, filterClass, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

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

  /* ── Checkbox helpers ─────────────────────────────────────────────────── */
  const pagedIds = paged.map((s) => s.id);
  const allPageChecked = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.has(id));
  const someChecked = pagedIds.some((id) => selectedIds.has(id));

  const toggleOne = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageChecked) {
        pagedIds.forEach((id) => next.delete(id));
      } else {
        pagedIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  /* ── Bulk delete ──────────────────────────────────────────────────────── */
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteStudent(id)));
      toast?.success('Xóa học viên thành công');
      setSelectedIds(new Set());
    } catch (err) {
      toast?.error(err?.message ?? 'Có lỗi khi xóa');
    } finally {
      setBulkDeleting(false);
      setBulkDelOpen(false);
    }
  };

  /** Export danh sách học viên đang hiển thị ra Excel */
  const handleExport = () => {
    if (filtered.length === 0) return;

    const data = filtered.map((s, idx) => {
      const cls = getClass(s.classId);
      return {
        'STT': idx + 1,
        'Username': s.username ?? '',
        'Họ tên': s.name,
        'Email': s.email || '—',
        'Số ĐT': s.phone || '—',
        'Mã lớp': cls?.code || '—',
        'Tên lớp': cls?.name || '—',
        'Trạng thái': s.isActive ? 'Hoạt động' : 'Vô hiệu',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);

    // Tự động căn rộng cột
    const colWidths = Object.keys(data[0] || {}).map((k) => {
      const maxLen = Math.max(
        k.length,
        ...data.map(r => String(r[k] ?? '').length)
      );
      return { wch: maxLen + 2 };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Học viên');
    const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    XLSX.writeFile(wb, `danh_sach_hoc_vien_${dateStr}.xlsx`);
    toast?.success(`Đã xuất ${filtered.length} học viên ra file Excel`);
  };

  return (
    <div className={styles.tabSection}>
      {/* ── Toolbar: search + Import/Export + Add ── */}
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

      {/* ── Bulk action bar (hiện khi có chọn) ── */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkBarCount}>
            Đã chọn <strong>{selectedIds.size}</strong> học viên
          </span>
          <button
            className={styles.bulkDeleteBtn}
            onClick={() => setBulkDelOpen(true)}
          >
            <Trash2 size={14} /> Xóa đã chọn
          </button>
          <button
            className={styles.bulkClearBtn}
            onClick={() => setSelectedIds(new Set())}
          >
            <X size={13} /> Bỏ chọn
          </button>
        </div>
      )}

      {/* Table panel */}
      <div className={styles.tablePanel}>
        {/* Header with inline filters */}
        <div className={`${styles.tableRow} ${styles.tableHeader}`}>
          {/* Checkbox select-all */}
          <div className={styles.checkCell}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={allPageChecked}
              ref={(el) => { if (el) el.indeterminate = someChecked && !allPageChecked; }}
              onChange={toggleAllPage}
              title={allPageChecked ? 'Bỏ chọn tất cả' : 'Chọn tất cả trang này'}
            />
          </div>
          {/* STT */}
          <span className={styles.sttCell}>STT</span>
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
          <span className={styles.headerActionLabel}>Thao tác</span>
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>Không tìm thấy học viên nào.</div>
        )}

        {paged.map((s, i) => {
          const cls = getClass(s.classId);
          const stt = (safePage - 1) * pageSize + i + 1;
          const isChecked = selectedIds.has(s.id);
          return (
            <div
              key={s.id}
              className={`${styles.tableRow} ${isChecked ? styles.tableRowSelected : ''}`}
            >
              {/* Checkbox */}
              <div className={styles.checkCell}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isChecked}
                  onChange={() => toggleOne(s.id)}
                />
              </div>

              {/* STT */}
              <span className={styles.sttCell}>{stt}</span>

              {/* Họ tên */}
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
              const left = Math.max(1, safePage - delta);
              const right = Math.min(totalPages, safePage + delta);
              if (left > 1) { pages.push(1); if (left > 2) pages.push('...'); }
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

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        open={bulkDelOpen}
        onOpenChange={(v) => { if (!v) setBulkDelOpen(false); }}
        title="Xác nhận xóa học viên"
        description={`Bạn có chắc chắn muốn xóa ${selectedIds.size} học viên đã chọn không?`}
        primaryAction={{
          label: bulkDeleting ? 'Đang xóa...' : 'Xác nhận',
          danger: true,
          onClick: handleBulkDelete,
          disabled: bulkDeleting,
        }}
        secondaryAction={{ label: 'Hủy' }}
      >
        <div className={styles.deleteWarning}>
          <Trash2 size={16} />
          <span>
            Thao tác này sẽ xóa <strong>{selectedIds.size} học viên</strong> và{' '}
            <strong>không thể hoàn tác</strong>.
          </span>
        </div>
      </Modal>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   TAB — Quản lý Lớp
════════════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════════
   MODAL — Xác nhận xóa lớp
════════════════════════════════════════════════════════════════════════════ */
const ConfirmDeleteClassModal = ({ open, cls, studentCount, onConfirm, onClose }) => {
  const hasStudents = studentCount > 0;
  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title="Xóa lớp học"
      description={`${cls?.name} · Mã: ${cls?.code}`}
      primaryAction={{
        label: hasStudents ? 'Không thể xóa' : 'Xóa lớp',
        danger: true,
        onClick: hasStudents ? undefined : onConfirm,
        disabled: hasStudents,
      }}
      secondaryAction={{ label: hasStudents ? 'Đóng' : 'Hủy' }}
    >
      {hasStudents ? (
        <div className={styles.deleteWarningBlock}>
          <div className={styles.deleteWarningIcon}>
            <Lock size={20} strokeWidth={2.2} />
          </div>
          <div className={styles.deleteWarningBody}>
            <p className={styles.deleteWarningTitle}>
              Lớp này đang có <strong>{studentCount} học viên</strong>
            </p>
            <p className={styles.deleteWarningDesc}>
              Vui lòng chuyển toàn bộ học viên sang lớp khác trước khi xóa.
            </p>
            <div className={styles.deleteWarningHint}>
              <Zap size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Dùng nút <strong>Chuyển lớp</strong> ở cột thao tác để chuyển nhanh.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.deleteWarning}>
          <Trash2 size={16} />
          <span>
            Lớp này không còn học viên. Xác nhận xóa?{' '}
            Thao tác <strong>không thể hoàn tác</strong>.
          </span>
        </div>
      )}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MODAL — Chuyển lớp hàng loạt
   Business rule: Chuyển TẤT CẢ học viên (bao gồm vô hiệu hóa)
════════════════════════════════════════════════════════════ */
const TransferClassModal = ({ open, sourceCls, allClasses, allStudents, onClose }) => {
  const { bulkTransferClass } = useUserManagement();
  const toast = useToast();

  const [targetClassId, setTargetClassId] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Reset khi mở lại
  useEffect(() => {
    if (open) {
      setTargetClassId('');
      setTransferring(false);
    }
  }, [open]);

  if (!sourceCls) return null;

  // TẤT CẢ học viên trong lớp nguồn (cả hoạt động lẫn vô hiệu hóa)
  const allInClass = allStudents.filter((s) => s.classId === sourceCls.id);
  const activeInClass = allInClass.filter((s) => s.isActive);
  const inactiveInClass = allInClass.filter((s) => !s.isActive);

  // Danh sách lớp đích (loại lớp nguồn)
  const targetOptions = allClasses
    .filter((c) => c.id !== sourceCls.id)
    .map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }));

  const handleTransfer = async () => {
    if (!targetClassId) return;
    if (allInClass.length === 0) {
      toast?.info('Lớp này chưa có học viên nào.');
      return;
    }
    setTransferring(true);
    try {
      const ids = allInClass.map((s) => s.id);
      const count = await bulkTransferClass(ids, targetClassId);
      const target = allClasses.find((c) => c.id === targetClassId);
      toast?.success(
        `Đã chuyển ${count} học viên sang ${target?.code} — ${target?.name}`
      );
      onClose();
    } catch (err) {
      toast?.error(err?.message ?? 'Có lỗi khi chuyển lớp');
    } finally {
      setTransferring(false);
    }
  };

  const canTransfer = !!targetClassId && allInClass.length > 0 && !transferring;

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title="Chuyển lớp hàng loạt"
      description={`Từ lớp: ${sourceCls.code} — ${sourceCls.name}`}
      contentClassName={styles.modalWide}
      primaryAction={{
        label: transferring ? 'Đang chuyển...' : `Chuyển ${allInClass.length} học viên`,
        onClick: handleTransfer,
        disabled: !canTransfer,
      }}
      secondaryAction={{ label: 'Hủy' }}
    >
      {/* Thống kê */}
      <div className={styles.transferStats}>
        <div className={styles.transferStatItem}>
          <span className={styles.transferStatNum} style={{ color: '#10b981' }}>
            {activeInClass.length}
          </span>
          <span className={styles.transferStatLabel}>Hoạt động</span>
        </div>
        <div className={styles.transferStatDivider} />
        <div className={styles.transferStatItem}>
          <span className={styles.transferStatNum} style={{ color: '#9ca3af' }}>
            {inactiveInClass.length}
          </span>
          <span className={styles.transferStatLabel}>Vô hiệu hóa</span>
        </div>
        <div className={styles.transferStatDivider} />
        <div className={styles.transferStatItem}>
          <span className={styles.transferStatNum}>{allInClass.length}</span>
          <span className={styles.transferStatLabel}>Tổng</span>
        </div>
      </div>

      {/* Chọn lớp đích */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <Select
          label="Chuyển sang lớp"
          placeholder="— Chọn lớp đích —"
          options={targetOptions}
          value={targetClassId}
          onChange={setTargetClassId}
        />
      </div>

      {/* Preview */}
      {targetClassId && (
        <div className={styles.transferPreview}>
          <ArrowRightLeft size={14} />
          <span>
            Sẽ chuyển <strong>tất cả {allInClass.length} học viên</strong>
            {inactiveInClass.length > 0 && (
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85em' }}>
                {' '}(bao gồm {inactiveInClass.length} vô hiệu)
              </span>
            )}
            {' '}sang{' '}
            <strong>
              {allClasses.find((c) => c.id === targetClassId)?.code}
            </strong>
          </span>
        </div>
      )}

      {allInClass.length === 0 && (
        <div className={styles.transferEmpty}>
          Lớp này chưa có học viên nào để chuyển.
        </div>
      )}
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SKELETON — loading placeholder rows
════════════════════════════════════════════════════════════════════════════ */
const SkeletonRow = () => (
  <div className={`${styles.classRow} ${styles.classRowData}`} style={{ pointerEvents: 'none' }}>
    <div className={styles.checkCell}><div className={styles.skeletonBox} style={{ width: 14, height: 14, borderRadius: 3 }} /></div>
    <div className={styles.skeletonBox} style={{ width: 20, height: 14, borderRadius: 4 }} />
    <div className={styles.skeletonBox} style={{ width: '85%', height: 14, borderRadius: 4 }} />
    <div className={styles.skeletonBox} style={{ width: '70%', height: 14, borderRadius: 4 }} />
    <div className={styles.skeletonBox} style={{ width: 60, height: 14, borderRadius: 4 }} />
    <div className={styles.skeletonBox} style={{ width: 36, height: 14, borderRadius: 4 }} />
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
      {[1,2,3].map(i => <div key={i} className={styles.skeletonBox} style={{ width: 30, height: 28, borderRadius: 6 }} />)}
    </div>
  </div>
);

const TabClasses = () => {
  const { classes, students, deleteClass, classesLoading } = useUserManagement();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCls, setEditCls] = useState(null);
  const [deleteCls, setDeleteCls] = useState(null);
  const [transferCls, setTransferCls] = useState(null);   // ← NEW

  /* ── Selection (bulk delete) ─────────────────────────────────────────── */
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDelOpen, setBulkDelOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  /* ── Single delete ── */
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

  /* ── Search filter ─────────────────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCode, setFilterCode] = useState('all');
  const [filterName, setFilterName] = useState('all');

  const LS_CLASSES_PAGE_SIZE_KEY = 'hg_classes_page_size';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = parseInt(localStorage.getItem(LS_CLASSES_PAGE_SIZE_KEY), 10);
    return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 20;
  });

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
    localStorage.setItem(LS_CLASSES_PAGE_SIZE_KEY, size);
  };

  const handleFilterCode = (v) => { setFilterCode(v); setPage(1); setSelectedIds(new Set()); };
  const handleFilterName = (v) => { setFilterName(v); setPage(1); setSelectedIds(new Set()); };
  const handleSearch = (v) => { setSearchQuery(v); setPage(1); setSelectedIds(new Set()); };

  // Options cho Mã lớp
  const codeOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả' },
    ...classes.map(c => ({ value: c.id, label: c.code ?? c.id })),
  ], [classes]);

  // Options cho Tên lớp
  const nameOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả' },
    ...classes.map(c => ({ value: c.id, label: c.name })),
  ], [classes]);

  // Danh sách lớp sau khi lọc (search + column filters)
  const filteredClasses = useMemo(() => {
    const q = removeDiacritics(searchQuery.trim());
    return classes.filter(c => {
      const matchCode = filterCode === 'all' || c.id === filterCode;
      const matchName = filterName === 'all' || c.id === filterName;
      const matchSearch = !q ||
        removeDiacritics(c.code ?? '').includes(q) ||
        removeDiacritics(c.name ?? '').includes(q);
      return matchCode && matchName && matchSearch;
    });
  }, [classes, filterCode, filterName, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedClasses = filteredClasses.slice((safePage - 1) * pageSize, safePage * pageSize);

  /* ── Checkbox helpers ── */
  const pagedIds = pagedClasses.map((c) => c.id);
  const allChecked = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.has(id));
  const someChecked = pagedIds.some((id) => selectedIds.has(id));

  const toggleOne = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        pagedIds.forEach((id) => next.delete(id));
      } else {
        pagedIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  /* ── Bulk delete: thống kê học viên + guard ── */
  const bulkSelectedClasses = useMemo(() =>
    classes.filter(c => selectedIds.has(c.id)),
    [classes, selectedIds]
  );

  const bulkStudentCount = useMemo(() =>
    [...selectedIds].reduce(
      (sum, id) => sum + students.filter((s) => s.classId === id).length,
      0
    ), [selectedIds, students]
  );

  // Các lớp TRONG selection còn học viên → không cho xóa
  const bulkBlockedClasses = useMemo(() =>
    bulkSelectedClasses.filter(c =>
      students.some(s => s.classId === c.id)
    ), [bulkSelectedClasses, students]
  );

  const handleBulkDelete = async () => {
    if (bulkBlockedClasses.length > 0) return; // guard
    setBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteClass(id)));
      toast?.success(`Đã xóa ${selectedIds.size} lớp thành công`);
      setSelectedIds(new Set());
    } catch (err) {
      toast?.error(err?.message ?? 'Có lỗi khi xóa lớp');
    } finally {
      setBulkDeleting(false);
      setBulkDelOpen(false);
    }
  };

  /** Export danh sách lớp đang hiển thị ra Excel */
  const handleExport = () => {
    if (filteredClasses.length === 0) return;

    const data = filteredClasses.map((cls, idx) => {
      const studentCount = students.filter((s) => s.classId === cls.id).length;
      return {
        'STT': idx + 1,
        'Mã lớp': cls.code || '—',
        'Tên lớp': cls.name || '—',
        'Số lượng học viên': studentCount,
        'Năm': cls.year || '—',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);

    // Tự động căn rộng cột
    const colWidths = Object.keys(data[0] || {}).map((k) => {
      const maxLen = Math.max(
        k.length,
        ...data.map(r => String(r[k] ?? '').length)
      );
      return { wch: maxLen + 2 };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lớp học');
    const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    XLSX.writeFile(wb, `danh_sach_lop_hoc_${dateStr}.xlsx`);
    toast?.success(`Đã xuất ${filteredClasses.length} lớp ra file Excel`);
  };

  return (
    <div className={styles.tabSection}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Search bar */}
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Tìm mã lớp, tên lớp..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.searchClear} onClick={() => handleSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Export Excel */}
        <button
          className={`${styles.toolbarIconBtn} ${styles.toolbarIconBtnGreen}`}
          onClick={handleExport}
          disabled={filteredClasses.length === 0}
          title={`Xuất ${filteredClasses.length} lớp ra Excel`}
        >
          <Download size={14} /> Export Excel
        </button>

        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Tạo lớp mới
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkBarCount}>
            Đã chọn <strong>{selectedIds.size}</strong> lớp
            {bulkStudentCount > 0 && (
              <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 6 }}>
                ({bulkStudentCount} học viên sẽ bị xóa theo)
              </span>
            )}
          </span>
          <button
            className={styles.bulkDeleteBtn}
            onClick={() => setBulkDelOpen(true)}
          >
            <Trash2 size={14} /> Xóa đã chọn
          </button>
          <button
            className={styles.bulkClearBtn}
            onClick={() => setSelectedIds(new Set())}
          >
            <X size={13} /> Bỏ chọn
          </button>
        </div>
      )}

      {/* Table */}
      <div className={styles.tablePanel}>
        {/* Header */}
        <div className={`${styles.classRow} ${styles.tableHeader}`}>
          <div className={styles.checkCell}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={allChecked}
              ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
              onChange={toggleAll}
              title={allChecked ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            />
          </div>
          <span className={styles.sttCell}>STT</span>
          <HeaderFilter
            label="Mã lớp"
            options={codeOptions}
            value={filterCode}
            onChange={handleFilterCode}
            searchable
          />
          <HeaderFilter
            label="Tên lớp"
            options={nameOptions}
            value={filterName}
            onChange={handleFilterName}
            searchable
          />
          <span>Học viên</span>
          <span>Năm</span>
          <span className={styles.headerActionLabel}>Thao tác</span>
        </div>

        {/* Loading skeleton */}
        {classesLoading && (
          [1,2,3,4,5].map(i => <SkeletonRow key={i} />)
        )}

        {/* Empty state */}
        {!classesLoading && filteredClasses.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <BookOpen size={32} strokeWidth={1.4} />
            </div>
            <p className={styles.emptyStateTitle}>
              {classes.length === 0
                ? 'Chưa có lớp nào'
                : (searchQuery ? `Không tìm thấy lớp nào khớp "${searchQuery}"` : 'Không có lớp nào khớp bộ lọc')}
            </p>
            <p className={styles.emptyStateSub}>
              {classes.length === 0
                ? 'Nhấn "Tạo lớp mới" để bắt đầu.'
                : (searchQuery ? 'Thử từ khóa khác hoặc xóa bộ lọc.' : 'Hãy thay đổi hoặc xóa bộ lọc.')}
            </p>
            {(searchQuery || filterCode !== 'all' || filterName !== 'all') && (
              <button
                className={styles.emptyStateClear}
                onClick={() => { handleSearch(''); handleFilterCode('all'); handleFilterName('all'); }}
              >
                <X size={12} /> Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {pagedClasses.map((cls, i) => {
          const count = students.filter((s) => s.classId === cls.id).length;
          const isChecked = selectedIds.has(cls.id);
          const stt = (safePage - 1) * pageSize + i + 1;
          return (
            <div
              key={cls.id}
              className={`${styles.classRow} ${styles.classRowData} ${isChecked ? styles.tableRowSelected : ''}`}
            >
              {/* Checkbox */}
              <div className={styles.checkCell}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isChecked}
                  onChange={() => toggleOne(cls.id)}
                />
              </div>

              {/* STT */}
              <span className={styles.sttCell}>{stt}</span>

              <span className={styles.cellText}>{cls.code}</span>
              <span className={styles.className}>{cls.name}</span>
              <span className={styles.cellText}>{count} học viên</span>
              <span className={styles.cellText}>{cls.year}</span>

              {/* Actions: icon-only */}
              <div className={styles.rowActions}>
                <button
                  className={styles.rowActionBtn}
                  title="Sửa tên lớp"
                  onClick={() => setEditCls(cls)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className={`${styles.rowActionBtn} ${styles.rowActionTransfer}`}
                  title="Chuyển lớp hàng loạt"
                  onClick={() => setTransferCls(cls)}
                >
                  <ArrowRightLeft size={14} />
                </button>
                <button
                  className={`${styles.rowActionBtn} ${styles.rowActionDelete}`}
                  title="Xóa lớp"
                  onClick={() => setDeleteCls(cls)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination bar ─────────────────────────────────────────────── */}
      {filteredClasses.length > 0 && (
        <div className={styles.paginationBar}>
          {/* Left: info + page size selector */}
          <div className={styles.paginationInfo}>
            <span className={styles.paginationCount}>
              Hiển thị {Math.min((safePage - 1) * pageSize + 1, filteredClasses.length)}–{Math.min(safePage * pageSize, filteredClasses.length)}
              {' '}<span className={styles.paginationTotal}>/ {filteredClasses.length} lớp</span>
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

            {(() => {
              const pages = [];
              const delta = 2;
              const left = Math.max(1, safePage - delta);
              const right = Math.min(totalPages, safePage + delta);
              if (left > 1) { pages.push(1); if (left > 2) pages.push('...'); }
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

      {/* Transfer class modal */}
      {transferCls && (
        <TransferClassModal
          open={!!transferCls}
          sourceCls={transferCls}
          allClasses={classes}
          allStudents={students}
          onClose={() => setTransferCls(null)}
        />
      )}

      {/* Single delete modal */}
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

      {/* Bulk delete modal */}
      <Modal
        open={bulkDelOpen}
        onOpenChange={(v) => { if (!v) setBulkDelOpen(false); }}
        title="Xác nhận xóa lớp"
        description={`Đã chọn ${selectedIds.size} lớp`}
        primaryAction={{
          label: bulkDeleting ? 'Đang xóa...' : 'Xóa lớp trống',
          danger: true,
          onClick: handleBulkDelete,
          disabled: bulkDeleting || bulkBlockedClasses.length > 0,
        }}
        secondaryAction={{ label: 'Hủy' }}
      >
        {/* Blocked: có lớp còn học viên */}
        {bulkBlockedClasses.length > 0 && (
          <div className={styles.deleteWarningBlock}>
            <div className={styles.deleteWarningIcon}>
              <Lock size={20} strokeWidth={2.2} />
            </div>
            <div className={styles.deleteWarningBody}>
              <p className={styles.deleteWarningTitle}>
                <strong>{bulkBlockedClasses.length} lớp</strong> vẫn còn học viên — không thể xóa.
              </p>
              <div className={styles.bulkBlockedList}>
                {bulkBlockedClasses.map(c => {
                  const cnt = students.filter(s => s.classId === c.id).length;
                  return (
                    <span key={c.id} className={styles.bulkBlockedTag}>
                      {c.code} <span className={styles.bulkBlockedTagCount}>({cnt} học viên)</span>
                    </span>
                  );
                })}
              </div>
              <div className={styles.deleteWarningHint}>
                <Zap size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Dùng nút <strong>Chuyển lớp</strong> để chuyển học viên trước, hoặc bỏ chọn các lớp còn học viên.</span>
              </div>
            </div>
          </div>
        )}

        {/* Safe: tất cả lớp trống */}
        {bulkBlockedClasses.length === 0 && (
          <div className={styles.deleteWarning}>
            <Trash2 size={16} />
            <span>
              Sẽ xóa <strong>{selectedIds.size} lớp trống</strong>. Thao tác <strong>không thể hoàn tác</strong>.
            </span>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   PAGE ROOT
════════════════════════════════════════════════════════════════════════════ */
export const AdminUserManagement = () => {
  const { students } = useUserManagement();
  const active = students.filter(s => s.isActive).length;
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
        { value: 'students', label: 'Học viên', icon: <Users size={14} />, content: <TabStudents /> },
        { value: 'classes', label: 'Quản lý Lớp', icon: <BookOpen size={14} />, content: <TabClasses /> },
      ]} />
    </div>
  );
};
