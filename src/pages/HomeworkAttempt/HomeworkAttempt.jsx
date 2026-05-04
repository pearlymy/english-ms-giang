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
      ) : audioUrl ? (
        <audio controls src={audioUrl} style={{ width: '100%', height: 40, outline: 'none' }} />
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

  const assignment = isPreview
    ? teacherAssignments.find((a) => a.id === id)
    : assignments.find((a) => a.id === id);
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

  const q = assignment.questions[currentQ];
  const total = assignment.questions.length;
  const answered = answers.filter((a) => a !== null).length;
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

    submitAttempt(id, answers);
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
                ${answers[i] !== null ? styles.dotAnswered : ''}
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
            <Stack direction="row" align="center" gap="sm">
              <Text as="span" size="xs" weight="semibold" color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Câu {currentQ + 1} / {total}
              </Text>
              {isGrouped && activeGroup && (
                <Badge variant="primary" style={{ fontSize: '10px' }}>
                  {activeGroup.label}
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
            // Check per-question audio group first, then individual audioUrl
            const qAudioGroup = !isGrouped
              ? assignment.audioGroups?.find(g => g.questionIds?.includes(q.id))
              : null;
            const audioSrc = qAudioGroup?.audioUrl || (q.contentType === 'audio' ? q.audioUrl : null);
            if (!audioSrc) return null;
            const gdriveId = getGdriveId(audioSrc);
            return (
              <div style={{ borderRadius: 10, overflow: 'hidden', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <Headphones size={13} /> Đoạn nghe
                </div>
                {gdriveId ? (
                  <iframe
                    src={`https://drive.google.com/file/d/${gdriveId}/preview`}
                    width="100%" height="60"
                    style={{ border: 'none', borderRadius: 8, display: 'block' }}
                    allow="autoplay"
                  />
                ) : (
                  <audio controls src={audioSrc} style={{ width: '100%', height: 40, outline: 'none', display: 'block' }} />
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
            {q.options.map((opt, idx) => {
              const label = ['A', 'B', 'C', 'D'][idx];
              const isSelected = answers[currentQ] === idx;
              return (
                <button
                  key={idx}
                  className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                  onClick={() => selectOption(idx)}
                >
                  <span className={`${styles.optLabel} ${isSelected ? styles.optLabelActive : ''}`}>
                    {label}
                  </span>
                  <span className={styles.optText}>{opt}</span>
                </button>
              );
            })}
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
