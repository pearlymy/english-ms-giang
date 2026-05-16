/**
 * ListeningQuestionCard.jsx
 * UI for creating a Listening-type question in ManualMode.
 * Uses mock audio URL; no real upload API required.
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Play, Pause, Headphones, Plus, Trash2,
  FileText, ChevronDown, ChevronUp, AlertCircle, Volume2, Link2,
} from 'lucide-react';
import styles from './ListeningQuestionCard.module.css';

/* ── Constants ── */
const MOCK_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const SUB_TYPES = [
  { value: 'multiple_choice', label: 'Trắc nghiệm (A/B/C/D)' },
  { value: 'true_false',      label: 'Đúng / Sai' },
  { value: 'fill_blank',      label: 'Điền vào chỗ trống' },
  { value: 'short_answer',    label: 'Trả lời ngắn' },
];

export const defaultListeningQuestion = (id) => ({
  id,
  type: 'listening',
  audioFile: null,
  audioUrl: null,
  isMock: false,
  transcript: '',
  subQuestions: [defaultSubQuestion()],
});

export const defaultSubQuestion = () => ({
  id: Date.now() + Math.random(),
  type: 'multiple_choice',
  content: '',
  options: { A: '', B: '', C: '', D: '' },
  answer: '',
  explanation: '',
});

/** Returns true if the listening question has minimum required data.
 *  Audio is OPTIONAL — teacher can upload it later.
 *  Only requires at least 1 sub-question with content.
 */
export const isListeningValid = (q) =>
  (q.subQuestions?.length ?? 0) > 0 &&
  q.subQuestions.some(sq => sq.content.trim());

/* ══════════════════════════════════════════════════
   AudioPlayer — minimal, styled
══════════════════════════════════════════════════ */
const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
    setPlaying(p => !p);
  };

  const fmt = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const seek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  };

  return (
    <div className={styles.audioPlayer}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
      />
      <button className={styles.playBtn} onClick={toggle} title={playing ? 'Dừng' : 'Phát'}>
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className={styles.playerMid}>
        <div className={styles.progressTrack} onClick={seek}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
        </div>
        <div className={styles.timeRow}>
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <Volume2 size={14} color="#94a3b8" />
    </div>
  );
};

/* ══════════════════════════════════════════════════
   SubQuestionEditor
══════════════════════════════════════════════════ */
const SubQuestionEditor = ({ sq, idx, onChange, onRemove, canRemove }) => {
  const update = (patch) => onChange({ ...sq, ...patch });

  return (
    <div className={styles.subQCard}>
      <div className={styles.subQHeader}>
        <span className={styles.subQNum}>Câu {idx + 1}</span>
        <select
          className={styles.subQTypeSelect}
          value={sq.type}
          onChange={e => update({ type: e.target.value, answer: '', options: { A: '', B: '', C: '', D: '' } })}
        >
          {SUB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {canRemove && (
          <button className={styles.subQRemoveBtn} onClick={onRemove} title="Xoá câu này">
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <textarea
        className={styles.subQContent}
        placeholder="Nội dung câu hỏi..."
        rows={2}
        value={sq.content}
        onChange={e => update({ content: e.target.value })}
      />

      {/* Multiple choice options */}
      {sq.type === 'multiple_choice' && (
        <div className={styles.subQOptions}>
          {['A', 'B', 'C', 'D'].map(l => (
            <div key={l} className={styles.subQOptRow}>
              <span className={styles.subQOptLabel}>{l}.</span>
              <input
                className={styles.subQOptInput}
                placeholder={`Lựa chọn ${l}...`}
                value={sq.options?.[l] || ''}
                onChange={e => update({ options: { ...sq.options, [l]: e.target.value } })}
              />
            </div>
          ))}
          <div className={styles.subQAnswerRow}>
            <span className={styles.subQAnswerLabel}>Đáp án đúng:</span>
            <div className={styles.answerBtns}>
              {['A', 'B', 'C', 'D'].map(l => (
                <button
                  key={l}
                  className={`${styles.answerBtn} ${sq.answer === l ? styles.answerBtnActive : ''}`}
                  onClick={() => update({ answer: l })}
                >{l}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* True / False */}
      {sq.type === 'true_false' && (
        <div className={styles.subQAnswerRow}>
          <span className={styles.subQAnswerLabel}>Đáp án đúng:</span>
          <div className={styles.answerBtns}>
            {['Đúng', 'Sai'].map(l => (
              <button
                key={l}
                className={`${styles.answerBtn} ${sq.answer === l ? styles.answerBtnActive : ''}`}
                onClick={() => update({ answer: l })}
              >{l}</button>
            ))}
          </div>
        </div>
      )}

      {/* Fill blank / Short answer */}
      {(sq.type === 'fill_blank' || sq.type === 'short_answer') && (
        <div className={styles.subQAnswerRow}>
          <span className={styles.subQAnswerLabel}>
            {sq.type === 'fill_blank' ? 'Đáp án điền vào:' : 'Đáp án mẫu:'}
          </span>
          <input
            className={styles.subQTextAnswer}
            placeholder="Nhập đáp án..."
            value={sq.answer}
            onChange={e => update({ answer: e.target.value })}
          />
        </div>
      )}

      {/* Explanation */}
      <div className={styles.subQExplRow}>
        <label className={styles.subQExplLabel}>💡 Giải thích (tuỳ chọn)</label>
        <textarea
          className={styles.subQExplInput}
          placeholder="Nhập giải thích để học sinh hiểu sau khi xem kết quả..."
          rows={2}
          value={sq.explanation}
          onChange={e => update({ explanation: e.target.value })}
        />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   ListeningQuestionCard — main export
══════════════════════════════════════════════════ */
export const ListeningQuestionCard = ({ q, onChange }) => {
  const audioInputRef = useRef(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioDragging, setAudioDragging] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkSaved, setLinkSaved] = useState(false);

  const update = (patch) => onChange({ ...q, ...patch });

  const saveLink = (url) => {
    const v = url.trim();
    if (!v) return;
    update({ audioUrl: v, audioFile: null, isMock: false });
    setLinkInput('');
    setLinkSaved(true);
    setTimeout(() => setLinkSaved(false), 2500);
  };

  const handleAudioFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    update({ audioFile: file, audioUrl: url, isMock: false });
  };

  // Drag-and-drop handler
  const handleAudioDrop = useCallback((e) => {
    e.preventDefault();
    setAudioDragging(false);
    const file = Array.from(e.dataTransfer.files)
      .find(f => /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(f.name));
    if (file) handleAudioFile(file);
  }, []);

  const useMockAudio = () => {
    update({ audioUrl: MOCK_AUDIO_URL, audioFile: null, isMock: true });
  };

  const clearAudio = () => update({ audioUrl: null, audioFile: null, isMock: false });

  const addSubQuestion = () => update({
    subQuestions: [...q.subQuestions, defaultSubQuestion()],
  });

  const updateSubQ = (idx, updated) => {
    const sqs = [...q.subQuestions];
    sqs[idx] = updated;
    update({ subQuestions: sqs });
  };

  const removeSubQ = (idx) => update({
    subQuestions: q.subQuestions.filter((_, i) => i !== idx),
  });

  const missingSubQs = q.subQuestions.filter(sq => !sq.content.trim()).length;

  return (
    <div className={styles.listeningCard}>

      {/* ── Header ── */}
      <div className={styles.listeningHeader}>
        <div className={styles.listeningBadge}>
          <Headphones size={13} /> Listening
        </div>
        {!q.audioUrl && (
          <span className={styles.warnBadge}>
            <AlertCircle size={12} /> Chưa có audio
          </span>
        )}
        {q.audioUrl && missingSubQs > 0 && (
          <span className={styles.warnBadge}>
            <AlertCircle size={12} /> {missingSubQs} câu chưa đầy đủ
          </span>
        )}
        {q.audioUrl && missingSubQs === 0 && q.subQuestions.length > 0 && (
          <span className={styles.validBadge}>✓ Hợp lệ</span>
        )}
      </div>

      {/* ── Audio Section ── */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          🎧 File Audio
          {!q.audioUrl && <span className={styles.audioOptionalHint}>(có thể upload sau)</span>}
        </label>

        {q.audioUrl ? (
          // Đã có audio — player + drag-drop để đổi
          <div
            className={`${styles.audioUploaded} ${audioDragging ? styles.audioUploadedDragging : ''}`}
            onDragOver={e => { e.preventDefault(); setAudioDragging(true); }}
            onDragLeave={() => setAudioDragging(false)}
            onDrop={handleAudioDrop}
          >
            {/* Nếu là link (không phải blob), dùng audio tag thông thường */}
            {q.audioUrl.startsWith('blob:') || q.audioUrl.startsWith('http') ? (
              q.audioUrl.startsWith('blob:') ? (
                <AudioPlayer src={q.audioUrl} />
              ) : (
                (() => {
                  const m = q.audioUrl.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{25,})/);
                  const gid = m ? m[1] : null;
                  return gid ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${gid}/preview`}
                      width="100%" height="60"
                      style={{ border: 'none', borderRadius: 8, display: 'block' }}
                      allow="autoplay"
                    />
                  ) : (
                    <audio controls src={q.audioUrl} style={{ width: '100%', height: 40, display: 'block' }} />
                  );
                })()
              )
            ) : (
              <AudioPlayer src={q.audioUrl} />
            )}
            <div className={styles.audioMeta}>
              {q.isMock
                ? <span className={styles.mockBadge}>🎵 Audio demo</span>
                : q.audioUrl.startsWith('blob:')
                  ? <span className={styles.audioName}>{q.audioFile?.name}</span>
                  : <span className={styles.audioName} style={{ fontSize: 12, color: '#6366f1', wordBreak: 'break-all' }}>🔗 {q.audioUrl.length > 60 ? q.audioUrl.slice(0, 57) + '...' : q.audioUrl}</span>
              }
              {audioDragging
                ? <span className={styles.audioDraggingHint}>↓ Thả file mới vào đây</span>
                : <button className={styles.changeAudioBtn} onClick={clearAudio}>Thay đổi</button>
              }
            </div>
          </div>
        ) : (
          // Chưa có audio — drag-drop zone + link input
          <div>
            <div
              className={`${styles.audioUploadZone} ${audioDragging ? styles.audioUploadZoneDragging : ''}`}
              style={{ marginBottom: 10 }}
              onDragOver={e => { e.preventDefault(); setAudioDragging(true); }}
              onDragLeave={() => setAudioDragging(false)}
              onDrop={handleAudioDrop}
              onClick={() => audioInputRef.current?.click()}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.aac,.flac,audio/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleAudioFile(f); }}
              />
              {audioDragging ? (
                <>
                  <div className={styles.audioUploadIcon} style={{ fontSize: 32 }}>↓</div>
                  <p className={styles.audioUploadTitle} style={{ color: '#4f46e5', fontWeight: 700 }}>
                    Thả file audio vào đây!
                  </p>
                </>
              ) : (
                <>
                  <div className={styles.audioUploadIcon}><Upload size={28} /></div>
                  <p className={styles.audioUploadTitle}>Kéo thả hoặc chọn file audio</p>
                  <p className={styles.audioUploadHint}>MP3, WAV, M4A, OGG · tối đa 50MB</p>
                  <div className={styles.audioUploadActions}>
                    <button
                      className={styles.chooseAudioBtn}
                      onClick={e => { e.stopPropagation(); audioInputRef.current?.click(); }}
                    >
                      Chọn file
                    </button>
                    <button
                      className={styles.mockAudioBtn}
                      onClick={e => { e.stopPropagation(); useMockAudio(); }}
                    >
                      🎵 Dùng audio demo
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── Dán link Google Drive / URL ── */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                border: `1.5px ${linkSaved ? 'solid #10b981' : 'dashed #c7d2fe'}`,
                borderRadius: 10, padding: '6px 10px',
                background: linkSaved ? '#f0fdf4' : '#f8fafc',
                transition: 'all 0.25s',
              }}>
                <Link2 size={13} style={{ color: linkSaved ? '#10b981' : '#6366f1', flexShrink: 0 }} />
                <input
                  style={{
                    flex: 1, border: 'none', background: 'transparent', outline: 'none',
                    fontSize: 13, color: '#334155',
                  }}
                  placeholder={linkSaved ? 'Đã lưu link thành công!' : 'Dán link Google Drive / URL audio...'}
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  onPaste={e => {
                    const text = e.clipboardData.getData('text').trim();
                    if (text) {
                      e.preventDefault();
                      setLinkInput(text);
                      saveLink(text);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); saveLink(linkInput); }
                  }}
                />
              </div>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); saveLink(linkInput); }}
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
        )}
      </div>

      {/* ── Transcript (collapsible) ── */}
      <div className={styles.section}>
        <button className={styles.transcriptToggle} onClick={() => setShowTranscript(v => !v)}>
          <FileText size={13} />
          <span>Transcript</span>
          <span className={styles.transcriptOptional}>(tuỳ chọn)</span>
          {showTranscript ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {showTranscript && (
          <textarea
            className={styles.transcriptInput}
            placeholder="Nhập nội dung transcript của audio để học sinh tham khảo sau khi nộp bài..."
            rows={5}
            value={q.transcript}
            onChange={e => update({ transcript: e.target.value })}
          />
        )}
      </div>

      {/* ── Sub-questions ── */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          📝 Câu hỏi từ audio
          <span className={styles.subQCount}>{q.subQuestions.length} câu</span>
        </label>

        <div className={styles.subQList}>
          {q.subQuestions.map((sq, idx) => (
            <SubQuestionEditor
              key={sq.id}
              sq={sq}
              idx={idx}
              onChange={updated => updateSubQ(idx, updated)}
              onRemove={() => removeSubQ(idx)}
              canRemove={q.subQuestions.length > 1}
            />
          ))}
        </div>

        <button className={styles.addSubQBtn} onClick={addSubQuestion}>
          <Plus size={14} /> Thêm câu hỏi
        </button>
      </div>

    </div>
  );
};
