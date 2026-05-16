import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Send,
  Headphones, Play, Pause, RotateCcw,
} from 'lucide-react';
import { Card } from '../../design-system/components/Card/Card';
import { Button } from '../../design-system/components/Button/Button';
import { Badge } from '../../design-system/components/Badge/Badge';
import { Stack } from '../../design-system/primitives/Stack';
import { Text } from '../../design-system/primitives/Text';
import { useHomework } from '../../contexts/HomeworkContext';
import { useTeacher } from '../../contexts/TeacherContext';
import { OrderingEditor } from '../AdminCourseDetail/components/OrderingEditor';
import styles from './HomeworkAttempt.module.css';

/* ─────────────────────────────────────────────────────
   AudioPlayer
   Props:
     script      — text to read (Web Speech API / Phase 1)
     label       — display name shown in the card header
     groupIndex  — optional 1-based group number
     totalGroups — optional total group count
   
   Phase 2 upgrade: add `audioUrl` prop; if present use
   <audio> element instead of SpeechSynthesis.
   
   KEY TRICK: give <AudioPlayer key={group.id} /> so React
   remounts the component when the group changes, which:
     1. Resets playCount to 0 for the new group
     2. Triggers the cleanup effect → cancels running TTS
───────────────────────────────────────────────────── */
/* Google Drive: extract file ID */
const getGdriveId = (url) => {
  if (!url) return null;
  const m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
};

/* ─────────────────────────────────────────────────────
   normalizeAssignment
   Chuyển đổi format optA/B/C/D + content (manual editor)
   sang format options[] + text (HomeworkAttempt expects)
───────────────────────────────────────────────────── */
const normalizeQuestion = (q) => {
  if (!q) return q;

  // Luôn resolve text từ content/question nếu chưa có
  const text = q.text ?? q.content ?? q.question ?? '';

  // Nếu đã có options[] (từ file Excel/parser): chỉ bổ sung text còn thiếu
  if (Array.isArray(q.options) && q.options.length > 0) {
    return {
      ...q,
      text,
      // Đảm bảo correctIndex có — Excel format thường dùng detectedAnswer hoặc answer
      correctIndex: q.correctIndex
        ?? (typeof q.detectedAnswer === 'string' && ['A','B','C','D'].includes(q.detectedAnswer)
          ? ['A','B','C','D'].indexOf(q.detectedAnswer)
          : ['A','B','C','D'].indexOf(q.answer) !== -1
            ? ['A','B','C','D'].indexOf(q.answer)
            : null),
    };
  }

  // Format thủ công: optA/optB/optC/optD + content
  const opts = [q.optA, q.optB, q.optC, q.optD].filter(Boolean);
  return {
    ...q,
    text,
    options: opts.length > 0 ? opts : null, // null = không phải trắc nghiệm
    correctIndex: q.correctIndex ?? (['A','B','C','D'].indexOf(q.answer) !== -1
      ? ['A','B','C','D'].indexOf(q.answer)
      : null),
  };
};

const normalizeAssignment = (a) => {
  if (!a) return a;

  const flatQuestions = [];
  (a.questions ?? []).forEach(q => {
    if (q.type === 'listening' && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
      // Flatten: mỗi sub-question trở thành 1 câu riêng, giữ audioUrl để player hiển thị
      q.subQuestions.forEach((sq, idx) => {
        // Build options array từ sq.options object {A, B, C, D}
        let options = null;
        if (sq.type === 'multiple_choice' && sq.options && typeof sq.options === 'object') {
          options = ['A','B','C','D']
            .map(l => sq.options[l] ? `${l}. ${sq.options[l]}` : null)
            .filter(Boolean);
        } else if (sq.type === 'true_false') {
          options = ['Đúng', 'Sai'];
        }

        flatQuestions.push({
          id: sq.id ?? `${q.id}_sq${idx}`,
          type: sq.type === 'fill_blank' ? 'fill_in' : sq.type,
          text: sq.content ?? sq.text ?? '',
          options,
          correctIndex: sq.answer
            ? (options
              ? options.findIndex(o => o.startsWith(sq.answer + '.') || o === sq.answer)
              : null)
            : null,
          answer: sq.answer ?? '',
          explanation: sq.explanation ?? '',
          // Đính kèm audioUrl của câu listening cha để player hiển thị
          audioUrl: q.audioUrl ?? null,
          audioFile: q.audioFile ?? null,
          contentType: 'audio',
          _listeningParentId: q.id,
          _listeningSubIdx: idx,
          _listeningLabel: q.content ?? `Bài nghe ${q.id}`,
        });
      });
    } else {
      flatQuestions.push(normalizeQuestion(q));
    }
  });

  return {
    ...a,
    questions: flatQuestions,
  };
};


const AudioPlayer = ({ script, audioUrl }) => {
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [supported] = useState(() => !!window.speechSynthesis);

  // Cancel TTS when this instance unmounts (group change or page leave)
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const gdriveId = getGdriveId(audioUrl);

  const handlePlay = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(script);
    utt.lang = 'en-US';
    utt.rate = 0.88;
    utt.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
    ) ?? voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) utt.voice = enVoice;

    utt.onstart = () => setPlaying(true);
    utt.onend = () => { setPlaying(false); setPlayCount((c) => c + 1); };
    utt.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utt);
  };

  const handleStop = () => { window.speechSynthesis?.cancel(); setPlaying(false); };

  return (
    <Card padding="md" className={styles.audioCard}>
      {gdriveId ? (
        <div style={{ borderRadius: 10, overflow: 'hidden', background: 'transparent' }}>
          <iframe
            src={`https://drive.google.com/file/d/${gdriveId}/preview`}
            width="100%" height="60" style={{ border: 'none' }} allow="autoplay"
          />
        </div>
      ) : audioUrl && !audioUrl.startsWith('blob:') ? (
        <audio controls src={audioUrl} style={{ width: '100%', height: 40, outline: 'none' }} />
      ) : audioUrl && audioUrl.startsWith('blob:') ? (
        <div style={{ padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
          ⚠️ File audio chỉ khả dụng trong phiên làm việc này. Vui lòng liên hệ giáo viên để dùng link Google Drive thay thế.
        </div>
      ) : (
        <Stack gap="sm">
          {/* Player controls */}
          <div className={styles.playerRow}>
            {/* Animated wave */}
            <div className={`${styles.waveWrap} ${playing ? styles.waveActive : ''}`}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <span key={i} className={styles.waveBar}
                  style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>

            <Stack direction="row" align="center" gap="sm" style={{ marginLeft: 'auto' }}>
              {playing ? (
                <Button variant="danger" size="sm" onClick={handleStop}>
                  <Pause size={14} /> Dừng lại
                </Button>
              ) : (
                <Button variant="primary" size="sm"
                  onClick={handlePlay} disabled={!supported}>
                  {playCount > 0
                    ? <><RotateCcw size={14} /> Nghe lại</>
                    : <><Play size={14} /> Phát audio</>}
                </Button>
              )}
            </Stack>
          </div>

          {/* First-time prompt */}
          {playCount === 0 && !playing && (
            <Text as="p" size="xs" color="textSecondary"
              style={{ margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
              ⬆️ Nhấn "Phát audio" để nghe trước khi làm bài
            </Text>
          )}
        </Stack>
      )}
    </Card>
  );
};

/* ─────────────────────────────────────────────────────
   Helper: given current question ID, find its group
───────────────────────────────────────────────────── */
const findGroup = (audioGroups, questionId) =>
  audioGroups?.find((g) => g.questionIds.includes(questionId)) ?? null;

/* ══════════════════════════════════════════════════
   Student Answer Editors
══════════════════════════════════════════════════ */
const StudentEditorMC = ({ q, value, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {(q.options ?? []).map((opt, idx) => {
        const label = ['A', 'B', 'C', 'D', 'E'][idx];
        const isSelected = value === idx;
        return (
          <button
            key={idx}
            className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
            onClick={() => onChange(idx)}
          >
            <span className={`${styles.optLabel} ${isSelected ? styles.optLabelActive : ''}`}>{label}</span>
            <span className={styles.optText}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
};

const StudentEditorMR = ({ q, value, onChange }) => {
  const selected = Array.isArray(value) ? value : [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {(q.options ?? []).map((opt, idx) => {
        const letter = ['A', 'B', 'C', 'D', 'E'][idx];
        const checked = selected.includes(letter);
        return (
          <button
            key={letter}
            className={`${styles.option} ${styles.optBtnMR} ${checked ? styles.optionSelected : ''}`}
            onClick={() => {
              const next = checked ? selected.filter(x => x !== letter) : [...selected, letter];
              onChange(next);
            }}
          >
            <span className={`${styles.checkbox} ${checked ? styles.checkboxActive : ''}`}>
              {checked ? '✓' : ''}
            </span>
            <span className={styles.optText}>{opt.replace(/^[A-E]\.\s*/, '')}</span>
          </button>
        );
      })}
    </div>
  );
};

const StudentEditorTF = ({ value, onChange }) => (
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

const StudentEditorFill = ({ value, onChange }) => (
  <input className={styles.fillInput}
    placeholder="Nhập câu trả lời..."
    value={value ?? ''}
    onChange={e => onChange(e.target.value)} />
);

const StudentEditorShortAnswer = ({ value, onChange }) => (
  <textarea className={styles.shortAnswerTextarea}
    placeholder="Nhập câu trả lời tự luận..."
    value={value ?? ''}
    onChange={e => onChange(e.target.value)} />
);

const StudentEditorMatching = ({ q, value, onChange }) => {
  const matchVal = (typeof value === 'object' && !Array.isArray(value) && value !== null) ? value : {};
  // Shuffle right-side items once on mount so correct order is not obvious
  const [shuffledRight] = useState(() => {
    const rights = (q.pairs ?? []).map(p => p.right);
    const arr = [...rights];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  return (
    <div className={styles.matchingWrap}>
      {(q.pairs ?? []).map(pair => (
        <div key={pair.left} className={styles.matchRow}>
          <span className={styles.matchLeft}>{pair.left}</span>
          <span className={styles.matchArrow}>→</span>
          <select className={styles.matchSelect}
            value={matchVal[pair.left] ?? ''}
            onChange={e => onChange({ ...matchVal, [pair.left]: e.target.value })}>
            <option value="">-- Chọn đáp án --</option>
            {shuffledRight.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
};

const StudentEditorOrdering = ({ q, value, onChange }) => {
  // Xáo trộn 1 lần khi mount dựa theo q.id để mỗi câu hỏi có shuffle riêng
  const [initItems] = useState(() => {
    if (Array.isArray(value) && value.length > 0) return value;

    const sourceItems = Array.isArray(q.orderItems) && q.orderItems.length > 0
      ? q.orderItems.map(x => (x == null ? '' : String(x)))
      : Array.isArray(q.detectedAnswer) && q.detectedAnswer.length > 0
        ? q.detectedAnswer.map(x => (x == null ? '' : String(x)))
        : [];

    if (sourceItems.length > 0) {
      const shuffled = [...sourceItems];
      let tries = 0;
      while (tries < 8) {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        if (!shuffled.every((v, idx) => v === sourceItems[idx])) break;
        tries++;
      }
      return shuffled;
    }
    return [];
  });

  // Sync initial shuffle lên parent nếu chưa có value
  useEffect(() => {
    if (!value && initItems.length > 0 && initItems[0] !== '') {
      onChange(initItems);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayItems = Array.isArray(value) && value.length > 0 ? value : initItems;
  return <OrderingEditor key={`ordering-${q.id}`} items={displayItems} onChange={onChange} mode="student" />;
};

const StudentEditorLikert = ({ q, value, onChange }) => {
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

const StudentAnswerEditor = ({ q, value, onChange }) => {
  switch (q.type) {
    case 'multiple_choice':   return <StudentEditorMC q={q} value={value} onChange={onChange} />;
    case 'multiple_response': return <StudentEditorMR q={q} value={value} onChange={onChange} />;
    case 'true_false':        return <StudentEditorTF value={value} onChange={onChange} />;
    case 'fill_blank':        return <StudentEditorFill value={value} onChange={onChange} />;
    case 'short_answer':      return <StudentEditorShortAnswer value={value} onChange={onChange} />;
    case 'matching':          return <StudentEditorMatching q={q} value={value} onChange={onChange} />;
    case 'ordering':          return <StudentEditorOrdering q={q} value={value} onChange={onChange} />;
    case 'likert':            return <StudentEditorLikert q={q} value={value} onChange={onChange} />;
    default:                  
      if (q.options) return <StudentEditorMC q={q} value={value} onChange={onChange} />;
      return <StudentEditorFill value={value} onChange={onChange} />;
  }
};


/* ─────────────────────────────────────────────────────
   HomeworkAttempt — main page
───────────────────────────────────────────────────── */
export const HomeworkAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const { assignments, submitAttempt, getAttempts } = useHomework();
  const { assignments: teacherAssignments } = useTeacher();

  const rawAssignment = isPreview
    ? teacherAssignments.find((a) => a.id === id)
    : assignments.find((a) => a.id === id);
  const assignment = normalizeAssignment(rawAssignment);
  const prevAttempts = getAttempts(id);
  const attemptNumber = prevAttempts.length + 1;

  const isListening = assignment?.type === 'listening';
  const isGrouped = isListening && assignment?.audioMode === 'grouped';
  const isSingle = isListening && !isGrouped;

  const [answers, setAnswers] = useState(() =>
    Array(assignment?.questions?.length ?? 0).fill(null)
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Stop TTS on unmount (page leave / back navigation)
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  if (!assignment) {
    return (
      <Stack align="center" gap="lg" style={{ padding: 'var(--spacing-3xl)' }}>
        <Text as="p" color="textSecondary" style={{ margin: 0 }}>Không tìm thấy bài tập.</Text>
        <Button variant="outline" onClick={() => navigate('/app/homework')}>← Quay lại</Button>
      </Stack>
    );
  }

  if (!assignment.questions || assignment.questions.length === 0) {
    return (
      <Stack align="center" gap="lg" style={{ padding: 'var(--spacing-3xl)' }}>
        <Text as="p" color="textSecondary" style={{ margin: 0 }}>Bài tập này chưa có nội dung (hoặc giáo viên chưa tải xong). Vui lòng báo giáo viên kiểm tra lại.</Text>
        <Button variant="outline" onClick={() => navigate('/app/homework')}>← Quay lại</Button>
      </Stack>
    );
  }

  const isStudentAnswered = (a) => {
    if (a === null || a === undefined || a === '') return false;
    if (Array.isArray(a) && a.length === 0) return false;
    if (typeof a === 'object' && Object.keys(a).every(k => !a[k])) return false;
    return true;
  };

  const q = assignment.questions[currentQ];
  const total = assignment.questions.length;
  const answered = answers.filter(isStudentAnswered).length;
  const allAnswered = answered === total;

  // For grouped mode: derive the active group
  const activeGroup = isGrouped ? findGroup(assignment.audioGroups, q.id) : null;

  const selectOption = (idx) =>
    setAnswers((prev) => { const next = [...prev]; next[currentQ] = idx; return next; });

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    window.speechSynthesis?.cancel();

    if (isPreview) {
      alert("Chế độ xem thử: Bài làm sẽ không được lưu vào hệ thống.");
      navigate(-1);
      return;
    }

    const result = submitAttempt(id, answers);
    if (!result) {
      console.warn('[HomeworkAttempt] submitAttempt returned null — bài tập không tìm thấy trong danh sách học sinh');
    }
    navigate(`/app/homework/${id}/result`);
  };

  const goBack = () => { window.speechSynthesis?.cancel(); navigate('/app/homework'); };

  return (
    <div className={styles.page}>

      {/* ── Back + title ── */}
      <Stack gap="xs">
        <Button variant="ghost" size="sm" onClick={goBack}
          style={{ alignSelf: 'flex-start', paddingLeft: 0 }}>
          <ChevronLeft size={16} /> Danh sách bài tập
        </Button>
        <Stack direction="row" align="center" gap="md" style={{ flexWrap: 'wrap' }}>
          <Text as="h1" size="xl" weight="bold" color="textPrimary"
            style={{ margin: 0, fontFamily: 'inherit', fontSize: 'var(--font-size-xl)' }}>
            {assignment.title}
          </Text>
          {isPreview ? (
            <Badge variant="warning">Chế độ xem thử</Badge>
          ) : (
            <Badge variant="primary">Lần {attemptNumber}</Badge>
          )}
          {isListening && <Badge variant="default"><Headphones size={11} /> Bài nghe</Badge>}
          {isGrouped && (
            <Badge variant="default">
              {assignment.audioGroups.length} đoạn nghe
            </Badge>
          )}
        </Stack>
      </Stack>

      {/* ── Audio Player ── */}
      {isSingle && (
        /* Single mode: one player at top, never remounts */
        <AudioPlayer
          key="single"
          script={assignment.script}
          audioUrl={assignment.audioUrl}
        />
      )}

      {isGrouped && activeGroup && (
        /*
         * Grouped mode: key = activeGroup.id
         * When student moves to a question in a different group,
         * React remounts this component → cleanup cancels TTS + resets playCount
         */
        <AudioPlayer
          key={activeGroup.id}
          script={activeGroup.script}
          audioUrl={activeGroup.audioUrl}
        />
      )}

      {/* ── Progress dots ── */}
      <Stack direction="row" align="center" gap="md" style={{ flexWrap: 'wrap' }}>
        <div className={styles.dots}>
          {assignment.questions.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot}
                ${i === currentQ ? styles.dotActive : ''}
                ${isStudentAnswered(answers[i]) ? styles.dotAnswered : ''}
              `}
              onClick={() => setCurrentQ(i)}
              aria-label={`Câu ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <Text as="span" size="xs" color="textSecondary">
          {answered}/{total} đã trả lời
        </Text>
      </Stack>

      {/* ── Question card ── */}
      <Card padding="lg" variant="elevated">
        <Stack gap="xl">
          <Stack gap="sm">
            <Stack direction="row" align="center" gap="sm" style={{ flexWrap: 'wrap' }}>
              <Text as="span" size="xs" weight="semibold" color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Câu {currentQ + 1} / {total}
              </Text>
              {isGrouped && activeGroup && (
                <Badge variant="primary" style={{ fontSize: '10px' }}>
                  {activeGroup.label}
                </Badge>
              )}
              {q._listeningParentId && (
                <Badge variant="default" style={{ fontSize: '10px', background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                  <Headphones size={10} style={{ marginRight: 3 }} /> Bài nghe
                </Badge>
              )}
            </Stack>
            <Text as="div" size="lg" weight="semibold" color="textPrimary"
              style={{ margin: 0, lineHeight: 1.55 }}>
              {(() => {
                if (!q.text) return <span style={{ fontStyle: 'italic', color: 'var(--color-text-tertiary)', fontWeight: 'normal' }}>Chưa nhập đề bài</span>;
                const lines = q.text.split('\n');
                const firstLine = lines[0];
                const restLines = lines.slice(1).join('\n');
                return (
                  <>
                    <span>{firstLine}</span>
                    {restLines && (
                      <span style={{ display: 'block', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-normal)', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                        {restLines}
                      </span>
                    )}
                  </>
                );
              })()}
            </Text>
          </Stack>

          {/* Per-question audio (contentType = 'audio' or individual audioUrl) */}
          {(() => {
            const qAudioGroup = !isGrouped
              ? assignment.audioGroups?.find(g => g.questionIds?.includes(q.id))
              : null;
            const audioSrc = qAudioGroup?.audioUrl || (q.contentType === 'audio' || q.type === 'listening' ? q.audioUrl : null);
            if (!audioSrc) return null;
            const gdriveId = getGdriveId(audioSrc);
            return (
              <div style={{
                borderRadius: 14, overflow: 'hidden',
                background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
                border: '1.5px solid #c7d2fe',
                padding: '12px 14px',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Headphones size={14} color="white" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Đoạn nghe
                  </span>
                </div>

                {/* Player */}
                {gdriveId ? (
                  <div style={{ borderRadius: 10, overflow: 'hidden', background: 'white', border: '1px solid #e0e7ff' }}>
                    <iframe
                      src={`https://drive.google.com/file/d/${gdriveId}/preview`}
                      width="100%" height="56"
                      style={{ border: 'none', display: 'block' }}
                      allow="autoplay"
                    />
                  </div>
                ) : (
                  <div style={{
                    background: 'white', borderRadius: 10,
                    border: '1px solid #e0e7ff', padding: '6px 10px',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <audio
                      controls
                      src={audioSrc}
                      style={{ width: '100%', height: 36, outline: 'none', display: 'block', accentColor: '#6366f1' }}
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Per-question image */}
          {(() => {
            const qImageGroup = assignment.imageGroups?.find(g => g.questionIds?.includes(q.id));
            const imageSrc = qImageGroup?.imageUrl || (q.contentType === 'image' ? q.imageUrl : null);
            if (!imageSrc) return null;
            return (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <img src={imageSrc} alt="" style={{ width: '100%', display: 'block', maxHeight: 300, objectFit: 'contain' }} />
              </div>
            );
          })()}

          <Stack gap="sm">
            <StudentAnswerEditor
              key={q.id ?? currentQ}
              q={q}
              value={answers[currentQ]}
              onChange={(val) => setAnswers(prev => { const n = [...prev]; n[currentQ] = val; return n; })}
            />
          </Stack>
        </Stack>
      </Card>

      {/* ── Navigation ── */}
      <Stack direction="row" justify="space-between" align="center">
        <Button variant="outline" size="md" disabled={currentQ === 0}
          onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}>
          <ChevronLeft size={16} /> Câu trước
        </Button>

        {currentQ < total - 1 ? (
          <Button variant="primary" size="md"
            onClick={() => setCurrentQ((q) => Math.min(total - 1, q + 1))}>
            Câu sau <ChevronRight size={16} />
          </Button>
        ) : (
          <Button variant="primary" size="md"
            disabled={!allAnswered} loading={submitting} onClick={handleSubmit}>
            <Send size={15} /> Nộp bài
          </Button>
        )}
      </Stack>

      {/* ── Submit warning ── */}
      {!allAnswered && currentQ === total - 1 && (
        <Card padding="sm" variant="outlined" className={styles.warningCard}>
          <Text as="p" size="sm" color="textSecondary"
            style={{ margin: 0, textAlign: 'center' }}>
            ⚠️ Còn {total - answered} câu chưa trả lời — kiểm tra lại trước khi nộp!
          </Text>
        </Card>
      )}
    </div>
  );
};
