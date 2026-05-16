import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTeacher } from '../../../contexts/TeacherContext';
import { useUserManagement } from '../../../contexts/UserManagementContext';
import { capitalizeEachWord } from '../../../utils/validators';
import styles from './CreateCourseModal.module.css';

export const CreateCourseModal = ({ onClose, onSuccess }) => {
  const { createCourse } = useTeacher();
  const { createClass } = useUserManagement();
  
  const [gradeLevel, setGradeLevel] = useState('');
  const [name, setName] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [gradeErr, setGradeErr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tên đầy đủ sẽ lưu: "Lớp {gradeLevel} - {Tên lớp}"
  const fullName = gradeLevel && name.trim()
    ? `Lớp ${gradeLevel} - ${capitalizeEachWord(name.trim())}`
    : '';

  /** Validate khối lớp */
  const validateGrade = (val) => {
    if (!val || !val.trim()) return 'Khối lớp là bắt buộc';
    const n = Number(val);
    if (!Number.isInteger(n) || n < 1 || n > 12) return 'Khối lớp phải là số từ 1 đến 12';
    return '';
  };

  /** Validate tên lớp: chỉ chữ cái (tiếng Việt), khoảng trắng, dấu gạch ngang */
  const validateClassName = (val) => {
    if (!val || !val.trim()) return 'Tên phân loại (nhóm) là bắt buộc';
    if (/\d/.test(val)) return 'Tên không được chứa số';
    if (/[^a-zA-ZÀ-ỹĐđ\s-]/.test(val)) return 'Tên không được chứa ký tự đặc biệt';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const gErr = validateGrade(gradeLevel);
    const nErr = validateClassName(name);
    setGradeErr(gErr);
    setNameErr(nErr);
    
    if (gErr || nErr) return;

    try {
      setIsSubmitting(true);
      
      // 1. Create Course in TeacherContext
      const newCourse = await createCourse({
        name: fullName,
        gradeLevel: Number(gradeLevel),
        classGroup: `Lớp ${gradeLevel}`,
        description: ''
      });
      
      // 2. Sync to Class Management (create linked Class)
      await createClass({
        gradeLevel: Number(gradeLevel),
        name: fullName,
        courseId: newCourse.id
      });
      
      onSuccess?.(newCourse);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Đã có lỗi xảy ra khi tạo khóa học. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tạo khóa học mới</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>Khối lớp (số) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="number"
                min="1"
                max="12"
                className={styles.input}
                style={{ borderColor: gradeErr ? '#ef4444' : undefined }}
                placeholder="VD: 3"
                value={gradeLevel}
                onChange={e => handleGradeChange(e.target.value)}
                onBlur={() => setGradeErr(validateGrade(gradeLevel))}
                disabled={isSubmitting}
                autoFocus
              />
              {gradeErr && <span className={styles.errorText}>{gradeErr}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tên phân loại (Cơ bản / Nâng cao...) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                className={styles.input}
                style={{ borderColor: nameErr ? '#ef4444' : undefined }}
                placeholder="VD: Cơ bản"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                onBlur={() => setNameErr(validateClassName(name))}
                disabled={isSubmitting}
              />
              {nameErr ? (
                <span className={styles.errorText}>{nameErr}</span>
              ) : (
                <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Chỉ chữ cái và dấu gạch ngang</span>
              )}
            </div>
            
            {/* Preview tên đầy đủ */}
            {fullName && !gradeErr && !nameErr && (
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                  Hệ thống sẽ tự động tạo Khóa học & Lớp với tên:<br/>
                  <strong style={{ color: '#0f172a', fontSize: '15px', display: 'block', marginTop: '6px' }}>{fullName}</strong>
                </p>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button 
              type="button" 
              className={styles.btnCancel} 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className={styles.btnSave}
              disabled={isSubmitting || !gradeLevel || !name.trim()}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Tạo khóa học & Lớp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
