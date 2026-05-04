/**
 * AdminAssignmentEditor — Two-panel question builder
 * Left: question navigator + Excel import
 * Right: focused single-question editor
 */
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  ChevronLeft, Plus, Trash2, Check, GripVertical,
  Type, Image as ImageIcon, Volume2, Save,
  CheckCircle, Circle, ToggleLeft, AlignLeft,
  ChevronDown, ChevronUp, ClipboardList,
  FileSpreadsheet, Download, ChevronRight, AlertCircle,
  Headphones, Pencil, XCircle, Play
} from 'lucide-react';

import { Tooltip } from '../../design-system/components/Tooltip/Tooltip';
import { Button }  from '../../design-system/components/Button/Button';
import { ToastContext } from '../../design-system/components/Toast/Toast';
import { useTeacher } from '../../contexts/TeacherContext';
import styles from './AdminAssignmentEditor.module.css';

const useToast = () => useContext(ToastContext);

/* ── Constants ───────────────────────────────────────────── */
const CONTENT_TYPES = [
  { value: 'text',  label: 'Văn bản',  icon: Type      },
  { value: 'image', label: 'Hình ảnh', icon: ImageIcon  },
  { value: 'audio', label: 'Âm thanh', icon: Volume2    },
];

const ANSWER_TYPES = [
  { value: 'single',    label: 'Một đáp án',   short: 'S', color: 'green'  },
  { value: 'multiple',  label: 'Nhiều đáp án', short: 'M', color: 'blue'   },
  { value: 'truefalse', label: 'Đúng / Sai',   short: 'T', color: 'amber'  },
  { value: 'fillin',    label: 'Điền khuyết',  short: 'F', color: 'indigo' },
  { value: 'matching',  label: 'Ghép đôi',     short: 'M', color: 'purple' },
  { value: 'dnd',       label: 'Kéo thả',      short: 'D', color: 'pink'   },
];

const newQuestion = () => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
  contentType: 'text',
  answerType: 'single',
  text: '',
  imageUrl: '', imageFile: null,
  audioUrl: '', audioFile: null,
  options: ['', '', '', ''],
  correctIdx: null, correctIdxs: [],
  lovOptions: [''],
  matchingPairs: [{ left: '', right: '' }, { left: '', right: '' }],
  dndText: '',
  dndOptions: [''],
  explanation: '',
});

/* ── EXCEL helpers ───────────────────────────────────────── */
const TEMPLATE_COLS = ['question','type','optA','optB','optC','optD','correct','imageUrl','audioUrl'];

const downloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_COLS,
    ['What is 1+1?', 'single', '1', '2', '3', '4', 'B', '', ''],
    ['Select all vowels', 'multiple', 'A', 'E', 'X', 'Z', 'A,B', '', ''],
    ['The sky is blue', 'truefalse', '', '', '', '', 'true', '', ''],
    ['The capital of VN is ___', 'fillin', '', '', '', '', 'Hà Nội', '', ''],
  ]);
  ws['!cols'] = TEMPLATE_COLS.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');
  XLSX.writeFile(wb, 'question_template.xlsx');
};

const parseExcel = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const [header, ...data] = rows;
      const idx = (col) => header.findIndex(h => h?.toString().toLowerCase().trim() === col);

      const questions = data
        .filter(r => r[idx('question')])
        .map(r => {
          const get = (col) => (r[idx(col)] ?? '').toString().trim();
          const type = get('type') || 'single';
          const opts = ['optA','optB','optC','optD'].map(c => get(c)).filter(Boolean);
          const correctRaw = get('correct').toUpperCase();

          let correctIdx = null, correctIdxs = [];
          if (type === 'single') {
            const ci = ['A','B','C','D'].indexOf(correctRaw);
            correctIdx = ci >= 0 ? ci : null;
          } else if (type === 'multiple') {
            correctIdxs = correctRaw.split(',').map(c => ['A','B','C','D'].indexOf(c.trim())).filter(x => x >= 0);
          }

          return {
            ...newQuestion(),
            contentType: get('imageUrl') ? 'image' : get('audioUrl') ? 'audio' : 'text',
            answerType: type,
            text: get('question'),
            imageUrl: get('imageUrl'),
            audioUrl: get('audioUrl'),
            options: opts.length >= 2 ? opts : ['', '', '', ''],
            correctIdx,
            correctIdxs,
            lovOptions: (type === 'fillin') ? [get('correct')] : [''],
          };
        });
      resolve(questions);
    } catch (err) { reject(err); }
  };
  reader.onerror = reject;
  reader.readAsArrayBuffer(file);
});

export const isQuestionInvalid = (q) => {
  if (!q.text || !q.text.trim()) return true;
  if (q.answerType === 'single' || q.answerType === 'truefalse') {
    if (q.correctIdx === null || q.correctIdx === undefined) return true;
  } else if (q.answerType === 'multiple') {
    if (!q.correctIdxs || q.correctIdxs.length === 0) return true;
  } else if (q.answerType === 'fillin') {
    if (!q.lovOptions || q.lovOptions.length === 0 || q.lovOptions.every(opt => !opt.trim())) return true;
  } else if (q.answerType === 'matching') {
    if (!q.matchingPairs || q.matchingPairs.length === 0) return true;
    return q.matchingPairs.some(p => !p.left.trim() || !p.right.trim());
  } else if (q.answerType === 'dnd') {
    if (!q.dndText || !q.dndText.trim()) return true;
    if (!q.dndOptions || q.dndOptions.length === 0 || q.dndOptions.every(opt => !opt.trim())) return true;
  }
  return false;
};

/* ── QuestionNavigator (Left Panel) ───────────────────── */
const TYPE_COLOR = { single:'green', multiple:'blue', truefalse:'amber', fillin:'indigo' };

const QuestionNavigator = ({ questions, activeIdx, onSelect, onAdd, onDelete, onExcel, onDownloadTemplate, audioGroups, onAudioGroupsChange, imageGroups, onImageGroupsChange, showErrors }) => {
  const fileRef = useRef();
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [editGroupId, setEditGroupId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);

  const addGroup = () => {
    if (!newGroupLabel.trim()) return;
    const g = { id: `ag-${Date.now()}`, label: newGroupLabel.trim(), audioUrl: '', questionIds: [] };
    onAudioGroupsChange([...audioGroups, g]);
    setNewGroupLabel(''); setAddingGroup(false);
  };
  const deleteGroup = (gId) => onAudioGroupsChange(audioGroups.filter(g => g.id !== gId));
  const updateGroupField = (gId, field, val) =>
    onAudioGroupsChange(audioGroups.map(g => g.id === gId ? { ...g, [field]: val } : g));
  const getGroupForQ = (qId) => audioGroups.find(g => g.questionIds.includes(qId));
  const getImgGroupForQ = (qId) => imageGroups?.find(g => g.questionIds.includes(qId));

  return (
    <aside className={styles.nav}>
      {/* Header */}
      <div className={styles.navHeader}>
        <span className={styles.navTitle}>Câu hỏi <span className={styles.navCount}>({questions.length})</span></span>
        <div className={styles.navHeaderBtns}>
          <Tooltip content="Tải template Excel" side="bottom">
            <button className={styles.navIconBtn} onClick={onDownloadTemplate}><Download size={14}/></button>
          </Tooltip>
          <Tooltip content="Nhập từ Excel" side="bottom">
            <button className={styles.navIconBtn} onClick={() => fileRef.current?.click()}><FileSpreadsheet size={14}/></button>
          </Tooltip>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={e => { if(e.target.files[0]) onExcel(e.target.files[0]); e.target.value=''; }} />
      </div>

      {/* Add question CTA */}
      <div className={styles.navAddTopBar}>
        <button className={styles.navAddTopBtn} onClick={onAdd}>
          <Plus size={15}/> Thêm câu hỏi
        </button>
      </div>

      {/* Question list */}
      <div className={styles.navList}>
        {questions.length === 0 && (
          <div className={styles.navEmpty}>Chưa có câu hỏi nào.<br/> Bấm "+ Thêm câu hỏi" để bắt đầu.</div>
        )}
        {questions.map((q, i) => {
          const tc = TYPE_COLOR[q.answerType] ?? 'green';
          const SHORTS = { single:'S', multiple:'M', truefalse:'T', fillin:'F', matching:'M', dnd:'D' };
          const group = getGroupForQ(q.id);
          const imgGroup = getImgGroupForQ(q.id);
          const isInvalid = showErrors && isQuestionInvalid(q);
          return (
            <div
              key={q.id}
              className={`${styles.navItem} ${i === activeIdx ? styles.navItemActive : ''} ${isInvalid ? styles.navItemError : ''}`}
              onClick={() => onSelect(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') onSelect(i); }}
            >
              <span className={styles.navNum}>{i + 1}</span>
              <span className={styles.navPreview}>
                {q.text ? q.text.slice(0, 30) : <em className={styles.navEmpty2}>Chưa có nội dung</em>}
              </span>
              <Tooltip content="Xóa" side="right">
                <button className={styles.navDeleteBtn} onClick={e => { e.stopPropagation(); onDelete(i); }}>
                  <Trash2 size={11}/>
                </button>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

/* Google Drive: extract file ID */
const getGdriveId = (url) => {
  if (!url) return null;
  const m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
};

/* Smart audio player: iframe for Google Drive, <audio> for others */
const AudioPlayer = ({ url, className }) => {
  const id = getGdriveId(url);
  if (id) {
    return (
      <div style={{
        borderRadius: 10,
        overflow: 'hidden',
        background: 'transparent',
      }}>
        <iframe
          src={`https://drive.google.com/file/d/${id}/preview`}
          allow="autoplay"
          style={{
            border: 'none',
            width: '100%',
            height: 80,
            display: 'block',
            filter: 'invert(1) hue-rotate(180deg) brightness(1.55) saturate(0.6)',
          }}
          title="audio preview"
        />
      </div>
    );
  }
  return <audio controls className={className}><source src={url}/></audio>;
};

/* ── FocusedEditor (Right Panel) ────────────────────────── */
const FocusedEditor = ({ q, idx, total, onChange, onPrev, onNext, audioGroups, onAudioGroupsChange, imageGroups, onImageGroupsChange, questions, showErrors, shakeKey }) => {
  const [newPassageName, setNewPassageName] = useState('');
  const [newPassageUrl, setNewPassageUrl] = useState('');
  const [creatingPassage, setCreatingPassage] = useState(false);
  const [activePassageTab, setActivePassageTab] = useState(null);
  const [editingPassageId, setEditingPassageId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const fileAudNewRef = useRef();
  const fileAudEditRef = useRef();

  const [newImageName, setNewImageName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [creatingImageGroup, setCreatingImageGroup] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState(null);
  const [editingImageId, setEditingImageId] = useState(null);
  const [editImageLabel, setEditImageLabel] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const fileImgNewRef = useRef();
  const fileImgEditRef = useRef();

  // Auto-activate tab for the question's current group
  const myGroupId = audioGroups.find(g => g.questionIds.includes(q?.id))?.id ?? null;
  const resolvedTab = activePassageTab ?? myGroupId ?? (audioGroups[0]?.id ?? null);

  const myImgGroupId = imageGroups?.find(g => g.questionIds.includes(q?.id))?.id ?? null;
  const resolvedImgTab = activeImageTab ?? myImgGroupId ?? (imageGroups?.[0]?.id ?? null);

  // IMPORTANT: Must be declared BEFORE any early return — Rules of Hooks
  const fileImgRef = useRef();
  const fileAudRef = useRef();

  // Shake animation: bật lên rồi tự tắt sau 600ms
  const [isShaking, setIsShaking] = useState(false);
  useEffect(() => {
    if (shakeKey > 0) {
      setIsShaking(true);
      const t = setTimeout(() => setIsShaking(false), 650);
      return () => clearTimeout(t);
    }
  }, [shakeKey]);

  if (!q) return (
    <div className={styles.editorEmpty}>
      <ClipboardList size={40} className={styles.editorEmptyIcon}/>
      <p>Chọn câu hỏi bên trái hoặc bấm <strong>+ Thêm câu hỏi</strong> để bắt đầu</p>
    </div>
  );

  const up = (patch) => onChange({ ...q, ...patch });

  const isInvalidText = showErrors && (!q.text || !q.text.trim());
  // isNoAnswer: chưa chọn đáp án đúng (độc lập với text)
  const isNoAnswer = showErrors && (() => {
    if (q.answerType === 'single' || q.answerType === 'truefalse')
      return q.correctIdx === null || q.correctIdx === undefined;
    if (q.answerType === 'multiple')
      return !q.correctIdxs || q.correctIdxs.length === 0;
    if (q.answerType === 'fillin')
      return !q.lovOptions || q.lovOptions.every(o => !o.trim());
    if (q.answerType === 'matching')
      return !q.matchingPairs || q.matchingPairs.some(p => !p.left.trim() || !p.right.trim());
    if (q.answerType === 'dnd')
      return !q.dndText?.trim() || !q.dndOptions || q.dndOptions.every(o => !o.trim());
    return false;
  })();

  // (shake animation hooks moved to top)

  /* options helpers */
  const setOpt = (i, v) => { const o=[...(q.options || [])]; o[i]=v; up({options:o}); };
  const addOpt = () => (q.options || []).length < 8 && up({ options:[...(q.options || []),''] });
  const removeOpt = (i) => {
    const opts = q.options || [];
    if (opts.length <= 2) return;
    const o = opts.filter((_,x)=>x!==i);
    let ci = q.correctIdx; let cis = (q.correctIdxs || []).filter(x=>x!==i).map(x=>x>i?x-1:x);
    if(ci===i) ci=null; else if(ci>i) ci=ci-1;
    up({options:o, correctIdx:ci, correctIdxs:cis});
  };
  const toggleCorrect = (i) => {
    if (q.answerType==='single'||q.answerType==='truefalse') up({correctIdx:i});
    else { 
      const idxs = q.correctIdxs || [];
      const has = idxs.includes(i); 
      up({correctIdxs: has ? idxs.filter(x=>x!==i) : [...idxs,i]}); 
    }
  };
  const isCorrect = (i) => q.answerType==='multiple' ? (q.correctIdxs || []).includes(i) : q.correctIdx===i;

  const setLov = (i,v) => { const l=[...q.lovOptions]; l[i]=v; up({lovOptions:l}); };

  return (
    <div className={styles.editor}>
      {/* breadcrumb */}
      <div className={styles.editorBreadcrumb}>
        <span className={styles.editorCrumbNum}>Câu {idx + 1}</span>
        <span className={styles.editorCrumbOf}>/ {total}</span>
      </div>

      {/* Content type tabs */}
      <div className={styles.contentTypeRow}>
        <span className={styles.contentTypeLabel}>Dạng câu hỏi:</span>
        <div className={styles.contentTypeTabs}>
          {CONTENT_TYPES.map(({value, label, icon: Icon}) => (
            <button
              key={value}
              className={`${styles.ctTab} ${q.contentType===value ? styles.ctTabActive : ''}`}
              onClick={() => up({contentType:value})}
            >
              <Icon size={13}/> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content input — text inside contentZone card */}
      {q.contentType === 'text' && (
        <div className={styles.contentZone}>
          <span className={styles.contentZoneTitle}>Nội dung câu hỏi</span>
          <textarea
            className={`${styles.qTextarea} ${isInvalidText ? styles.inputError : ''} ${isShaking && isInvalidText ? styles.shake : ''}`}
            rows={4}
            placeholder="Nhập nội dung câu hỏi..."
            value={q.text}
            onChange={e => up({text:e.target.value})}
          />
        </div>
      )}

      {/* Image — PassageManager structure */}
      {q.contentType === 'image' && (
        <>
          <div className={styles.passageManager}>
            <div className={styles.pmSectionTitle}>THƯ VIỆN HÌNH ẢNH</div>
            {/* Tab bar */}
            <div className={styles.pmTabBar}>
              {imageGroups?.map((g, gi) => {
                const isActive = !creatingImageGroup && resolvedImgTab === g.id;
                return (
                  <button
                    key={g.id}
                    className={`${styles.pmTab} ${isActive ? styles.pmTabActive : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCreatingImageGroup(false);
                      setActiveImageTab(g.id);
                      setEditingImageId(null);
                      onImageGroupsChange(imageGroups.map(x => {
                        if (x.id === g.id) return { ...x, questionIds: [...x.questionIds.filter(id => id !== q.id), q.id] };
                        return { ...x, questionIds: x.questionIds.filter(id => id !== q.id) };
                      }));
                    }}
                  >
                    {g.label || `Hình ${gi + 1}`}
                  </button>
                );
              })}
              <button
                className={`${styles.pmTab} ${styles.pmTabAdd} ${creatingImageGroup ? styles.pmTabActive : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setCreatingImageGroup(true); setActiveImageTab(null); setEditingImageId(null); setNewImageName(''); setNewImageUrl(''); }}
              >
                <Plus size={12}/> Thêm hình ảnh
              </button>
            </div>

            {/* Empty state */}
            {(!imageGroups || imageGroups.length === 0) && !creatingImageGroup && (
              <div className={styles.pmEmpty}>
                <ImageIcon size={28} className={styles.pmEmptyIcon}/>
                <p>Chưa có hình ảnh nào</p>
                <button className={styles.pmEmptyBtn} onClick={() => setCreatingImageGroup(true)}>
                  <Plus size={13}/> Thêm hình ảnh đầu tiên
                </button>
              </div>
            )}

            {/* Active tab panel */}
            {!creatingImageGroup && resolvedImgTab && (() => {
              const g = imageGroups.find(x => x.id === resolvedImgTab);
              if (!g) return null;
              const isEditing = editingImageId === g.id;
              const deleteThis = () => { onImageGroupsChange(imageGroups.filter(x => x.id !== g.id)); setActiveImageTab(null); };
              const saveEdit = () => {
                onImageGroupsChange(imageGroups.map(x => x.id === g.id ? { ...x, label: editImageLabel, imageUrl: editImageUrl } : x));
                setEditingImageId(null);
              };
              return (
                <div className={styles.pmPanel}>
                  {isEditing ? (
                    <div className={styles.pmEditMode}>
                      <input className={styles.pmCreateInput} placeholder="Tên hình ảnh..." value={editImageLabel} autoFocus onChange={e => setEditImageLabel(e.target.value)}/>
                      <div className={styles.pmCreateAudioRow}>
                        <input className={styles.pmCreateInput} placeholder="URL hình ảnh..." value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)}/>
                        <span className={styles.mediaOr}>hoặc</span>
                        <button className={styles.mediaUploadBtn} onClick={() => fileImgEditRef.current?.click()}><ImageIcon size={13}/> Chọn file</button>
                        <input ref={fileImgEditRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files[0]; if (f) setEditImageUrl(URL.createObjectURL(f)); }}/>
                      </div>
                      {editImageUrl && <img src={editImageUrl} alt="" className={styles.imgPreview}/>}
                      </div>
                  ) : (
                    <div className={styles.pmViewMode}>
                      <div className={styles.pmTagRow}>
                        {!g.imageUrl && <span className={styles.pmNoAudio}>Chưa có hình ảnh</span>}
                        <div className={styles.pmTagActions}>
                          <button className={styles.pmEditBtn} onClick={() => { setEditingImageId(g.id); setEditImageLabel(g.label); setEditImageUrl(g.imageUrl || ''); }}><Pencil size={11}/> Sửa</button>
                          <button className={styles.pmDeleteBtn} onClick={deleteThis}><Trash2 size={11}/></button>
                        </div>
                      </div>
                      {g.imageUrl && <img src={g.imageUrl} alt="" className={styles.imgPreview}/>}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Create new image form */}
            {creatingImageGroup && (
              <div className={styles.pmCreateForm}>
                <p className={styles.pmCreateTitle}>Thêm hình ảnh mới</p>
                <input className={styles.pmCreateInput} placeholder='Tên hình (VD: "Sơ đồ lớp học")' value={newImageName} autoFocus onChange={e => setNewImageName(e.target.value)}/>
                <div className={styles.pmCreateAudioRow}>
                  <input className={styles.pmCreateInput} placeholder="URL hình ảnh..." value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}/>
                  <span className={styles.mediaOr}>hoặc</span>
                  <button className={styles.mediaUploadBtn} onClick={() => fileImgNewRef.current?.click()}><ImageIcon size={13}/> Chọn file</button>
                  <input ref={fileImgNewRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files[0]; if (f) setNewImageUrl(URL.createObjectURL(f)); }}/>
                </div>
                {newImageUrl && <img src={newImageUrl} alt="" className={styles.imgPreview}/>}
                <div className={styles.pmCreateBtns}>
                  <button className={styles.pmCreateCancel} onClick={() => { setCreatingImageGroup(false); setNewImageName(''); setNewImageUrl(''); }}>Hủy</button>
                  <button
                    className={styles.pmCreateConfirm}
                    disabled={!newImageName.trim()}
                    onClick={() => {
                      const ng = { id: `ig-${Date.now()}`, label: newImageName.trim(), imageUrl: newImageUrl, questionIds: [q.id] };
                      const cleanGroups = (imageGroups || []).map(x => ({ ...x, questionIds: x.questionIds.filter(id => id !== q.id) }));
                      onImageGroupsChange([...cleanGroups, ng]);
                      setActiveImageTab(ng.id);
                      setCreatingImageGroup(false); setNewImageName(''); setNewImageUrl('');
                    }}
                  >
                    <Check size={13}/> Tạo & Chọn
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Question textarea — its own card */}
          <div className={`${styles.contentZone} ${isInvalidText ? styles.contentZoneError : ''}`}>
            <span className={styles.contentZoneTitle}>Nội dung câu hỏi</span>
            <textarea
              className={styles.qTextarea}
              rows={3}
              placeholder="Câu hỏi liên quan đến hình ảnh..."
              value={q.text}
              onChange={e => up({text:e.target.value})}
            />
          </div>
        </>
      )}

      {/* Audio — PassageManager as its own card, question textarea as separate card */}
      {q.contentType==='audio' && (
        <>
          {/* Passage manager card */}
          <div className={styles.passageManager}>
            <div className={styles.pmSectionTitle}>THƯ VIỆN ÂM THANH</div>

            {/* Tab bar */}
            <div className={styles.pmTabBar}>
              {audioGroups.map((g, gi) => {
                const isActive = !creatingPassage && resolvedTab === g.id;
                return (
                  <button
                    key={g.id}
                    className={`${styles.pmTab} ${isActive ? styles.pmTabActive : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCreatingPassage(false);
                      setActivePassageTab(g.id);
                      setEditingPassageId(null);
                      onAudioGroupsChange(audioGroups.map(x => {
                        if (x.id === g.id) return { ...x, questionIds: [...x.questionIds.filter(id => id !== q.id), q.id] };
                        return { ...x, questionIds: x.questionIds.filter(id => id !== q.id) };
                      }));
                    }}
                  >
                    {g.label || `Đoạn ${gi + 1}`}
                  </button>
                );
              })}
              <button
                className={`${styles.pmTab} ${styles.pmTabAdd} ${creatingPassage ? styles.pmTabActive : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setCreatingPassage(true); setActivePassageTab(null); setEditingPassageId(null); setNewPassageName(''); setNewPassageUrl(''); }}
              >
                <Plus size={12}/> Thêm MP3
              </button>
            </div>

            {/* Empty state */}
            {audioGroups.length === 0 && !creatingPassage && (
              <div className={styles.pmEmpty}>
                <Headphones size={28} className={styles.pmEmptyIcon}/>
                <p>Chưa có đoạn hội thoại nào</p>
                <button className={styles.pmEmptyBtn} onClick={() => setCreatingPassage(true)}>
                  <Plus size={13}/> Tạo đoạn đầu tiên
                </button>
              </div>
            )}

            {/* Active tab panel */}
            {!creatingPassage && resolvedTab && (() => {
              const g = audioGroups.find(x => x.id === resolvedTab);
              if (!g) return null;
              const isEditing = editingPassageId === g.id;
              const deleteThis = () => { onAudioGroupsChange(audioGroups.filter(x => x.id !== g.id)); setActivePassageTab(null); };
              const saveEdit = () => {
                onAudioGroupsChange(audioGroups.map(x => x.id === g.id ? { ...x, label: editLabel, audioUrl: editUrl } : x));
                setEditingPassageId(null);
              };
              return (
                <div className={styles.pmPanel}>
                  {isEditing ? (
                    <div className={styles.pmEditMode}>
                      <input className={styles.pmCreateInput} placeholder="Tên đoạn..." value={editLabel} autoFocus onChange={e => setEditLabel(e.target.value)}/>
                      <div className={styles.pmCreateAudioRow}>
                        <input className={styles.pmCreateInput} placeholder="URL audio (MP3, CDN, Google Drive...)..." value={editUrl} onChange={e => setEditUrl(e.target.value)}/>
                        <span className={styles.mediaOr}>hoặc</span>
                        <button className={styles.mediaUploadBtn} onClick={() => fileAudEditRef.current?.click()}><Volume2 size={13}/> Chọn file</button>
                        <input ref={fileAudEditRef} type="file" accept="audio/*" hidden onChange={e => { const f = e.target.files[0]; if (f) setEditUrl(URL.createObjectURL(f)); }}/>
                      </div>
                      {editUrl && <AudioPlayer url={editUrl} className={styles.audioPreview}/>}
                      <div className={styles.pmEditBtns}>
                        <button className={styles.pmCreateCancel} onClick={() => setEditingPassageId(null)}>Hủy</button>
                        <button className={styles.pmCreateConfirm} onClick={saveEdit}><Check size={13}/> Lưu</button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.pmViewMode}>
                      <div className={styles.pmTagRow}>
                        {!g.audioUrl && <span className={styles.pmNoAudio}>Chưa có audio</span>}
                        <div className={styles.pmTagActions}>
                          <button className={styles.pmEditBtn} onClick={() => { setEditingPassageId(g.id); setEditLabel(g.label); setEditUrl(g.audioUrl || ''); }}><Pencil size={11}/> Sửa</button>
                          <button className={styles.pmDeleteBtn} onClick={deleteThis}><Trash2 size={11}/></button>
                        </div>
                      </div>
                      {g.audioUrl && <AudioPlayer url={g.audioUrl} className={styles.audioPreview}/>}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Create new passage form */}
            {creatingPassage && (
              <div className={styles.pmCreateForm}>
                <p className={styles.pmCreateTitle}>Tạo đoạn hội thoại mới</p>
                <input className={styles.pmCreateInput} placeholder='Tên đoạn (VD: "Hội thoại mua sắm")' value={newPassageName} autoFocus onChange={e => setNewPassageName(e.target.value)}/>
                <div className={styles.pmCreateAudioRow}>
                  <input className={styles.pmCreateInput} placeholder="URL audio (MP3, Google Drive, CDN...)..." value={newPassageUrl} onChange={e => setNewPassageUrl(e.target.value)}/>
                  <span className={styles.mediaOr}>hoặc</span>
                  <button className={styles.mediaUploadBtn} onClick={() => fileAudNewRef.current?.click()}><Volume2 size={13}/> Chọn file</button>
                  <input ref={fileAudNewRef} type="file" accept="audio/*" hidden onChange={e => { const f = e.target.files[0]; if (f) setNewPassageUrl(URL.createObjectURL(f)); }}/>
                </div>
                {newPassageUrl && <AudioPlayer url={newPassageUrl} className={styles.audioPreview}/>}
                <div className={styles.pmCreateBtns}>
                  <button className={styles.pmCreateCancel} onClick={() => { setCreatingPassage(false); setNewPassageName(''); setNewPassageUrl(''); }}>Hủy</button>
                  <button
                    className={styles.pmCreateConfirm}
                    disabled={!newPassageName.trim()}
                    onClick={() => {
                      const ng = { id: `ag-${Date.now()}`, label: newPassageName.trim(), audioUrl: newPassageUrl, questionIds: [q.id] };
                      const cleanGroups = audioGroups.map(x => ({ ...x, questionIds: x.questionIds.filter(id => id !== q.id) }));
                      onAudioGroupsChange([...cleanGroups, ng]);
                      setActivePassageTab(ng.id);
                      setCreatingPassage(false); setNewPassageName(''); setNewPassageUrl('');
                    }}
                  >
                    <Check size={13}/> Tạo & Chọn
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Question textarea — its own card */}
          <div className={styles.contentZone}>
            <span className={styles.contentZoneTitle}>Nội dung câu hỏi</span>
            <textarea
              className={`${styles.qTextarea} ${isInvalidText ? styles.inputError : ''}`}
              rows={3}
              placeholder="Câu hỏi liên quan đến đoạn hội thoại..."
              value={q.text}
              onChange={e => up({text:e.target.value})}
            />
          </div>
        </>
      )}


      {/* Answer type segmented control */}
      <div className={styles.answerTypeRow}>
        <span className={styles.answerTypeLabel}>Loại đáp án:</span>
        <div className={styles.answerTypeSeg}>
          {ANSWER_TYPES.map(({value, label}) => (
            <button
              key={value}
              className={`${styles.segBtn} ${q.answerType===value ? styles.segBtnActive : ''}`}
              onClick={() => up({answerType:value, correctIdx:null, correctIdxs:[]})}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Answer options */}
      <div className={styles.answerZone}>
        {q.answerType==='truefalse' ? (
          <div className={styles.tfRow}>
            <button
              className={`${styles.tfBtn} ${styles.tfBtnTrue} ${isCorrect(0) ? styles.tfBtnTrueOn : ''} ${isNoAnswer && q.correctIdx === null ? styles.tfBtnError : ''}`}
              onClick={() => toggleCorrect(0)}
            >
              <CheckCircle size={18} /> Đúng
            </button>
            <button
              className={`${styles.tfBtn} ${styles.tfBtnFalse} ${isCorrect(1) ? styles.tfBtnFalseOn : ''} ${isNoAnswer && q.correctIdx === null ? styles.tfBtnError : ''}`}
              onClick={() => toggleCorrect(1)}
            >
              <XCircle size={18} /> Sai
            </button>
          </div>
        ) : q.answerType==='fillin' ? (
          <div className={styles.fillinZone}>
            <span className={styles.fillinLabel}>Đáp án chấp nhận được:</span>
            {q.lovOptions.map((lov,i) => (
              <div key={i} className={styles.fillinRow}>
                <span className={styles.optLetter}>{i+1}</span>
                <input className={`${styles.optInput} ${isNoAnswer && !lov.trim() ? styles.inputError : ''}`} placeholder={`Đáp án ${i+1}...`} value={lov} onChange={e=>setLov(i,e.target.value)}/>
                {q.lovOptions.length>1 && <button className={styles.removeOptBtn} onClick={()=>up({lovOptions:q.lovOptions.filter((_,x)=>x!==i)})}><Trash2 size={11}/></button>}
              </div>
            ))}
            <button className={styles.addOptBtn} onClick={()=>up({lovOptions:[...q.lovOptions,'']})}><Plus size={12}/> Thêm đáp án</button>
          </div>
        ) : q.answerType==='matching' ? (
          <div className={styles.fillinZone}>
            <span className={styles.fillinLabel}>Các cặp ghép đôi (trái → phải):</span>
            {(q.matchingPairs || []).map((pair, i) => (
              <div key={i} className={styles.fillinRow}>
                <span className={styles.optLetter}>{i+1}</span>
                <input className={`${styles.optInput} ${isNoAnswer && !pair.left.trim() ? styles.inputError : ''}`} placeholder={`Vế trái ${i+1}...`} value={pair.left} onChange={e=> {
                  const m = [...q.matchingPairs]; m[i] = { ...m[i], left: e.target.value }; up({matchingPairs:m});
                }}/>
                <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
                <input className={`${styles.optInput} ${isNoAnswer && !pair.right.trim() ? styles.inputError : ''}`} placeholder={`Vế phải ${i+1}...`} value={pair.right} onChange={e=> {
                  const m = [...q.matchingPairs]; m[i] = { ...m[i], right: e.target.value }; up({matchingPairs:m});
                }}/>
                {q.matchingPairs.length>2 && <button className={styles.removeOptBtn} onClick={()=>up({matchingPairs:q.matchingPairs.filter((_,x)=>x!==i)})}><Trash2 size={11}/></button>}
              </div>
            ))}
            <button className={styles.addOptBtn} onClick={()=>up({matchingPairs:[...(q.matchingPairs||[]), {left:'', right:''}]})}><Plus size={12}/> Thêm cặp</button>
          </div>
        ) : q.answerType==='dnd' ? (
          <div className={styles.fillinZone}>
            <span className={styles.fillinLabel}>Văn bản kéo thả (dùng "___" để đánh dấu ô trống):</span>
            <textarea
              className={`${styles.qTextarea} ${isNoAnswer && !(q.dndText||'').trim() ? styles.inputError : ''}`}
              rows={3}
              placeholder="VD: Thủ đô của Việt Nam là ___."
              value={q.dndText || ''}
              onChange={e => up({dndText:e.target.value})}
              style={{ marginBottom: 'var(--spacing-md)' }}
            />
            <span className={styles.fillinLabel}>Các đáp án có thể kéo (bao gồm cả đáp án gây nhiễu):</span>
            {(q.dndOptions || []).map((opt, i) => (
              <div key={i} className={styles.fillinRow}>
                <span className={styles.optLetter}>{i+1}</span>
                <input className={`${styles.optInput} ${isNoAnswer && !opt.trim() ? styles.inputError : ''}`} placeholder={`Tùy chọn ${i+1}...`} value={opt} onChange={e=> {
                  const o = [...q.dndOptions]; o[i] = e.target.value; up({dndOptions:o});
                }}/>
                {q.dndOptions.length>1 && <button className={styles.removeOptBtn} onClick={()=>up({dndOptions:q.dndOptions.filter((_,x)=>x!==i)})}><Trash2 size={11}/></button>}
              </div>
            ))}
            <button className={styles.addOptBtn} onClick={()=>up({dndOptions:[...(q.dndOptions||[]), '']})}><Plus size={12}/> Thêm tùy chọn</button>
          </div>
        ) : (
          <div className={styles.optionList}>
            {(q.options || []).map((opt,i) => (
              <div key={i} className={`${styles.optRow} ${isCorrect(i) ? styles.optCorrect : ''}`}>
                <Tooltip content={q.answerType==='multiple'?'Toggle đúng':'Chọn đáp án đúng'} side="left">
                  <button
                    className={`${styles.correctBtn} ${q.answerType==='multiple' ? styles.correctBtnCheckbox : ''} ${isCorrect(i)?styles.correctBtnOn:''} ${isNoAnswer && !isCorrect(i) ? styles.correctBtnError : ''}`}
                    onClick={()=>toggleCorrect(i)}
                  >
                    {q.answerType==='multiple' ? <Check size={15} strokeWidth={3} /> : <Circle fill="currentColor" stroke="none" size={10} />}
                  </button>
                </Tooltip>
                <span className={styles.optLetter}>{String.fromCharCode(65+i)}</span>
                <input className={`${styles.optInput} ${isNoAnswer && !opt.trim() ? styles.inputError : ''}`} placeholder={`Lựa chọn ${String.fromCharCode(65+i)}...`} value={opt} onChange={e=>setOpt(i,e.target.value)}/>
                {(q.options || []).length>2 && (
                  <Tooltip content="Xóa lựa chọn" side="right">
                    <button className={styles.removeOptBtn} onClick={()=>removeOpt(i)}><Trash2 size={11}/></button>
                  </Tooltip>
                )}
              </div>
            ))}
            {(q.options || []).length<8 && <button className={styles.addOptBtn} onClick={addOpt}><Plus size={12}/> Thêm lựa chọn</button>}
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className={styles.explanationZone}>
        <label className={styles.explanationLabel} htmlFor={`exp-${q.id}`}>
          💡 Giải thích <span className={styles.explanationOptional}>(không bắt buộc)</span>
        </label>
        <textarea
          id={`exp-${q.id}`}
          className={styles.explanationTextarea}
          rows={2}
          placeholder="Giải thích vì sao đây là đáp án đúng... (có thể bỏ trống)"
          value={q.explanation || ''}
          onChange={e => up({ explanation: e.target.value })}
        />
      </div>

      {/* Prev / Next */}
      <div className={styles.editorNav}>
        <button className={styles.editorNavBtn} onClick={onPrev} disabled={idx===0}><ChevronLeft size={15}/> Câu trước</button>
        <button className={styles.editorNavBtn} onClick={onNext} disabled={idx===total-1}>Câu tiếp <ChevronRight size={15}/></button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export const AdminAssignmentEditor = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { courses, getAssignmentById, updateAssignment } = useTeacher();

  const [hw, setHw]             = useState(null);
  const [title, setTitle]       = useState('');
  const [questions, setQuestions] = useState([]);
  const [audioGroups, setAudioGroups] = useState([]);
  const [imageGroups, setImageGroups] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dirty, setDirty]       = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const course = courses.find(c => c.id === courseId);

  useEffect(() => {
    const found = getAssignmentById(assignmentId);
    if (found) {
      setHw(found);
      setTitle(found.title ?? '');
      setQuestions(found.questions ?? []);
      setAudioGroups(found.audioGroups ?? []);
      setImageGroups(found.imageGroups ?? []);
      setActiveIdx(0);
    }
  }, [assignmentId]);

  const mark = () => setDirty(true);

  const saveAction = () => {
    if (!title.trim()) { toast?.error('Vui lòng nhập tên bài tập'); return false; }

    // Validate questions
    const invalidIndices = questions.map((q, i) => isQuestionInvalid(q) ? i : -1).filter(i => i !== -1);

    if (invalidIndices.length > 0) {
      setShowErrors(true);
      toast?.error(`Không thể lưu. Câu hỏi số ${invalidIndices.map(i => i + 1).join(', ')} chưa điền đủ thông tin hoặc thiếu đáp án.`);
      setShakeKey(k => k + 1);
      return false;
    }

    const clean = questions.map(q => ({
      ...q, imageFile: null, audioFile: null,
      imageUrl: q.imageFile ? '[file-uploaded]' : q.imageUrl,
      audioUrl: q.audioFile ? '[file-uploaded]' : q.audioUrl,
    }));
    const audioMode = audioGroups.length > 0 ? 'grouped' : 'normal';
    updateAssignment(assignmentId, { title, questions: clean, audioMode, audioGroups, imageGroups });
    setDirty(false);
    return true;
  };

  const handleSave = () => {
    if (saveAction()) {
      toast?.success('Đã lưu bài tập!');
    }
  };

  const handlePreview = () => {
    if (saveAction()) {
      toast?.success('Đã lưu! Đang chuyển sang xem thử...');
      navigate(`/app/homework/${assignmentId}/attempt?preview=true`);
    }
  };

  const addQuestion = () => {
    const nq = newQuestion();
    setQuestions(qs => { const next=[...qs, nq]; setActiveIdx(next.length-1); return next; });
    mark();
  };

  const deleteQ = (i) => {
    setQuestions(qs => {
      const next = qs.filter((_,x)=>x!==i);
      setActiveIdx(prev => Math.min(prev, next.length-1));
      return next;
    });
    mark();
  };

  const updateQ = (i, q) => {
    setQuestions(qs => qs.map((x,idx) => idx===i ? q : x));
    mark();
  };

  /* Excel import */
  const handleExcel = async (file) => {
    try {
      const imported = await parseExcel(file);
      if (!imported.length) { toast?.error('File không có dữ liệu'); return; }
      setQuestions(qs => { const next=[...qs, ...imported]; setActiveIdx(qs.length); return next; });
      toast?.success(`Đã nhập ${imported.length} câu hỏi từ Excel`);
      mark();
    } catch { toast?.error('Lỗi đọc file Excel — kiểm tra lại định dạng'); }
  };

  if (!hw) return (
    <div className={styles.page}>
      <p style={{color:'var(--color-text-tertiary)',padding:'2rem'}}>Không tìm thấy bài tập.</p>
    </div>
  );

  const activeQ = questions[activeIdx] ?? null;

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <button className={styles.backBtn} onClick={() => navigate(`/app/courses/${courseId}`)}>
          <ChevronLeft size={15}/> {course?.name ?? 'Khóa học'}
        </button>
        <div className={styles.heroRow}>
          <div className={styles.heroBody}>
            <div className={styles.heroIcon}><ClipboardList size={20} color="#fff" strokeWidth={1.6}/></div>
            <div>
              <input
                className={styles.heroTitleInput}
                value={title}
                onChange={e => { setTitle(e.target.value); mark(); }}
                placeholder="Tên bài tập..."
              />
              <p className={styles.heroSub}>
                {questions.length} câu hỏi{audioGroups.length > 0 && ` · ${audioGroups.length} nhóm audio`}{imageGroups.length > 0 && ` · ${imageGroups.length} nhóm ảnh`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handlePreview} 
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Play size={14}/> Xem thử
            </button>
            <button className={styles.heroSaveBtn} onClick={handleSave}>
              <Save size={14}/> {dirty ? 'Lưu thay đổi' : 'Đã lưu'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-panel ── */}
      <div className={styles.splitPanel}>
        <QuestionNavigator
          questions={questions}
          activeIdx={activeIdx}
          onSelect={setActiveIdx}
          onAdd={addQuestion}
          onDelete={deleteQ}
          onExcel={handleExcel}
          onDownloadTemplate={downloadTemplate}
          audioGroups={audioGroups}
          onAudioGroupsChange={(gs) => { setAudioGroups(gs); mark(); }}
          imageGroups={imageGroups}
          onImageGroupsChange={(gs) => { setImageGroups(gs); mark(); }}
        />
        <FocusedEditor
          key={activeQ?.id}
          q={activeQ}
          showErrors={showErrors}
          shakeKey={shakeKey}
          idx={activeIdx}
          total={questions.length}
          onChange={(q) => updateQ(activeIdx, q)}
          onPrev={() => setActiveIdx(i => Math.max(0, i-1))}
          onNext={() => setActiveIdx(i => Math.min(questions.length-1, i+1))}
          audioGroups={audioGroups}
          onAudioGroupsChange={(gs) => { setAudioGroups(gs); mark(); }}
          imageGroups={imageGroups}
          onImageGroupsChange={(gs) => { setImageGroups(gs); mark(); }}
          questions={questions}
        />
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div className={styles.bottomBar}>
          <span className={styles.unsavedNote}>Có thay đổi chưa lưu</span>
          <Button variant="primary" onClick={handleSave}><Save size={14}/> Lưu bài tập</Button>
        </div>
      )}
    </div>
  );
};

