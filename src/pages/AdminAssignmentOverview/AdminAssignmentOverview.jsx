import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, CheckCircle, Headphones, LayoutList, Image as ImageIcon, Lightbulb, Play, Eye, EyeOff, Send, Users, Trash2 } from 'lucide-react';
import { useTeacher } from '../../contexts/TeacherContext';
import styles from './AdminAssignmentOverview.module.css';
import { InviteClassModal } from '../AdminCourseDetail/AdminCourseDetail';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const getGdriveId = (url) => {
  if (!url) return null;
  const m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
};

export const AdminAssignmentOverview = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { assignments, courses, updateAssignment, deleteAssignment } = useTeacher();
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const course = courses.find((c) => c.id === courseId);
  const assignment = assignments.find((a) => a.id === assignmentId);

  if (!assignment) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-text-tertiary)', padding: '2rem' }}>Không tìm thấy bài tập.</p>
        <button onClick={() => navigate(`/app/courses/${courseId}`)}>Quay lại</button>
      </div>
    );
  }

  const questions = assignment.questions || [];
  const answeredCount = questions.filter(q => {
    if (q.answerType === 'multiple') return q.correctIdxs && q.correctIdxs.length > 0;
    return q.correctIdx !== null && q.correctIdx !== undefined;
  }).length;

  const renderMediaBlock = (q) => {
    const audioGroup = assignment.audioGroups?.find(g => g.questionIds?.includes(q.id));
    const imageGroup = assignment.imageGroups?.find(g => g.questionIds?.includes(q.id));

    const isFirstInAudio = audioGroup && audioGroup.questionIds[0] === q.id;
    const isFirstInImage = imageGroup && imageGroup.questionIds[0] === q.id;

    if (!isFirstInAudio && !isFirstInImage) return null;

    return (
      <div className={styles.mediaBox}>
        {isFirstInImage && imageGroup.imageUrl && (
          <>
            <span className={styles.mediaLabel}>
              <ImageIcon size={13} /> Hình ảnh đính kèm
            </span>
            <img src={imageGroup.imageUrl} alt="" className={styles.mediaImage} />
          </>
        )}

        {isFirstInAudio && audioGroup.audioUrl && (
          <>
            <span className={styles.mediaLabel}>
              <Headphones size={13} /> Đoạn nghe
            </span>
            {getGdriveId(audioGroup.audioUrl) ? (
              <iframe
                src={`https://drive.google.com/file/d/${getGdriveId(audioGroup.audioUrl)}/preview`}
                className={styles.mediaIframe}
                allow="autoplay"
              />
            ) : (
              <audio controls src={audioGroup.audioUrl} className={styles.mediaAudio} />
            )}
          </>
        )}
      </div>
    );
  };

  const renderQuestion = (q, absoluteIndex) => (
    <div key={q.id} className={styles.questionItem}>
      {/* Question header with number badge */}
      <div className={styles.questionHeader}>
        <div className={styles.questionBadge}>{absoluteIndex + 1}</div>
        <div className={`${styles.questionText} ${!q.text ? styles.questionTextEmpty : ''}`}>
          {(() => {
            if (!q.text) return 'Chưa nhập đề bài';
            const lines = q.text.split('\n');
            const firstLine = lines[0];
            const restLines = lines.slice(1).join('\n');
            return (
              <>
                <span>{firstLine}</span>
                {restLines && (
                  <span className={styles.qTextRestLines}>
                    {restLines}
                  </span>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Media (audio/image) — between question and options */}
      {renderMediaBlock(q)}

      {/* Options grid */}
      <div className={styles.optionsGrid}>
        {q.options?.map((opt, i) => {
          const isCorrect =
            q.answerType === 'multiple'
              ? (q.correctIdxs || []).includes(i)
              : q.correctIdx === i;
          return (
            <div key={i} className={`${styles.opt} ${isCorrect ? styles.optCorrect : ''}`}>
              <div className={`${styles.optLetter} ${isCorrect ? styles.letterCorrect : ''}`}>
                {OPTION_LABELS[i]}
              </div>
              <span className={styles.optText}>
                {opt || <em style={{ color: 'var(--color-text-tertiary)' }}>Trống</em>}
              </span>
              {isCorrect && <CheckCircle size={16} className={styles.correctIcon} />}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {q.explanation && (
        <div className={styles.explanationBox}>
          <Lightbulb size={15} className={styles.explanationIcon} />
          <p className={styles.explanationText}>
            <strong>Giải thích:</strong> {q.explanation}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.blob}></div>
        <div className={styles.blob2}></div>
        <button className={styles.backBtn} onClick={() => navigate(`/app/courses/${courseId}`)}>
          <ChevronLeft size={16} /> Khóa học: {course?.name ?? 'Course'}
        </button>
        <div className={styles.heroRow}>
          <div>
            <h1 className={styles.heroTitle}>{assignment.title}</h1>
            <div className={styles.heroMeta}>
              <span className={`${styles.metaPill} ${styles.metaMuted}`}>
                {questions.length} câu hỏi
              </span>
              {assignment.type === 'listening' ? (
                <span className={`${styles.metaPill} ${styles.metaMuted}`}>
                  <Headphones size={12} /> Bài nghe
                </span>
              ) : (
                <span className={`${styles.metaPill} ${styles.metaMuted}`}>
                  <LayoutList size={12} /> Bài đọc/Quiz
                </span>
              )}
              {assignment.status === 'draft' && <span className={`${styles.metaPill} ${styles.metaWarning}`}>Nháp</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px', zIndex: 1, position: 'relative' }}>
          <button
            className={styles.pillSecondary}
            onClick={() => setInviteOpen(true)}
          >
            <Users size={14} /> Giao bài
          </button>
          <button
            className={styles.pillSecondary}
            onClick={() => navigate(`/app/homework/${assignmentId}/attempt?preview=true`)}
          >
            <Play size={14} /> Thử làm bài
          </button>
          <button
            className={styles.pillSecondary}
            onClick={() => updateAssignment(assignmentId, { status: assignment.status === 'draft' ? 'published' : 'draft' })}
          >
            <Send size={14} /> {assignment.status === 'draft' ? 'Xuất bản' : 'Hủy xuất bản'}
          </button>
          <button
            className={styles.pillDanger}
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
                deleteAssignment(assignmentId);
                navigate(`/app/courses/${courseId}`);
              }
            }}
          >
            <Trash2 size={14} /> Xóa
          </button>
          <button
            className={styles.pillPrimary}
            onClick={() => navigate(`/app/courses/${courseId}/assignments/${assignmentId}/edit`)}
          >
            <Pencil size={14} /> Chỉnh sửa
          </button>
        </div>
      </div>

      {/* ── Questions ── */}
      <div className={styles.contentWrapper}>
        <div className={styles.groupCard}>
          <div className={styles.questionList}>
            {questions.map((q, idx) => renderQuestion(q, idx))}
          </div>
        </div>
      </div>

      {/* ── Summary ── */}
      <div className={styles.summaryFooter}>
        <p className={styles.summaryText}>
          Tổng cộng <span className={styles.summaryHighlight}>{questions.length}</span> câu hỏi
          {' · '}
          <span className={styles.summaryHighlight}>{answeredCount}</span> câu đã có đáp án
        </p>
      </div>

      {inviteOpen && (
        <InviteClassModal
          open={inviteOpen}
          mode="single"
          courseId={courseId}
          hwId={assignmentId}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </div>
  );
};
