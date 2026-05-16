/**
 * OrderingEditor.jsx
 * Drag-and-drop editor cho câu hỏi dạng "Sắp xếp thứ tự".
 *
 * Props:
 *   items      {string[]}  — danh sách mục theo THỨ TỰ ĐÚNG (giáo viên thiết lập)
 *   onChange   {fn}        — callback(newItems) khi thứ tự thay đổi
 *   mode       {'teacher'|'student'|'preview'}
 *              teacher  — giáo viên nhập mục + kéo thả để set thứ tự đúng
 *              student  — học viên kéo thả (items được trộn ngẫu nhiên khi mount)
 *              preview  — giáo viên xem trước học viên thấy gì (items trộn, không onChange)
 */
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import styles from './OrderingEditor.module.css';

/* ── Fisher-Yates shuffle (trả về array mới) ── */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ── Đảm bảo thứ tự trộn KHÁC thứ tự đúng (thử tối đa 5 lần) ── */
const shuffleDistinct = (arr) => {
  if (arr.length <= 1) return arr;
  let result = shuffle(arr);
  let tries = 0;
  while (tries < 5 && result.every((v, i) => v === arr[i])) {
    result = shuffle(arr);
    tries++;
  }
  return result;
};

/* ─── Drag handle icon ─────────────────────────────────────── */
const DragHandle = () => (
  <svg width="14" height="20" viewBox="0 0 14 20" fill="none"
    xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <circle cx="4"  cy="4"  r="1.5" fill="currentColor" />
    <circle cx="4"  cy="10" r="1.5" fill="currentColor" />
    <circle cx="4"  cy="16" r="1.5" fill="currentColor" />
    <circle cx="10" cy="4"  r="1.5" fill="currentColor" />
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="10" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   DraggableList — phần core kéo thả, dùng chung cho cả 3 mode
═══════════════════════════════════════════════════════════ */
const DraggableList = ({ items, onReorder, renderItem }) => {
  const [dragIdx,   setDragIdx]   = useState(null);
  const [overIdx,   setOverIdx]   = useState(null);
  const [dragAbove, setDragAbove] = useState(true);
  const rowRefs = useRef([]);

  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = e.currentTarget.cloneNode(true);
    ghost.style.cssText = 'opacity:0.55;position:absolute;top:-9999px;pointer-events:none';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 24, 16);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    const rect = rowRefs.current[idx]?.getBoundingClientRect();
    if (rect) setDragAbove(e.clientY < rect.top + rect.height / 2);
    setOverIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const target   = (dragAbove || idx <= dragIdx) ? idx : idx + 1;
    const adjusted = dragIdx < target ? target - 1 : target;
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(adjusted, 0, moved);
    onReorder(next);
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div className={styles.itemList}>
      {items.map((item, idx) => {
        const isDragging = dragIdx === idx;
        const isOver     = overIdx === idx && dragIdx !== null && dragIdx !== idx;
        return (
          <div key={idx}
            ref={el => rowRefs.current[idx] = el}
            className={[
              styles.itemRow,
              isDragging               ? styles.itemRowDragging  : '',
              isOver &&  dragAbove     ? styles.itemRowDropAbove : '',
              isOver && !dragAbove     ? styles.itemRowDropBelow : '',
            ].join(' ')}
            draggable
            onDragStart={e => handleDragStart(e, idx)}
            onDragOver={e  => handleDragOver(e, idx)}
            onDragLeave={() => setOverIdx(null)}
            onDrop={e      => handleDrop(e, idx)}
            onDragEnd={()  => { setDragIdx(null); setOverIdx(null); }}
          >
            <span className={styles.handle} title="Kéo để sắp xếp"><DragHandle /></span>
            {renderItem(item, idx)}
          </div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   OrderingEditor — main export
═══════════════════════════════════════════════════════════ */
export const OrderingEditor = ({
  items    = ['', '', '', ''],
  onChange = () => {},
  mode     = 'teacher',   // 'teacher' | 'student' | 'preview'
}) => {
  // Luôn chuẩn hoá items về string[] để tránh crash khi items có null/undefined/number
  const safeItems = useMemo(() =>
    Array.isArray(items)
      ? items.map(x => (x == null ? '' : String(x)))
      : ['', '', '', ''],
  [items]);

  /* ── Dùng useRef để chỉ shuffle 1 lần duy nhất khi mount ── */
  const shuffledInitRef = useRef(null);
  if (shuffledInitRef.current === null) {
    if (mode === 'student') {
      shuffledInitRef.current = [...safeItems];
    } else {
      const valid = safeItems.filter(s => s.trim());
      shuffledInitRef.current = valid.length >= 2 ? shuffleDistinct(valid) : [...safeItems];
    }
  }
  const shuffledInit = shuffledInitRef.current;

  // State riêng cho student mode (học viên kéo thả)
  const [studentItems, setStudentItems] = useState(shuffledInit);

  // Sync lại nếu items từ cha thay đổi (do lấy từ context/value)
  useEffect(() => {
    if (mode === 'student') {
      setStudentItems([...safeItems]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, mode]);

  // Toggle preview trong teacher mode
  const [showPreview, setShowPreview] = useState(false);
  const previewItems = useMemo(
    () => shuffleDistinct(safeItems.filter(s => s.trim())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showPreview]
  );

  const validCount = safeItems.filter(s => s.trim()).length;

  /* ══════════════════════════ TEACHER MODE ══════════════════════════ */
  if (mode === 'teacher') {
    return (
      <div className={styles.editorWrap}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerIcon}>🔢</span>
          <div className={styles.headerText}>
            <strong>Thiết lập thứ tự đúng</strong>
            <span>Nhập các mục · Kéo ⠿ để sắp xếp · Thứ tự = đáp án chuẩn</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className={styles.validCount}>{validCount}/{items.length} mục</span>
            {validCount >= 2 && (
              <button
                className={`${styles.previewToggleBtn} ${showPreview ? styles.previewToggleBtnActive : ''}`}
                onClick={() => setShowPreview(v => !v)}
                title="Xem trước học viên thấy gì"
              >
                👁 {showPreview ? 'Ẩn preview' : 'Học viên thấy gì?'}
              </button>
            )}
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && validCount >= 2 && (
          <div className={styles.previewPanel}>
            <div className={styles.previewPanelHeader}>
              <span>👨‍🎓 Học viên sẽ thấy thứ tự đã trộn:</span>
              <button className={styles.reshuffleBtn} onClick={() => setShowPreview(false) || setTimeout(() => setShowPreview(true), 50)}>
                🔀 Trộn lại
              </button>
            </div>
            <div className={styles.previewPills}>
              {previewItems.map((item, idx) => (
                <span key={idx} className={styles.previewPill}>
                  <span className={styles.previewPillIdx}>{idx + 1}</span>
                  {item}
                </span>
              ))}
            </div>
            <p className={styles.previewNote}>
              ℹ️ Hệ thống tự trộn ngẫu nhiên mỗi lần học viên vào làm bài. Học viên kéo thả để sắp xếp lại.
            </p>
          </div>
        )}

        {/* Draggable list - teacher sets correct order */}
        <DraggableList
          items={safeItems}
          onReorder={onChange}
          renderItem={(item, idx) => (
            <>
              <span className={styles.orderBadge}>{idx + 1}</span>
              <input
                className={styles.itemInput}
                placeholder={`Mục thứ ${idx + 1}...`}
                value={item}
                onChange={e => {
                  const next = [...safeItems];
                  next[idx] = e.target.value;
                  onChange(next);
                }}
              />
              {safeItems.length > 2 && (
                <button
                  className={styles.removeBtn}
                  onClick={() => onChange(safeItems.filter((_, i) => i !== idx))}
                  title="Xoá mục"
                >×</button>
              )}
            </>
          )}
        />

        {/* Add button */}
        <button className={styles.addBtn} onClick={() => onChange([...safeItems, ''])}>
          <span>+</span> Thêm mục
        </button>

        {/* Correct order summary */}
        {validCount >= 2 && (
          <div className={styles.orderSummary}>
            <span className={styles.orderSummaryLabel}>✅ Đáp án chuẩn:</span>
            <div className={styles.orderPills}>
              {safeItems.filter(s => s.trim()).map((item, rank, arr) => (
                <React.Fragment key={rank}>
                  <span className={styles.orderPill}>{item}</span>
                  {rank < arr.length - 1 && <span className={styles.orderArrow}>→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════ STUDENT MODE ══════════════════════════ */
  if (mode === 'student') {
    return (
      <div className={styles.editorWrap} data-mode="student">
        <DraggableList
          items={studentItems}
          onReorder={(next) => {
            setStudentItems(next);
            onChange(next); // trả về thứ tự học viên chọn
          }}
          renderItem={(item, idx) => (
            <>
              <span className={styles.orderBadgeStudent}>{idx + 1}</span>
              <span className={styles.itemText}>{item}</span>
            </>
          )}
        />
      </div>
    );
  }

  /* ══════════════════════════ PREVIEW MODE ══════════════════════════ */
  // mode === 'preview' — chỉ xem, không tương tác
  return (
    <div className={styles.editorWrap} data-mode="preview">
      <div className={styles.header}>
        <span className={styles.headerIcon}>👁</span>
        <div className={styles.headerText}>
          <strong>Preview — Học viên thấy</strong>
          <span>Thứ tự đã được trộn ngẫu nhiên</span>
        </div>
      </div>
      <div className={styles.itemList}>
        {shuffledInit.map((item, idx) => (
          <div key={idx} className={`${styles.itemRow} ${styles.itemRowPreview}`}>
            <span className={styles.orderBadgeStudent}>{idx + 1}</span>
            <span className={styles.itemText}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderingEditor;
