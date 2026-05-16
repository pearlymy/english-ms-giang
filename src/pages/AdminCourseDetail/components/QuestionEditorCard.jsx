/**
 * QuestionEditorCard.jsx
 * Shared component for rendering/editing all 7 question types.
 * Used by both CreateAssignmentDrawer and CreateTestDrawer.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  CheckCircle, AlertTriangle, AlertCircle, ChevronUp, ChevronDown,
  Plus, Volume2, Trash2, ChevronDown as ChevronDownSm,
  Circle, CheckSquare, ToggleLeft, PenLine, FileText, Link2, ArrowUpDown, Headphones,
} from 'lucide-react';
import { OrderingEditor } from './OrderingEditor';
import { isTeacherGradedType } from '../../../data/homeworkData';
import styles from './QuestionEditorCard.module.css';

/* ── Question type registry ── */
export const TYPE_OPTIONS = [
  { value: 'multiple_choice',   label: 'Trắc nghiệm (1 đáp án)',   icon: Circle },
  { value: 'multiple_response', label: 'Trắc nghiệm (nhiều đáp án)', icon: CheckSquare },
  { value: 'true_false',        label: 'Đúng / Sai',                icon: ToggleLeft },
  { value: 'fill_blank',        label: 'Điền vào chỗ trống',        icon: PenLine },
  { value: 'short_answer',      label: 'Viết ngắn (giáo viên chấm)',icon: FileText },
  { value: 'matching',          label: 'Nối đôi',                   icon: Link2 },
  { value: 'ordering',          label: 'Sắp xếp thứ tự',            icon: ArrowUpDown },
  { value: 'listening',         label: 'Nghe hiểu',                 icon: Headphones },
];

/* ── Custom type selector dropdown (supports icons inside options) ── */
const TypeSelector = ({ value, onChange, className }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = TYPE_OPTIONS.find(t => t.value === value) ?? TYPE_OPTIONS[0];
  const IconCurrent = current.icon;

  useEffect(() => {
    const handleOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className={`${styles.typeSelectorWrap} ${className ?? ''}`} ref={ref}>
      <button type="button" className={styles.typeSelectorTrigger} onClick={() => setOpen(o => !o)}>
        <span className={styles.typeSelectorIcon}><IconCurrent size={13} /></span>
        <span className={styles.typeSelectorLabel}>{current.label}</span>
        <ChevronDownSm size={13} className={`${styles.typeSelectorChevron} ${open ? styles.typeSelectorChevronOpen : ''}`} />
      </button>
      {open && (
        <div className={styles.typeSelectorMenu}>
          {TYPE_OPTIONS.map(t => {
            const Icon = t.icon;
            const active = t.value === value;
            return (
              <button
                key={t.value}
                type="button"
                className={`${styles.typeSelectorItem} ${active ? styles.typeSelectorItemActive : ''}`}
                onClick={() => { onChange(t.value); setOpen(false); }}
              >
                <span className={styles.typeSelectorItemIcon}><Icon size={14} /></span>
                <span>{t.label}</span>
                {active && <CheckCircle size={12} className={styles.typeSelectorItemCheck} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
export { TypeSelector };

export const TYPE_LABELS = {
  multiple_choice:   'Trắc nghiệm (1 đáp án)',
  multiple_response: 'Trắc nghiệm (nhiều đáp án)',
  true_false:        'Đúng / Sai',
  fill_blank:        'Điền vào chỗ trống',
  matching:          'Nối đôi',
  ordering:          'Sắp xếp',
  likert:            'Đánh giá',
};

/* ── Answer validity checker ── */
// Các loại câu giáo viên tự chấm — không cần đáp án cố định
const TEACHER_GRADED_TYPES = new Set(['short_answer', 'writing', 'essay', 'text_answer', 'long_answer']);

export const isAnswered = (q, userAnswers) => {
  // Loại tự luận: giáo viên chấm thủ công → luôn hợp lệ
  if (TEACHER_GRADED_TYPES.has(q.type)) return true;

  // Câu nghe hiểu: bắt buộc phải upload audio file
  if (q.type === 'listening') return !!q.audioUrl;

  const ua = userAnswers[q.id];
  const da = q.detectedAnswer;
  const val = ua !== undefined ? ua : da;
  if (val === null || val === undefined || val === '') return false;
  switch (q.type) {
    case 'multiple_response': return Array.isArray(val) && val.length > 0;
    case 'ordering':
      // val có thể là array (từ parser mới) hoặc string (file cũ)
      // cũng fallback sang q.orderItems nếu có
      if (Array.isArray(val) && val.length > 0) return true;
      if (typeof val === 'string' && val.trim()) return true;
      return Array.isArray(q.orderItems) && q.orderItems.length > 0;
    case 'likert': return val !== null && val !== undefined;
    default: return !!val;
  }
};

/* ── Status badge ── */
const StatusBadge = ({ q, userAnswers }) => {
  // Câu nghe hiểu — kiểm tra audio riêng
  if (q.type === 'listening') {
    if (!q.audioUrl) {
      return <span className={`${styles.badge} ${styles.badgeErr}`}><Volume2 size={12} /> Chưa có audio</span>;
    }
    return <span className={`${styles.badge} ${styles.badgeOk}`}><CheckCircle size={12} /> Có audio</span>;
  }

  // Loại giáo viên chấm → hiện badge tím riêng
  if (TEACHER_GRADED_TYPES.has(q.type)) {
    return <span className={`${styles.badge} ${styles.badgeManual}`}>✏️ Giáo viên chấm</span>;
  }

  const answered = isAnswered(q, userAnswers);
  const overridden = userAnswers[q.id] !== undefined;

  if (overridden || (answered && q.status === 'confirmed')) {
    return <span className={`${styles.badge} ${styles.badgeOk}`}><CheckCircle size={12} /> Đã xác nhận</span>;
  }
  if (q.status === 'check') {
    return <span className={`${styles.badge} ${styles.badgeWarn}`}><AlertTriangle size={12} /> Cần kiểm tra</span>;
  }
  if (!answered) {
    return <span className={`${styles.badge} ${styles.badgeErr}`}><AlertCircle size={12} /> Chưa có đáp án</span>;
  }
  return <span className={`${styles.badge} ${styles.badgeOk}`}><CheckCircle size={12} /> OK</span>;
};

/* ══════════════════════════════════════════════════
   Answer Editors per type
══════════════════════════════════════════════════ */

/* Multiple Choice (single) */
const EditorMC = ({ q, value, onChange }) => {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  return (
    <div className={styles.optionGrid}>
      {(q.options ?? []).map((opt, i) => {
        const letter = letters[i];
        return (
          <button key={letter}
            className={`${styles.optBtn} ${value === letter ? styles.optBtnActive : ''}`}
            onClick={() => onChange(value === letter ? '' : letter)}>
            <span className={styles.optLetter}>{letter}</span>
            <span className={styles.optText}>{opt.replace(/^[A-E]\.\s*/, '')}</span>
          </button>
        );
      })}
    </div>
  );
};

/* Multiple Response (many) */
const EditorMR = ({ q, value, onChange }) => {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const selected = Array.isArray(value) ? value : [];
  return (
    <div className={styles.optionGrid}>
      {(q.options ?? []).map((opt, i) => {
        const letter = letters[i];
        const checked = selected.includes(letter);
        return (
          <button key={letter}
            className={`${styles.optBtn} ${styles.optBtnMR} ${checked ? styles.optBtnActive : ''}`}
            onClick={() => {
              const next = checked ? selected.filter(x => x !== letter) : [...selected, letter];
              onChange(next);
            }}>
            <span className={`${styles.checkbox} ${checked ? styles.checkboxActive : ''}`}>
              {checked ? '✓' : ''}
            </span>
            <span className={styles.optText}>{opt.replace(/^[A-E]\.\s*/, '')}</span>
          </button>
        );
      })}
      {selected.length > 0 && (
        <div className={styles.mrSummary}>Đã chọn: <strong>{selected.join(', ')}</strong></div>
      )}
    </div>
  );
};

/* True / False */
const EditorTF = ({ value, onChange }) => (
  <div className={styles.tfRow}>
    {['Đúng', 'Sai'].map(opt => (
      <button key={opt}
        className={`${styles.tfBtn} ${value === opt ? (opt === 'Đúng' ? styles.tfBtnTrue : styles.tfBtnFalse) : ''}`}
        onClick={() => onChange(value === opt ? '' : opt)}>
        {opt === 'Đúng' ? '✓' : '✗'} {opt}
      </button>
    ))}
  </div>
);

/* Fill in the blank */
const EditorFill = ({ value, onChange }) => (
  <input className={styles.fillInput}
    placeholder="Nhập đáp án điền vào chỗ trống..."
    value={value ?? ''}
    onChange={e => onChange(e.target.value)} />
);

/* Matching */
const EditorMatching = ({ q, value, onChange }) => {
  const matchVal = (typeof value === 'object' && !Array.isArray(value) && value !== null) ? value : {};
  const rightItems = (q.pairs ?? []).map(p => p.right);
  return (
    <div className={styles.matchingWrap}>
      {(q.pairs ?? []).map(pair => (
        <div key={pair.left} className={styles.matchRow}>
          <span className={styles.matchLeft}>{pair.left}</span>
          <span className={styles.matchArrow}>→</span>
          <select className={`${styles.matchSelect} ${!matchVal[pair.left] ? styles.matchSelectEmpty : ''}`}
            value={matchVal[pair.left] ?? ''}
            onChange={e => onChange({ ...matchVal, [pair.left]: e.target.value })}>
            <option value="">-- Chọn --</option>
            {rightItems.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
};

/* Ordering — dùng OrderingEditor drag-drop component */
const EditorOrdering = ({ q, value, onChange }) => {
  // items: array các mục (thứ tự = đáp án đúnh)
  // value có thể là array mục đã giáo viên sắp xếp, hoặc fall back về detectedAnswer / orderItems
  const items = Array.isArray(value) && value.length > 0
    ? value
    : Array.isArray(q.orderItems) && q.orderItems.length > 0
      ? [...q.orderItems]
      : Array.isArray(q.detectedAnswer)
        ? [...q.detectedAnswer]
        : ['', '', '', ''];

  return (
    <OrderingEditor
      items={items}
      onChange={onChange}
    />
  );
};

/* Likert */
const EditorLikert = ({ q, value, onChange }) => {
  const scale = q.scale ?? 5;
  const labels = q.labels ?? [];
  return (
    <div className={styles.likertWrap}>
      {Array.from({ length: scale }, (_, i) => i + 1).map(val => (
        <button key={val}
          className={`${styles.likertBtn} ${value === val ? styles.likertBtnActive : ''}`}
          onClick={() => onChange(value === val ? null : val)}>
          <span className={styles.likertNum}>{val}</span>
          {labels[val - 1] && <span className={styles.likertLabel}>{labels[val - 1]}</span>}
        </button>
      ))}
    </div>
  );
};

/* ── Answer editor dispatcher ── */
const AnswerEditor = ({ q, value, onChange }) => {
  switch (q.type) {
    case 'multiple_choice':   return <EditorMC q={q} value={value} onChange={onChange} />;
    case 'multiple_response': return <EditorMR q={q} value={value} onChange={onChange} />;
    case 'true_false':        return <EditorTF value={value} onChange={onChange} />;
    case 'fill_blank':        return <EditorFill value={value} onChange={onChange} />;
    case 'matching':          return <EditorMatching q={q} value={value} onChange={onChange} />;
    case 'ordering':          return <EditorOrdering q={q} value={value} onChange={onChange} />;
    case 'likert':            return <EditorLikert q={q} value={value} onChange={onChange} />;
    case 'listening':         return (q.options && q.options.length > 0) ? <EditorMC q={q} value={value} onChange={onChange} /> : <EditorFill value={value} onChange={onChange} />;
    default:                  return <EditorFill value={value} onChange={onChange} />;
  }
};

/* ── Audio Upload Zone (drag-drop + click) cho câu Listening ── */
const AudioUploadZone = ({ q, onAudioUpload, onAudioRemove }) => {
  const [dragging, setDragging] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkSaved, setLinkSaved] = useState(false);

  const accept = /\.(mp3|wav|m4a|ogg|aac|flac)$/i;

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = Array.from(e.dataTransfer.files).find(f => accept.test(f.name));
    if (file) onAudioUpload(q.id, file);
  }, [q.id, onAudioUpload]);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onAudioUpload(q.id, file);
    e.target.value = '';
  };

  // Auto-save khi có URL hợp lệ
  const autoSaveUrl = (url) => {
    const v = url.trim();
    if (v.length > 5) {
      onAudioUpload(q.id, v);
      setLinkInput('');
      setLinkSaved(true);
      setTimeout(() => setLinkSaved(false), 2500);
    }
  };

  if (q.audioUrl) {
    // Đã có audio — hiện player + nút đổi + nút xóa
    const m = q.audioUrl.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{25,})/);
    const gid = m ? m[1] : null;
    return (
      <div
        className={`${styles.audioSection} ${dragging ? styles.audioSectionDragging : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className={styles.audioResolvedRow}>
          <span className={styles.audioResolvedBadge}>
            {q.audioUrl.startsWith('http') ? '🔗' : '🎵'} {q.audioFile || 'audio'}
          </span>
          <label className={styles.audioChangeBtn}>
            <input type="file" accept=".mp3,.wav,.m4a,.ogg,.aac,.flac"
              style={{ display: 'none' }} onChange={handleChange} />
            ↺ Đổi file
          </label>
          {onAudioRemove && (
            <button
              className={styles.audioRemoveBtn}
              onClick={e => { e.stopPropagation(); onAudioRemove(q.id); setLinkInput(''); }}
              title="Xóa file audio này"
            >
              <Trash2 size={11} /> Xóa
            </button>
          )}
          {dragging && <span className={styles.audioDragHint}>Thả file mới vào đây ↓</span>}
        </div>
        {gid ? (
          <iframe
            src={`https://drive.google.com/file/d/${gid}/preview`}
            width="100%" height="60"
            style={{ border: 'none', borderRadius: 8, display: 'block', marginTop: 6 }}
            allow="autoplay"
          />
        ) : (
          <audio className={styles.audioPlayer} controls src={q.audioUrl} />
        )}
      </div>
    );
  }

  // Chưa có audio — drag-drop zone
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* ── Drag-drop zone ── */}
      <label
        className={`${styles.audioDropCard} ${dragging ? styles.audioDropCardDragging : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".mp3,.wav,.m4a,.ogg,.aac,.flac"
          style={{ display: 'none' }} onChange={handleChange} />
        <span className={styles.audioDropIcon}>🎤</span>
        <div className={styles.audioDropText}>
          {dragging
            ? <strong>Thả file audio vào đây!</strong>
            : <>{q.audioFile
                ? <><strong>Cần: {q.audioFile}</strong><span>Kéo thả hoặc click để chọn</span></>
                : <><strong>Chưa có file audio</strong><span>Kéo thả hoặc click để chọn MP3, WAV...</span></>
              }</>
          }
        </div>
      </label>

      {/* ── Dán link Google Drive / URL — đặt NGOÀI label để tránh trigger file picker ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
          border: `1.5px ${linkSaved ? 'solid #10b981' : 'dashed #c7d2fe'}`,
          borderRadius: 10, padding: '6px 10px',
          background: linkSaved ? '#f0fdf4' : '#f8fafc',
          transition: 'all 0.25s',
        }}>
          <span style={{ fontSize: 13, color: linkSaved ? '#10b981' : '#6366f1', flexShrink: 0 }}>
            {linkSaved ? '✓' : '🔗'}
          </span>
          <input
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: 13, color: '#334155',
            }}
            placeholder={linkSaved ? 'Đã lưu link thành công!' : 'Dán link Google Drive vào đây...'}
            value={linkInput}
            onChange={e => setLinkInput(e.target.value)}
            onPaste={e => {
              const text = e.clipboardData.getData('text').trim();
              if (text) {
                e.preventDefault();
                setLinkInput(text);
                autoSaveUrl(text);
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                autoSaveUrl(linkInput);
              }
            }}
          />
        </div>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); autoSaveUrl(linkInput); }}
          disabled={!linkInput.trim()}
          style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: linkInput.trim() ? '#6366f1' : '#e2e8f0',
            color: linkInput.trim() ? '#fff' : '#94a3b8',
            border: 'none', cursor: linkInput.trim() ? 'pointer' : 'default',
            whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s',
          }}
        >
          Lưu link
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MAIN: QuestionEditorCard
══════════════════════════════════════════════════ */
export const QuestionEditorCard = ({ q, index, userAnswers, onAnswerChange, onTypeChange, userExplanations, onExplanationChange, onAudioUpload, onAudioRemove, onPointsChange, onMoveUp, onMoveDown }) => {
  const [expanded, setExpanded] = useState(true);
  const answered = isAnswered(q, userAnswers);
  const value = userAnswers[q.id] !== undefined ? userAnswers[q.id] : q.detectedAnswer;
  const explValue = userExplanations?.[q.id] ?? q.explanation ?? '';
  const displayNum = index !== undefined ? index + 1 : q.id;

  return (
    <div className={`${styles.card} ${!answered ? styles.cardMissing : q.status === 'check' && userAnswers[q.id] === undefined ? styles.cardWarn : styles.cardOk}`}>
      <div className={styles.cardHeader} onClick={() => setExpanded(e => !e)}>
        <span className={styles.qNum}>Câu {displayNum}</span>
        <p className={styles.qContent}>{q.content}</p>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Điểm - chỉ hiện cho câu giáo viên chấm */}
          {isTeacherGradedType(q) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Điểm:</span>
              <input
                type="number" min="0" step="0.5"
                value={q.points ?? ''}
                placeholder="?"
                onChange={e => onPointsChange?.(q.id, Number(e.target.value))}
                style={{
                  width: 44, padding: '2px 4px', textAlign: 'center', borderRadius: 4,
                  border: `1.5px solid ${(q.points == null || q.points <= 0) ? '#f59e0b' : '#cbd5e1'}`,
                  fontSize: 13,
                  background: (q.points == null || q.points <= 0) ? '#fffbeb' : '#fff',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
              {(q.points == null || q.points <= 0) && (
                <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>⚠ Chưa set</span>
              )}
            </div>
          )}

          <StatusBadge q={q} userAnswers={userAnswers} />
          
          {/* Move Up / Down */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
            {onMoveUp && (
              <button className={styles.moveBtn} onClick={() => onMoveUp(q.id)} title="Di chuyển lên">
                <ChevronUp size={16} />
              </button>
            )}
            {onMoveDown && (
              <button className={styles.moveBtn} onClick={() => onMoveDown(q.id)} title="Di chuyển xuống">
                <ChevronDown size={16} />
              </button>
            )}
          </div>
          
          <span className={styles.expandIcon} style={{ marginLeft: 4 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.cardBody}>
          {/* Type selector */}
          <div className={styles.typeRow}>
            <span className={styles.typeLabel}>Loại câu hỏi:</span>
            <TypeSelector
              value={q.type}
              onChange={v => onTypeChange(q.id, v)}
            />
          </div>

          {/* Detected answer hint */}
          {q.detectedAnswer !== null && q.detectedAnswer !== undefined && (
            <div className={styles.detectedHint}>
              <span>Hệ thống nhận diện: </span>
              <strong>
                {Array.isArray(q.detectedAnswer)
                  ? (typeof q.detectedAnswer[0] === 'object'
                    ? JSON.stringify(q.detectedAnswer)
                    : q.detectedAnswer.join(', '))
                  : String(q.detectedAnswer)}
              </strong>
              {q.confidence && (
                <span className={`${styles.confBadge} ${styles[`conf_${q.confidence}`]}`}>
                  {q.confidence === 'high' ? 'Cao' : q.confidence === 'medium' ? 'Trung bình' : 'Thấp'}
                </span>
              )}
            </div>
          )}

          {/* Answer editor */}
          <div className={styles.editorWrap}>
            {/* Audio upload zone — chỉ hiện cho câu Listening */}
            {q.type === 'listening' && onAudioUpload && (
              <AudioUploadZone q={q} onAudioUpload={onAudioUpload} onAudioRemove={onAudioRemove} />
            )}
            {/* Badge tĩnh khi không có onAudioUpload (read-only mode) */}
            {q.type === 'listening' && !onAudioUpload && q.audioUrl && (
              <audio className={styles.audioPlayer} controls src={q.audioUrl} />
            )}
            <AnswerEditor q={q} value={value} onChange={v => onAnswerChange(q.id, v)} />
          </div>

          {/* Validation message */}
          {!answered && (
            <div className={styles.validationMsg}>
              <AlertCircle size={13} /> Câu hỏi này chưa có đáp án hợp lệ.
            </div>
          )}

          {/* Explanation textarea */}
          <div className={styles.explRow}>
            <label className={styles.explLabel}>💡 Giải thích (tuỳ chọn)</label>
            <textarea
              className={styles.explTextarea}
              placeholder="Nhập giải thích để học sinh hiểu sau khi xem kết quả..."
              rows={2}
              value={explValue}
              onChange={e => onExplanationChange?.(q.id, e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════
   StepCheckAnswers — uses QuestionEditorCard
══════════════════════════════════════════════════ */
export const StepCheckAnswers = ({ questions, userAnswers, onAnswerChange, onTypeChange, userExplanations, onExplanationChange, onAddQuestion, onAudioUpload, onAudioRemove, onPointsChange, onMoveQuestion }) => {
  const missing = questions.filter(q => !isAnswered(q, userAnswers));
  const needsCheck = questions.filter(q => q.status === 'check' && userAnswers[q.id] === undefined);
  // Câu nghe hiểu chưa có audio (tách riêng để message rõ hơn)
  const missingAudio = questions.filter(q => q.type === 'listening' && !q.audioUrl);
  // Câu không phải listening nhưng thiếu đáp án
  const missingAnswer = missing.filter(q => q.type !== 'listening');

  return (
    <div className={styles.stepCheckWrap}>
      {missingAudio.length > 0 && (
        <div className={styles.alertBanner} data-type="error">
          <Volume2 size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>{missingAudio.length} câu Nghe hiểu chưa có audio:</strong>{' '}
            Câu {missingAudio.map(q => q.id).join(', Câu ')}.
            <br />
            <span>Hãy kéo thả hoặc chọn file MP3/WAV trực tiếp vào ô audio của từng câu bên dưới.</span>
          </div>
        </div>
      )}
      {missingAnswer.length > 0 && (
        <div className={styles.alertBanner} data-type="error">
          <AlertCircle size={15} />
          <span><strong>{missingAnswer.length} câu chưa có đáp án:</strong> Câu {missingAnswer.map(q => q.id).join(', Câu ')}</span>
        </div>
      )}
      {/* Cảnh báo câu giáo viên chấm chưa nhập điểm */}
      {(() => {
        const noPoints = questions.filter(q => isTeacherGradedType(q) && (q.points == null || q.points <= 0));
        if (!noPoints.length) return null;
        return (
          <div className={styles.alertBanner} data-type="warning">
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>⚠ {noPoints.length} câu giáo viên chấm chưa có điểm:</strong>
              {' '}Câu {noPoints.map((q, i) => questions.indexOf(q) + 1).join(', Câu ')}.
              <br />
              <span style={{ fontSize: 12 }}>Hãy nhập điểm tối đa cho từng câu — giáo viên sẽ bị giới hạn chấm theo điểm này.</span>
            </div>
          </div>
        );
      })()}
      {needsCheck.length > 0 && (
        <div className={styles.alertBanner} data-type="warning">
          <AlertTriangle size={15} />
          <span><strong>{needsCheck.length} câu cần kiểm tra:</strong> Độ tin cậy thấp/trung bình — hãy xác nhận lại.</span>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.summaryItem} style={{ color: '#10b981' }}>✓ {questions.length - missing.length} xác nhận</span>
        <span className={styles.summaryItem} style={{ color: '#f59e0b' }}>⚠ {needsCheck.length} cần kiểm tra</span>
        <span className={styles.summaryItem} style={{ color: '#ef4444' }}>✗ {missing.length} thiếu (đáp án/audio)</span>
      </div>

      <div className={styles.cardList}>
        {questions.map((q, idx) => (
          <QuestionEditorCard
            key={q.id}
            q={q}
            index={idx}
            userAnswers={userAnswers}
            onAnswerChange={onAnswerChange}
            onTypeChange={onTypeChange}
            userExplanations={userExplanations}
            onExplanationChange={onExplanationChange}
            onAudioUpload={onAudioUpload}
            onAudioRemove={onAudioRemove}
            onPointsChange={onPointsChange}
            onMoveUp={idx > 0 ? () => onMoveQuestion?.(idx, -1) : null}
            onMoveDown={idx < questions.length - 1 ? () => onMoveQuestion?.(idx, 1) : null}
          />
        ))}
      </div>

      {onAddQuestion && (
        <button className={styles.addQuestionBtn} onClick={onAddQuestion}>
          <Plus size={15} /> Thêm câu hỏi
        </button>
      )}
    </div>
  );
};
