/**
 * CreateAssignmentDrawer.jsx
 * Drawer trượt từ bên phải để tạo bài tập mới.
 * Hỗ trợ 2 mode: Tạo từng câu / Upload file
 * Upload file có 4 bước: Tải file → Trích xuất → Kiểm tra đáp án → Xem trước & Xuất bản
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  X, Upload, CheckCircle, AlertTriangle, AlertCircle,
  ChevronRight, File, RefreshCw, Eye, Send, Plus,
  Edit3, Trash2, RotateCcw, Calendar, Info, Timer, Download, Music, Volume2, ChevronUp, ChevronDown
} from 'lucide-react';
import { StepCheckAnswers, isAnswered, TYPE_OPTIONS } from './QuestionEditorCard';
import { TypeSelector } from './QuestionEditorCard';
import { ListeningQuestionCard, defaultListeningQuestion, isListeningValid } from './ListeningQuestionCard';
import { OrderingEditor } from './OrderingEditor';
import { parseExcelToQuestions } from './excelParser';
import { isTeacherGradedType } from '../../../data/homeworkData';
import styles from './CreateAssignmentDrawer.module.css';

/* ── Mock data: 7 types ── */
const MOCK_EXTRACTED = [
  {
    id: 1, type: 'multiple_choice',
    content: 'What is the English word for "mẹ"?',
    options: ['A. Father', 'B. Mother', 'C. Sister', 'D. Brother'],
    detectedAnswer: 'B', confidence: 'high', status: 'confirmed',
  },
  {
    id: 2, type: 'true_false',
    content: 'True or False: "Mother" means "cha".',
    options: ['\u0110úng', 'Sai'],
    detectedAnswer: 'Sai', confidence: 'high', status: 'confirmed',
  },
  {
    id: 3, type: 'multiple_response',
    content: 'Which of the following ARE family members? (chọn tất cả đáp án đúng)',
    options: ['A. Mother', 'B. Teacher', 'C. Father', 'D. Doctor', 'E. Sister'],
    detectedAnswer: ['A', 'C', 'E'], confidence: 'medium', status: 'check',
  },
  {
    id: 4, type: 'fill_blank',
    content: 'My ___ has two brothers and one sister. (\u0111iền từ còn thiếu)',
    detectedAnswer: 'mother', confidence: 'high', status: 'confirmed',
  },
  {
    id: 5, type: 'matching',
    content: 'Nối từ tiếng Anh với nghĩa tiếng Việt',
    pairs: [
      { left: 'Mother', right: 'Mẹ' },
      { left: 'Father', right: 'Bố/Ba' },
      { left: 'Grandmother', right: 'Bà' },
      { left: 'Grandfather', right: 'Ông' },
    ],
    detectedAnswer: null, confidence: null, status: 'missing',
  },
  {
    id: 6, type: 'ordering',
    content: 'Sắp xếp các từ thành câu hoàn chỉnh',
    items: ['school', 'goes', 'She', 'every', 'to', 'day'],
    detectedAnswer: ['She', 'goes', 'to', 'school', 'every', 'day'],
    confidence: 'low', status: 'check',
  },
  {
    id: 7, type: 'likert',
    content: 'I enjoy learning English vocabulary at home.',
    scale: 5,
    labels: ['Rất không đồng ý', 'Không đồng ý', 'Trung lập', 'Đồng ý', 'Rất đồng ý'],
    detectedAnswer: null, confidence: null, status: 'missing',
  },
];

const TYPE_LABELS = {
  multiple_choice: 'Trắc nghiệm (1 đáp án)',
  multiple_response: 'Trắc nghiệm (nhiều đáp án)',
  true_false: 'Đúng / Sai',
  fill_blank: 'Điền vào chỗ trống',
  matching: 'Nối đôi',
  ordering: 'Sắp xếp',
  likert: 'Đánh giá',
};

const STATUS_CONFIG = {
  confirmed: { label: 'Đã xác nhận', color: 'success', Icon: CheckCircle },
  check: { label: 'Cần kiểm tra', color: 'warning', Icon: AlertTriangle },
  missing: { label: 'Chưa có đáp án', color: 'error', Icon: AlertCircle },
};

/* ── Helpers ── */
const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const ACCEPTED_TYPES = '.pdf,.docx,.xlsx,.png,.jpg,.jpeg';

/* ══════════════════════════════════════════════════════════
   Step Indicator
══════════════════════════════════════════════════════════════ */
const StepIndicator = ({ current }) => {
  const steps = ['Cài đặt & Tải file', 'Trích xuất', 'Kiểm tra đáp án', 'Xem trước & Xuất bản'];
  return (
    <div className={styles.stepBar}>
      {steps.map((label, idx) => {
        const step = idx + 1;
        const done = current > step;
        const active = current === step;
        return (
          <React.Fragment key={step}>
            <div className={`${styles.stepItem} ${active ? styles.stepActive : ''} ${done ? styles.stepDone : ''}`}>
              <div className={styles.stepCircle}>
                {done ? <CheckCircle size={14} /> : <span>{step}</span>}
              </div>
              <span className={styles.stepLabel}>{label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   SettingsPanel — dùng chung cho cả Upload và Manual mode
══════════════════════════════════════════════════════════════ */
const SettingsPanel = ({ settings, onSettings }) => (
  <div className={styles.testSettingsPanel}>
    <h3 className={styles.testSettingsTitle}>⚙️ Cài đặt bài tập</h3>
    <div className={styles.settingsGrid}>

      {/* Hạn nộp bài */}
      <div className={styles.testSettingField}>
        <label className={styles.testSettingLabel}>
          <Calendar size={13} /> Hạn nộp bài
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="date"
            className={styles.deadlineInput}
            value={settings.deadline}
            onChange={e => onSettings(s => ({ ...s, deadline: e.target.value }))}
          />
          {settings.deadline && (
            <button
              className={styles.deadlineClearBtn}
              onClick={() => onSettings(s => ({ ...s, deadline: '' }))}
              title="Xóa hạn nộp"
            >✕</button>
          )}
        </div>
      </div>

      {/* Thời gian làm bài */}
      <div className={styles.testSettingField}>
        <label className={styles.testSettingLabel}><Timer size={13} /> Thời gian làm bài</label>
        <div className={styles.testSettingInputRow}>
          <button className={styles.testStepBtn}
            onClick={() => onSettings(s => ({ ...s, timeLimitMin: Math.max(5, s.timeLimitMin - 5) }))}>
            −
          </button>
          <input type="number" className={styles.testSettingInput} style={{ width: 52 }}
            value={settings.timeLimitMin} min={5} max={180} step={5}
            onChange={e => onSettings(s => ({ ...s, timeLimitMin: Math.max(5, +e.target.value) }))} />
          <button className={styles.testStepBtn}
            onClick={() => onSettings(s => ({ ...s, timeLimitMin: Math.min(180, s.timeLimitMin + 5) }))}>
            +
          </button>
          <span className={styles.testSettingUnit}>phút</span>
        </div>
      </div>

      {/* Số lần làm lại */}
      <div className={styles.testSettingField}>
        <label className={styles.testSettingLabel}><RotateCcw size={13} /> Số lần làm lại</label>
        <div className={styles.testSettingInputRow}>
          <button className={styles.testStepBtn}
            onClick={() => onSettings(s => ({ ...s, attempts: Math.max(1, s.attempts - 1) }))}>
            −
          </button>
          <input type="number" className={styles.testSettingInput}
            value={settings.attempts} min={1} max={10}
            onChange={e => onSettings(s => ({ ...s, attempts: Math.max(1, +e.target.value) }))} />
          <button className={styles.testStepBtn}
            onClick={() => onSettings(s => ({ ...s, attempts: Math.min(10, s.attempts + 1) }))}>
            +
          </button>
          <span className={styles.testSettingUnit}>lần</span>
        </div>
      </div>

      {/* Trộn câu hỏi */}
      <div className={styles.testSettingField}>
        <label className={styles.testSettingLabel}>🔀 Trộn câu hỏi ngẫu nhiên</label>
        <div className={styles.testToggleRow}>
          {['Bật', 'Tắt'].map(opt => (
            <button key={opt}
              className={`${styles.testToggleBtn} ${settings.shuffle === opt ? styles.testToggleBtnActive : ''}`}
              onClick={() => onSettings(s => ({ ...s, shuffle: opt }))}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Hiển thị đáp án — mô tả cố định */}
      <div className={styles.testSettingField} style={{ gridColumn: '1 / -1' }}>
        <label className={styles.testSettingLabel}>
          <Info size={13} /> Hiển thị đáp án sau khi nộp
        </label>
        <div className={styles.showAnswerInfo}>
          <span className={styles.showAnswerBadge}>Tự động</span>
          Đáp án được mở khi học sinh đạt <strong>≥ 9 điểm</strong> hoặc đã <strong>dùng hết {settings.attempts} lần</strong> làm bài.
        </div>
      </div>

    </div>
  </div>
);

const StepUpload = ({ file, onFile, settings, onSettings, title, onTitle, titleErr }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0]; if (f) onFile(f);
  }, [onFile]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Settings panel */}
      <SettingsPanel settings={settings} onSettings={onSettings} />

      {/* Ten bai tap */}
      <div className={styles.manualTitleSection}>
        <label className={styles.manualLabel}>
          Tên bài tập <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          className={`${styles.previewTitleInput} ${titleErr ? styles.inputError : ''}`}
          placeholder="Ví dụ: Vocabulary – Unit 1 · My Family"
          value={title}
          onChange={e => onTitle(e.target.value)}
        />
        {titleErr && (
          <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
            {titleErr}
          </span>
        )}
      </div>

      {/* Upload zone */}
      {file ? (
        <div className={styles.uploadedFile}>
          <div className={styles.uploadedIcon}><File size={32} /></div>
          <div className={styles.uploadedInfo}>
            <p className={styles.uploadedName}>{file.name}</p>
            <p className={styles.uploadedSize}>{formatBytes(file.size)}</p>
          </div>
          <button className={styles.changeFileBtn} onClick={() => onFile(null)}>
            <RefreshCw size={14} /> Thay đổi file
          </button>
        </div>
      ) : (
        <div className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop} onClick={() => inputRef.current?.click()}>
          <input ref={inputRef} type="file" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
            style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          <div className={styles.dropZoneIcon}><Upload size={36} /></div>
          <p className={styles.dropZoneTitle}>Kéo thả file đề bài vào đây</p>
          <p className={styles.dropZoneSub}>hoặc</p>
          <button className={styles.chooseFileBtn} onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>Chọn file</button>
          <p className={styles.dropZoneHint}>Hỗ trợ: PDF, DOCX, XLSX, PNG, JPG (tối đa 20MB)</p>
        </div>
      )}

      {/* Ghi chú nhỏ: file audio sẽ upload ở Bước 3 */}
      {file?.name?.toLowerCase().endsWith('.xlsx') && (
        <div className={styles.audioStepHint}>
          <Music size={14} />
          <span>Câu <strong>Listening</strong> — upload audio trực tiếp ở <strong>Bước 3 · Kiểm tra đáp án</strong></span>
        </div>
      )}

      {/* Sample file download */}
      <div className={styles.sampleFileRow}>
        <span className={styles.sampleFileText}>Chưa có file đề bài?</span>
        <a
          href="/english-ms-giang/mau-bai-tap.xlsx"
          download="mau-bai-tap.xlsx"
          className={styles.sampleFileLink}
          onClick={e => e.stopPropagation()}
        >
          <Download size={13} /> Tải file mẫu (.xlsx)
        </a>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Bước 2 — Trích xuất (Loading)
══════════════════════════════════════════════════════════════ */
const StepExtracting = ({ file }) => {
  const isExcel = file?.name?.toLowerCase().endsWith('.xlsx');
  const items = isExcel
    ? ['Đọc file Excel', 'Validate từng dòng', 'Nhận diện loại câu hỏi']
    : ['Tách câu hỏi theo số thứ tự', 'Nhận diện đáp án tự động', 'Phân loại loại câu hỏi'];
  return (
    <div className={styles.extractingWrap}>
      <div className={styles.extractingSpinner} />
      <p className={styles.extractingTitle}>
        {isExcel ? 'Đang đọc file Excel...' : 'Đang trích xuất câu hỏi...'}
      </p>
      <p className={styles.extractingSub}>Hệ thống đang phân tích "<strong>{file?.name}</strong>"</p>
      <div className={styles.extractChecklist}>
        {items.map((item, i) => (
          <div key={i} className={styles.extractCheckItem}>
            <div className={styles.extractCheckDot} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* StepCheckAnswers is imported from QuestionEditorCard */

/* ══════════════════════════════════════════════════════════
   Bước 4 — Xem trước & Xuất bản
══════════════════════════════════════════════════════════════ */
const StepPreview = ({ questions, userAnswers, userExplanations, assignmentTitle, onTitleChange }) => {
  // Dùng isAnswered để cover cả câu Listening (cần audio) lẫn câu thường (cần đáp án)
  const missing = questions.filter(q => !isAnswered(q, userAnswers));
  const missingAudio = questions.filter(q => q.type === 'listening' && !q.audioUrl);
  const noPoints = questions.filter(q => isTeacherGradedType(q) && (!q.points || q.points <= 0));
  const canPublish = missing.length === 0 && noPoints.length === 0;

  return (
    <div className={styles.previewWrap}>
      <div className={styles.previewHeader}>
        <label className={styles.previewLabel}>Tên bài tập</label>
        <input
          className={styles.previewTitleInput}
          value={assignmentTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Nhập tên bài tập..."
        />
      </div>

      {!canPublish && missingAudio.length > 0 && (
        <div className={styles.alertBanner} data-type="error">
          <Volume2 size={16} />
          <div>
            <strong>Chưa thể xuất bản:</strong> Còn {missingAudio.length} câu Nghe hiểu chưa có audio (Câu {missingAudio.map(q => q.id).join(', Câu ')}).
            <br /><span>Hãy quay lại Bước 3 để upload file audio, hoặc chọn "Lưu nháp".</span>
          </div>
        </div>
      )}
      {!canPublish && missing.filter(q => q.type !== 'listening').length > 0 && (
        <div className={styles.alertBanner} data-type="error">
          <AlertCircle size={16} />
          <div>
            <strong>Không thể xuất bản:</strong> Còn {missing.filter(q => q.type !== 'listening').length} câu chưa có đáp án (Câu {missing.filter(q => q.type !== 'listening').map(q => q.id).join(', Câu ')}).
            <br /><span>Hãy quay lại Bước 3 để bổ sung đáp án, hoặc chọn "Lưu nháp".</span>
          </div>
        </div>
      )}
      {/* Cảnh báo câu giáo viên chấm chưa có điểm */}
      {(() => {
        const noPoints = questions.filter(q => isTeacherGradedType(q) && (q.points == null || q.points <= 0));
        if (!noPoints.length) return null;
        return (
          <div className={styles.alertBanner} data-type="warning">
            <AlertTriangle size={16} />
            <div>
              <strong>⚠ {noPoints.length} câu giáo viên chấm chưa có điểm tối đa:</strong>
              {' '}Câu {noPoints.map(q => questions.indexOf(q) + 1).join(', Câu ')}.
              <br />
              <span>Hãy quay lại Bước 3, nhấn vào câu đó và nhập điểm tối đa — giáo viên sẽ không thể chấm quá điểm này.</span>
            </div>
          </div>
        );
      })()}

      <div className={styles.previewStats}>
        <div className={styles.previewStat}>
          <span className={styles.previewStatNum}>{questions.length}</span>
          <span className={styles.previewStatLabel}>Câu hỏi</span>
        </div>
        <div className={styles.previewStat}>
          <span className={styles.previewStatNum} style={{ color: '#10b981' }}>
            {questions.length - missing.length}
          </span>
          <span className={styles.previewStatLabel}>Hoàn chỉnh</span>
        </div>
        <div className={styles.previewStat}>
          <span className={styles.previewStatNum} style={{ color: missing.length > 0 ? '#ef4444' : '#10b981' }}>
            {missing.length}
          </span>
          <span className={styles.previewStatLabel}>Thiếu</span>
        </div>
      </div>

      <div className={styles.previewQuestions}>
        {questions.map((q, idx) => {
          const ok = isAnswered(q, userAnswers);
          const isMissing = !ok;
          return (
            <div key={q.id} className={`${styles.previewQuestion} ${isMissing ? styles.previewQuestionMissing : ''}`}>
              <div className={styles.previewQNum}>
                {isMissing
                  ? <AlertCircle size={14} color="#ef4444" />
                  : <CheckCircle size={14} color="#10b981" />}
                <span>Câu {q.id}</span>
                {/* Badge loại câu — đặc biệt hiện trạng thái audio với Listening */}
                {q.type === 'listening' && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                    background: q.audioUrl ? '#d1fae5' : '#fee2e2',
                    color: q.audioUrl ? '#065f46' : '#991b1b',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    {q.audioUrl ? '🎤 Có audio' : '🎤 Chưa có audio'}
                  </span>
                )}
              </div>
              <p className={styles.previewQContent}>{q.content}</p>
              {/* Audio player cho câu Listening trong Preview */}
              {q.type === 'listening' && q.audioUrl && (() => {
                const gid = q.audioUrl.match(/\/d\/([a-zA-Z0-9_-]{25,})/)?.[1];
                return gid ? (
                  <div style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid #e0e7ff' }}>
                    <iframe
                      src={`https://drive.google.com/file/d/${gid}/preview`}
                      width="100%" height="60"
                      style={{ border: 'none', display: 'block' }}
                      allow="autoplay"
                    />
                  </div>
                ) : (
                  <audio controls src={q.audioUrl} style={{ width: '100%', display: 'block', marginBottom: 8, accentColor: '#6366f1' }} />
                );
              })()}
              {q.options && (
                <div className={styles.previewOptions}>
                  {q.options.map((opt) => {
                    const answer = userAnswers[q.id] ?? q.detectedAnswer;
                    return (
                      <div
                        key={opt}
                        className={`${styles.previewOption} ${answer === opt.charAt(0) || answer === opt ? styles.previewOptionCorrect : ''}`}
                      >
                        {opt}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className={styles.previewAnswer} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {q.type === 'listening' && (
                  q.audioUrl
                    ? <span className={styles.previewAnswerGreen}>✓ Audio đã được upload</span>
                    : <span className={styles.previewAnswerRed}>✗ Chưa upload file audio</span>
                )}
                {q.subQuestions && q.subQuestions.length > 0 ? (
                  <div style={{ marginTop: 4, paddingLeft: 12, borderLeft: '2px solid #e2e8f0' }}>
                    {q.subQuestions.map((sq, i) => (
                      <div key={sq.id || i} style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{i + 1}. {sq.content}</div>
                        <div style={{ fontSize: 13, color: '#10b981' }}>✓ Đáp án: {sq.answer}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  (() => {
                    const answer = userAnswers[q.id] ?? q.detectedAnswer;
                    if (q.type === 'listening' && answer === '✓') return null; // ✓ là dummy answer của manual mode
                    return answer
                      ? <span className={styles.previewAnswerGreen}>✓ Đáp án: {Array.isArray(answer) ? answer.join(', ') : String(answer)}</span>
                      : (q.type !== 'listening' && <span className={styles.previewAnswerRed}>✗ Chưa có đáp án</span>);
                  })()
                )}
              </div>
              {/* Explanation preview */}
              {(() => {
                const expl = userExplanations?.[q.id] ?? q.explanation;
                return expl ? (
                  <div className={styles.previewExplanation}>
                    <span className={styles.previewExplIcon}>💡</span>
                    <span>{expl}</span>
                  </div>
                ) : null;
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};


/* ══════════════════════════════════════════════════════════
   ManualMode — Tạo bài tập thủ công từng câu
══════════════════════════════════════════════════════════════ */
// Các loại câu giáo viên chấm thủ công — chỉ cần có nội dung
const TEACHER_GRADED = new Set(['short_answer', 'matching']);

const isQValid = (q) => {
  if (q.type === 'listening') {
    return (q.subQuestions?.length ?? 0) > 0 &&
      q.subQuestions.some(sq => sq.content.trim());
  }
  if (!q.content?.trim()) return false;
  if (TEACHER_GRADED.has(q.type)) {
    // Phải có điểm > 0 mới cho phép xuất bản
    if (!q.points || q.points <= 0) return false;
    if (q.type === 'matching') {
      return (q.pairs ?? []).some(p => p.left?.trim() && p.right?.trim());
    }
    return true;
  }
  if (q.type === 'multiple_choice') return q.optA && q.optB && !!q.answer;
  if (q.type === 'multiple_response') {
    // Cần ít nhất 2 ục chọn và ít nhất 1 đáp án đúnh
    const opts = [q.optA, q.optB, q.optC, q.optD].filter(Boolean);
    const checked = (q.answers ?? []).length;
    return opts.length >= 2 && checked >= 1;
  }
  if (q.type === 'true_false') return !!q.answer;
  if (q.type === 'fill_in') return !!q.answer?.trim();
  if (q.type === 'ordering') {
    // Cần ít nhất 2 mục để sắp xếp
    const items = (q.orderItems ?? []).filter(s => s.trim());
    return items.length >= 2;
  }
  return !!q.answer;
};

const defaultQuestion = (id) => ({
  id, type: 'multiple_choice',
  content: '', optA: '', optB: '', optC: '', optD: '',
  answer: '', explanation: ''
});

/* TYPE_OPTIONS imported from QuestionEditorCard — no local definition needed */

const ManualMode = ({ onSave, onClose, settings, onSettings, label }) => {
  const [questions, setQuestions] = useState([defaultQuestion(1)]);
  const [title, setTitle] = useState('');
  const [titleErr, setTitleErr] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const addQuestion = () => {
    setQuestions(prev => [...prev, defaultQuestion(prev.length + 1)]);
  };

  const updateQ = (id, field, value) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const removeQ = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, id: i + 1 })));
  };

  const moveQ = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    setQuestions(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next.map((q, i) => ({ ...q, id: i + 1 }));
    });
  };

  const handlePreview = () => {
    if (!title.trim()) { setTitleErr('Vui lòng nhập tên bài tập'); return; }
    setPreviewMode(true);
  };

  const handleSave = (status) => {
    if (!title.trim()) { setTitleErr('Vui lòng nhập tên bài tập'); return; }
    onSave?.({ title, questions, settings, status });
  };

  const missingCount = questions.filter(q => !isQValid(q)).length;
  const canPublish = questions.length > 0 && missingCount === 0 && !!title.trim();

  // When user changes question type, re-init fields
  const handleTypeChange = (id, newType) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      if (newType === 'listening') return defaultListeningQuestion(id);
      if (newType === 'multiple_response') return {
        id, type: newType, content: '',
        optA: '', optB: '', optC: '', optD: '',
        answers: [],  // array of selected letters
        explanation: ''
      };
      if (newType === 'ordering') return {
        id, type: newType, content: '',
        orderItems: ['', '', '', ''], // 4 items by default
        explanation: ''
      };
      return { id, type: newType, content: '', optA: '', optB: '', optC: '', optD: '', answer: '', explanation: '' };
    }));
  };

  // Convert ManualMode questions → StepPreview-compatible format
  const toPreviewQuestions = () => questions.map(q => ({
    id: q.id,
    type: q.type,
    content: q.type === 'listening' ? `[Listening] ${q.subQuestions?.length || 0} câu hỏi` : q.content,
    options: (q.type === 'multiple_choice' || (q.type === 'listening' && q.optA))
      ? ['A', 'B', 'C', 'D'].map(l => `${l}. ${q[`opt${l}`]}`).filter(o => o.trim().length > 2)
      : q.type === 'true_false' ? ['Đúng', 'Sai'] : [],
    detectedAnswer: q.type === 'listening'
      ? (isListeningValid(q) ? '✓' : null)
      : (q.answer || null),
    explanation: q.explanation,
    subQuestions: q.subQuestions,
  }));

  /* ─────────────── Preview Mode ─────────────── */
  if (previewMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}>
        <div className={styles.drawerBody} style={{ flex: 1, overflowY: 'auto' }}>
          <StepPreview
            questions={toPreviewQuestions()}
            userAnswers={{}}
            userExplanations={{}}
            assignmentTitle={title}
            onTitleChange={setTitle}
          />
        </div>
        <div className={styles.drawerFooter}>
          <button className={styles.footerBtnSecondary} onClick={() => setPreviewMode(false)}>
            ← Quay lại
          </button>
          <div className={styles.footerRight}>
            <button
              className={`${styles.footerBtnPublish} ${!canPublish ? styles.footerBtnDisabled : ''}`}
              onClick={() => handleSave('published')}
              disabled={!canPublish}
              title={!canPublish ? `Còn ${missingCount} câu chưa hợp lệ` : ''}
            >
              <Send size={15} /> Tạo bài tập
              {!canPublish && missingCount > 0 && <span className={styles.missingBadge}>{missingCount}</span>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────── Edit Mode ─────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}>
      <div className={styles.drawerBody} style={{ flex: 1, overflowY: 'auto' }}>
        {/* Settings */}
        <SettingsPanel settings={settings} onSettings={onSettings} />

        {/* Assignment name */}
        <div className={styles.manualTitleSection} style={{ marginTop: 16 }}>
          <label className={styles.manualLabel}>Tên bài tập <span style={{ color: '#ef4444' }}>*</span></label>
          <input className={`${styles.previewTitleInput} ${titleErr ? styles.inputError : ''}`}
            placeholder="Ví dụ: Vocabulary – Family Members"
            value={title} onChange={e => { setTitle(e.target.value); setTitleErr(''); }} />
          {titleErr && <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>{titleErr}</span>}
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          {questions.map((q, idx) => (
            <div key={q.id}>
              {/* Type selector header — shown for all question types */}
              {q.type !== 'listening' && (
                <div className={styles.manualQCard}>
                  <div className={styles.manualQHeader}>
                    <span className={styles.manualQNum}>Câu {idx + 1}</span>
                    <TypeSelector
                      value={q.type}
                      onChange={v => handleTypeChange(q.id, v)}
                    />
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Điểm - chỉ hiện cho câu giáo viên chấm */}
                      {isTeacherGradedType(q) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>Điểm:</span>
                          <input 
                            type="number" min="0" step="0.5" 
                            value={q.points ?? 1} 
                            onChange={e => updateQ(q.id, 'points', Number(e.target.value))}
                            style={{ width: 44, padding: '2px 4px', textAlign: 'center', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                          />
                        </div>
                      )}
                      
                      {/* Move Up / Down */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {idx > 0 && (
                          <button className={styles.manualQMoveBtn} onClick={() => moveQ(idx, -1)} title="Di chuyển lên">
                            <ChevronUp size={16} />
                          </button>
                        )}
                        {idx < questions.length - 1 && (
                          <button className={styles.manualQMoveBtn} onClick={() => moveQ(idx, 1)} title="Di chuyển xuống">
                            <ChevronDown size={16} />
                          </button>
                        )}
                      </div>

                      {questions.length > 1 && (
                        <button className={styles.manualQRemoveBtn} onClick={() => removeQ(q.id)} title="Xóa câu hỏi">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea className={styles.manualQContent}
                    placeholder="Nội dung câu hỏi..."
                    value={q.content} rows={2}
                    onChange={e => updateQ(q.id, 'content', e.target.value)} />

                  {q.type === 'multiple_choice' && (
                    <div className={styles.manualQOptions}>
                      {['A', 'B', 'C', 'D'].map(letter => (
                        <div key={letter} className={styles.manualQOptionRow}>
                          <span className={styles.manualQOptionLabel}>{letter}.</span>
                          <input className={styles.manualQOptionInput}
                            placeholder={`Lựa chọn ${letter}...`}
                            value={q[`opt${letter}`]}
                            onChange={e => updateQ(q.id, `opt${letter}`, e.target.value)} />
                        </div>
                      ))}
                      <div className={styles.manualQAnswerRow}>
                        <span className={styles.manualQAnswerLabel}>Đáp án đúng:</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {['A', 'B', 'C', 'D'].map(l => (
                            <button key={l} className={`${styles.manualAnswerBtn} ${q.answer === l ? styles.manualAnswerBtnActive : ''}`}
                              onClick={() => updateQ(q.id, 'answer', l)}>{l}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className={styles.manualQAnswerRow}>
                      <span className={styles.manualQAnswerLabel}>Đáp án đúng:</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['Đúng', 'Sai'].map(l => (
                          <button key={l} className={`${styles.manualAnswerBtn} ${q.answer === l ? styles.manualAnswerBtnActive : ''}`}
                            onClick={() => updateQ(q.id, 'answer', l)}>{l}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.type === 'short_answer' && (
                    <div className={styles.manualQAnswerRow}>
                      <span className={styles.manualQAnswerLabel}>Đáp án mẫu:</span>
                      <input className={styles.manualQOptionInput} style={{ flex: 1 }}
                        placeholder="Nhập đáp án mẫu..."
                        value={q.answer} onChange={e => updateQ(q.id, 'answer', e.target.value)} />
                    </div>
                  )}

                  {q.type === 'multiple_response' && (
                    <div className={styles.manualQOptions}>
                      <div className={styles.mrHint}>
                        ☑️ Chọn tất cả đáp án đúnh (có thể nhiều hơn 1)
                      </div>
                      {['A', 'B', 'C', 'D'].map(letter => (
                        <div key={letter} className={styles.manualQOptionRow}>
                          {/* Checkbox toggle */}
                          <button
                            className={`${styles.mrCheckbox} ${(q.answers ?? []).includes(letter) ? styles.mrCheckboxActive : ''
                              }`}
                            onClick={() => {
                              const cur = q.answers ?? [];
                              const next = cur.includes(letter)
                                ? cur.filter(l => l !== letter)
                                : [...cur, letter].sort();
                              updateQ(q.id, 'answers', next);
                            }}
                          >
                            {(q.answers ?? []).includes(letter) ? '✓' : letter}
                          </button>
                          <input className={styles.manualQOptionInput}
                            placeholder={`Lựa chọn ${letter}...`}
                            value={q[`opt${letter}`]}
                            onChange={e => updateQ(q.id, `opt${letter}`, e.target.value)} />
                        </div>
                      ))}
                      {(q.answers ?? []).length > 0 && (
                        <div className={styles.mrSelected}>
                          Đáp án đúnh: <strong>{(q.answers ?? []).join(', ')}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === 'ordering' && (
                    <OrderingEditor
                      items={q.orderItems ?? ['', '', '', '']}
                      onChange={newItems => updateQ(q.id, 'orderItems', newItems)}
                    />
                  )}

                  {q.type === 'matching' && (
                    <div style={{ marginTop: 8 }}>
                      <span className={styles.manualQAnswerLabel} style={{ display: 'block', marginBottom: 8 }}>
                        🔗 Các cặp nối đôi:
                      </span>
                      {(q.pairs ?? [{ left: '', right: '' }]).map((pair, pIdx) => (
                        <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <input
                            className={styles.manualQOptionInput}
                            placeholder={`Bên trái ${pIdx + 1}...`}
                            value={pair.left}
                            onChange={e => {
                              const newPairs = [...(q.pairs ?? [])];
                              newPairs[pIdx] = { ...pair, left: e.target.value };
                              updateQ(q.id, 'pairs', newPairs);
                            }}
                          />
                          <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 16 }}>→</span>
                          <input
                            className={styles.manualQOptionInput}
                            placeholder={`Bên phải ${pIdx + 1}...`}
                            value={pair.right}
                            onChange={e => {
                              const newPairs = [...(q.pairs ?? [])];
                              newPairs[pIdx] = { ...pair, right: e.target.value };
                              updateQ(q.id, 'pairs', newPairs);
                            }}
                          />
                          {(q.pairs ?? []).length > 1 && (
                            <button
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
                              onClick={() => {
                                const newPairs = (q.pairs ?? []).filter((_, i) => i !== pIdx);
                                updateQ(q.id, 'pairs', newPairs);
                              }}
                            >✕</button>
                          )}
                        </div>
                      ))}
                      <button
                        style={{
                          marginTop: 4, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                          background: '#eef2ff', border: '1.5px dashed #a5b4fc', borderRadius: 8,
                          color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                        }}
                        onClick={() => updateQ(q.id, 'pairs', [...(q.pairs ?? []), { left: '', right: '' }])}
                      >
                        + Thêm cặp
                      </button>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className={styles.manualExplRow}>
                    <label className={styles.manualExplLabel}>💡 Giải thích (tuỳ chọn)</label>
                    <textarea
                      className={styles.manualExplInput}
                      placeholder="Nhập giải thích để học sinh hiểu sau khi xem kết quả..."
                      rows={2}
                      value={q.explanation}
                      onChange={e => updateQ(q.id, 'explanation', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Listening type — full card with type switcher header */}
              {q.type === 'listening' && (
                <div>
                  {/* Mini header for type switcher + remove */}
                  <div className={styles.manualQHeader} style={{ marginBottom: 8 }}>
                    <span className={styles.manualQNum}>Câu {idx + 1}</span>
                    <TypeSelector
                      value={q.type}
                      onChange={v => handleTypeChange(q.id, v)}
                    />
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Move Up / Down */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {idx > 0 && (
                          <button className={styles.manualQMoveBtn} onClick={() => moveQ(idx, -1)} title="Di chuyển lên">
                            <ChevronUp size={16} />
                          </button>
                        )}
                        {idx < questions.length - 1 && (
                          <button className={styles.manualQMoveBtn} onClick={() => moveQ(idx, 1)} title="Di chuyển xuống">
                            <ChevronDown size={16} />
                          </button>
                        )}
                      </div>
                      {questions.length > 1 && (
                        <button className={styles.manualQRemoveBtn} onClick={() => removeQ(q.id)} title="Xóa câu hỏi">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <ListeningQuestionCard
                    q={q}
                    onChange={updated => setQuestions(prev => prev.map(item => item.id === q.id ? updated : item))}
                  />
                </div>
              )}
            </div>
          ))}

          <button className={styles.manualAddBtn} onClick={addQuestion}>
            <Plus size={15} /> Thêm câu hỏi
          </button>
        </div>
      </div>

      <div className={styles.drawerFooter}>
        <div style={{ fontSize: 13, color: '#64748b' }}>{questions.length} câu hỏi</div>
        <div className={styles.footerRight}>
          <button className={styles.footerBtnSecondary} onClick={onClose}>Hủy</button>
          <button className={styles.footerBtnPreview} onClick={handlePreview}>
            <Eye size={15} /> Xem trước
          </button>
          <button
            className={`${styles.footerBtnPublish} ${!canPublish ? styles.footerBtnDisabled : ''}`}
            onClick={() => handleSave('published')}
            disabled={!canPublish}
            title={
              missingCount > 0 ? `Còn ${missingCount} câu chưa hợp lệ` :
              missingCount === 0 && !canPublish ? `Còn ${questions.filter(q => isTeacherGradedType(q) && (!q.points || q.points <= 0)).length} câu chưa set điểm` : ''
            }
          >
            <Send size={15} /> Tạo {label}
            {!canPublish && (missingCount + questions.filter(q => isTeacherGradedType(q) && (!q.points || q.points <= 0)).length) > 0 && (
              <span className={styles.missingBadge}>{missingCount + questions.filter(q => isTeacherGradedType(q) && (!q.points || q.points <= 0)).length}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
/* ══════════════════════════════════════════════════════════
   MAIN DRAWER COMPONENT
══════════════════════════════════════════════════════════════ */
export const CreateAssignmentDrawer = ({ open, unitName, onClose, onSave, isTest = false }) => {
  const label = isTest ? 'bài kiểm tra' : 'bài tập';
  const labelCap = isTest ? 'Bài kiểm tra' : 'Bài tập';
  const [mode, setMode] = useState('upload'); // 'manual' | 'upload'
  const [step, setStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [userExplanations, setUserExplanations] = useState({});
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [settings, setSettings] = useState({ attempts: 2, shuffle: 'Tắt', deadline: '', timeLimitMin: 30, showAnswer: isTest ? 'Sau deadline' : undefined });
  const [saved, setSaved] = useState(false);
  const [titleErr, setTitleErr] = useState('');
  const [parseErrors, setParseErrors] = useState([]);
  const [parseWarnings, setParseWarnings] = useState([]);

  // Cập nhật audioUrl cho một câu hỏi cụ thể (gọi từ Step 3)
  const handleAudioUpload = (qId, fileOrUrl) => {
    let url = fileOrUrl;
    let fileName = 'Google Drive Link';
    
    if (typeof fileOrUrl !== 'string') {
      url = URL.createObjectURL(fileOrUrl);
      fileName = fileOrUrl.name;
    }

    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      // giải phóng URL cũ nếu là blob
      if (q.audioUrl && q.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(q.audioUrl);
      }
      return { ...q, audioUrl: url, audioFile: q.audioFile || fileName };
    }));
  };

  // Xóa audio khỏi câu hỏi (giải phóng blob URL tránh memory leak)
  const handleAudioRemove = (qId) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      if (q.audioUrl && q.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(q.audioUrl);
      }
      return { ...q, audioUrl: null, audioFile: null };
    }));
  };

  const missingCount = questions.filter(q => !isAnswered(q, userAnswers)).length;
  const noPointsCount = questions.filter(q => isTeacherGradedType(q) && (!q.points || q.points <= 0)).length;
  const canPublish = questions.length > 0 && missingCount === 0 && noPointsCount === 0;

  const handleFileChange = (file) => {
    setUploadedFile(file);
    // Không auto-fill tên từ file — giáo viên tự nhập
    if (file) setTitleErr(prev => prev === 'Vui lòng chọn file trước khi tiếp tục' ? '' : prev);
  };

  const handleNextStep = async () => {
    if (step === 1) {
      // Validate tiêu đề trước
      if (!assignmentTitle.trim()) {
        setTitleErr('Vui lòng nhập tên bài tập');
        return;
      }
      // Validate file
      if (!uploadedFile) {
        setTitleErr('Vui lòng chọn file trước khi tiếp tục');
        return;
      }
      setTitleErr('');
      setStep(2);
      setIsExtracting(true);
      setParseErrors([]);
      setParseWarnings([]);

      try {
        const isExcel = uploadedFile?.name?.toLowerCase().endsWith('.xlsx');

        if (isExcel) {
          // → Parse thực bằng SheetJS
          const result = await parseExcelToQuestions(uploadedFile);
          setParseErrors(result.errors);
          setParseWarnings(result.warnings);
          // Audio sẽ được upload riêng ở Bước 3
          setQuestions(result.questions);
        } else {
          // Giữ mock cho các loại file khác (PDF, DOCX, PNG...)
          await new Promise(r => setTimeout(r, 2500));
          setQuestions(MOCK_EXTRACTED);
        }
      } catch (err) {
        setParseErrors([{ row: 0, message: `Lỗi đọc file: ${err.message}` }]);
        setQuestions([]);
      }

      setIsExtracting(false);
      setStep(3);
    } else {
      setStep(s => Math.min(s + 1, 4));
    }
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleAnswerChange = (qId, answer) => {
    setUserAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleExplanationChange = (qId, text) => {
    setUserExplanations(prev => ({ ...prev, [qId]: text }));
  };

  const handleAddQuestion = () => {
    const newId = questions.length + 1;
    setQuestions(prev => [
      ...prev,
      {
        id: newId, type: 'multiple_choice', content: '', options: ['A. ', 'B. ', 'C. ', 'D. '],
        detectedAnswer: null, confidence: null, status: 'missing'
      },
    ]);
  };

  const handleTypeChange = (qId, newType) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, type: newType } : q));
    setUserAnswers(prev => { const next = { ...prev }; delete next[qId]; return next; });
  };

  const handlePointsChange = (qId, points) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, points } : q));
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    setQuestions(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleSaveDraft = () => {
    onSave?.({ title: assignmentTitle, questions, userAnswers, status: 'draft' });
    setSaved(true);
    setTimeout(() => { setSaved(false); handleClose(); }, 800);
  };

  const handlePublish = () => {
    if (!canPublish) return;
    onSave?.({ title: assignmentTitle, questions, userAnswers, status: 'published' });
    setSaved(true);
    setTimeout(() => { setSaved(false); handleClose(); }, 800);
  };

  const hasUnsavedData = () =>
    !!assignmentTitle.trim() || !!uploadedFile || step > 1 || questions.length > 0;

  const handleClose = () => {
    setStep(1);
    setUploadedFile(null);
    setQuestions([]);
    setUserAnswers({});
    setUserExplanations({});
    setAssignmentTitle('');
    setTitleErr('');
    setIsExtracting(false);
    setParseErrors([]);
    setParseWarnings([]);
    // Revoke blob URLs để tránh memory leak
    questions.forEach(q => { if (q.audioUrl) URL.revokeObjectURL(q.audioUrl); });
    onClose();
  };

  const handleOverlayClick = () => {
    if (hasUnsavedData()) {
      if (window.confirm('Bạn có dữ liệu chưa lưu. Bạn có chắc muốn đóng không?')) {
        handleClose();
      }
    } else {
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay — hiện confirm nếu có dữ liệu chưa lưu */}
      <div className={styles.overlay} onClick={handleOverlayClick} />

      {/* Drawer */}
      <div className={styles.drawer}>
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div>
            <h2 className={styles.drawerTitle}>Tạo {label} mới</h2>
            {unitName && <p className={styles.drawerSub}>{unitName}</p>}
          </div>
          <button className={styles.closeBtn} onClick={handleClose}><X size={20} /></button>
        </div>

        {/* Mode tabs */}
        <div className={styles.modeTabs}>
          <button
            className={`${styles.modeTab} ${mode === 'manual' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('manual')}
          >
            <Edit3 size={15} /> Tạo từng câu
          </button>
          <button
            className={`${styles.modeTab} ${mode === 'upload' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('upload')}
          >
            <Upload size={15} /> Upload file
          </button>
        </div>

        {/* Upload mode */}
        {mode === 'upload' && (
          <>
            {/* Step indicator */}
            <div className={styles.drawerStepBar}>
              <StepIndicator current={step} />
            </div>

            {/* Content */}
            <div className={styles.drawerBody}>
              {step === 1 && (
                <StepUpload
                  file={uploadedFile} onFile={handleFileChange}
                  settings={settings} onSettings={setSettings}
                  title={assignmentTitle} onTitle={v => { setAssignmentTitle(v); setTitleErr(''); }}
                  titleErr={titleErr}
                />
              )}
              {step === 2 && (
                <StepExtracting file={uploadedFile} />
              )}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Excel parse errors — with fix hints */}
                  {parseErrors.length > 0 && (
                    <div className={styles.alertBanner} data-type="error">
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <strong>{parseErrors.length} dòng bị lỗi — đã bỏ qua khi import:</strong>
                        <ul style={{ margin: '6px 0 4px', paddingLeft: 18, fontSize: 12.5 }}>
                          {parseErrors.map((e, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>
                              <span>{e.message}</span>
                              {e.fixHint && (
                                <div style={{ color: '#7f1d1d', fontSize: 11.5, marginTop: 2, fontStyle: 'italic' }}>
                                  → Cách sửa: {e.fixHint}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                        <button
                          style={{
                            marginTop: 6, padding: '4px 12px', fontSize: 12,
                            background: '#fee2e2', border: '1px solid #fca5a5',
                            borderRadius: 6, cursor: 'pointer', color: '#991b1b',
                            fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5,
                          }}
                          onClick={() => { setStep(1); setParseErrors([]); setParseWarnings([]); }}
                        >
                          ↩ Sửa lại file Excel và upload lại
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Excel parse warnings */}
                  {parseWarnings.length > 0 && (
                    <div className={styles.alertBanner} data-type="warning">
                      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <strong>{parseWarnings.length} cảnh báo — đã import, cần bổ sung:</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5 }}>
                          {parseWarnings.map((w, i) => (
                            <li key={i} style={{ marginBottom: 3 }}>{w.message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  <StepCheckAnswers
                    questions={questions}
                    userAnswers={userAnswers}
                    onAnswerChange={handleAnswerChange}
                    onTypeChange={handleTypeChange}
                    userExplanations={userExplanations}
                    onExplanationChange={handleExplanationChange}
                    onAddQuestion={handleAddQuestion}
                    onAudioUpload={handleAudioUpload}
                    onAudioRemove={handleAudioRemove}
                    onPointsChange={handlePointsChange}
                    onMoveQuestion={handleMoveQuestion}
                  />
                </div>
              )}
              {step === 4 && (
                <StepPreview
                  questions={questions}
                  userAnswers={userAnswers}
                  userExplanations={userExplanations}
                  assignmentTitle={assignmentTitle}
                  onTitleChange={setAssignmentTitle}
                />
              )}
            </div>

            {/* Footer actions */}
            <div className={styles.drawerFooter}>
              {step > 1 && !isExtracting && (
                <button className={styles.footerBtnSecondary} onClick={handleBack}>
                  ← Quay lại
                </button>
              )}

              <div className={styles.footerRight}>
                {step === 3 && (
                  <>
                    <button className={styles.footerBtnSecondary} onClick={handleNextStep}>
                      <Eye size={15} /> Xem trước
                    </button>
                    <button
                      className={`${styles.footerBtnPublish} ${!canPublish ? styles.footerBtnDisabled : ''}`}
                      onClick={handlePublish}
                      disabled={!canPublish}
                      title={!canPublish ? `Còn ${missingCount} câu chưa có đáp án` : ''}
                    >
                      <Send size={15} /> Tạo {label}
                      {!canPublish && <span className={styles.missingBadge}>{missingCount}</span>}
                    </button>
                  </>
                )}
                {step === 4 && (
                  <button
                    className={`${styles.footerBtnPublish} ${!canPublish ? styles.footerBtnDisabled : ''}`}
                    onClick={handlePublish}
                    disabled={!canPublish}
                  >
                    <Send size={15} /> {canPublish ? `Tạo ${label}` : `Thiếu ${missingCount} đáp án`}
                  </button>
                )}
                {step === 1 && (
                  <button
                    className={styles.footerBtnPrimary}
                    onClick={handleNextStep}
                  >
                    Tiếp tục <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Manual mode */}
        {mode === 'manual' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <ManualMode
              onSave={(payload) => { onSave?.(payload); handleClose(); }}
              onClose={handleClose}
              settings={settings}
              onSettings={setSettings}
              label={label}
            />
          </div>
        )}
      </div>
    </>
  );
};
