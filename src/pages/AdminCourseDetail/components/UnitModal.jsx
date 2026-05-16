/**
 * UnitModal.jsx — Modal dùng chung cho Thêm mới và Chỉnh sửa Unit
 */
import React, { useState, useEffect } from 'react';
import styles from './UnitModal.module.css';
import { X, Trash2, AlertTriangle } from 'lucide-react';

export const UnitModal = ({ open, mode = 'add', unit = null, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (open) {
      setName(unit?.name || '');
      setDesc(unit?.desc || '');
      setNameError('');
    }
  }, [open, unit]);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) { setNameError('Tên Unit không được để trống'); return; }
    onSave({ name: name.trim(), desc: desc.trim() });
  };

  return (
    <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{mode === 'add' ? 'Thêm Unit mới' : 'Chỉnh sửa Unit'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Tên Unit <span className={styles.required}>*</span></label>
            <input
              className={`${styles.input} ${nameError ? styles.inputError : ''}`}
              placeholder="Ví dụ: Unit 5 – At the Park"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(''); }}
              autoFocus
            />
            {nameError && <span className={styles.errorText}>{nameError}</span>}
          </div>


        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerRight}>
            <button className={styles.cancelBtn} onClick={onClose}>Hủy</button>
            <button className={styles.saveBtn} onClick={handleSave}>
              {mode === 'add' ? 'Thêm Unit' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
