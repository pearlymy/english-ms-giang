import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Award, Users, CheckCircle2,
  Zap, Target, MessageCircle, Sparkles, Heart, Star
} from 'lucide-react';
import { Button } from '../../design-system/components/Button/Button';
import { TextField } from '../../design-system/components/TextField/TextField';
import { Select } from '../../design-system/components/Select/Select';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import styles from './LandingPage.module.css';

const features = [
  {
    icon: <Heart size={24} />,
    title: 'Học vui, không áp lực',
    desc: 'Lớp học sử dụng trò chơi, bài hát và hoạt động tương tác – giúp các con yêu thích tiếng Anh từ sớm.',
  },
  {
    icon: <Target size={24} />,
    title: 'Nền tảng vững chắc',
    desc: 'Xây dựng 4 kỹ năng Nghe – Nói – Đọc – Viết theo hệ thống bài bản, sát với chương trình trên lớp.',
  },
  {
    icon: <MessageCircle size={24} />,
    title: 'Lớp học nhỏ 5–8 em',
    desc: 'Sĩ số ít giúp cô quan tâm từng con. Mỗi bé được sửa lỗi phát âm và giao tiếp trực tiếp.',
  },
  {
    icon: <Zap size={24} />,
    title: 'Cải thiện điểm số nhanh',
    desc: 'Ôn luyện sát đề thi trường. Nhiều học viên tăng điểm tiếng Anh ngay trong học kỳ đầu.',
  },
  {
    icon: <BookOpen size={24} />,
    title: 'Giáo trình chuẩn – Linh hoạt',
    desc: 'Giáo trình biên soạn riêng cho từng cấp học, có thể bổ sung bài tập theo đề trường của con.',
  },
  {
    icon: <Sparkles size={24} />,
    title: 'Phụ huynh theo dõi dễ dàng',
    desc: 'Hệ thống LMS giúp ba mẹ xem bài tập, kết quả kiểm tra và nhận thông báo mỗi buổi học.',
  },
];

const testimonials = [
  {
    name: 'Chị Thanh Hương',
    role: 'Phụ huynh bé Minh, lớp 4',
    text: 'Con mình vốn rất sợ tiếng Anh, nhưng sau 2 tháng học với cô Giang thì con đòi học thêm buổi nữa. Cô kiên nhẫn và vui tính lắm!',
  },
  {
    name: 'Anh Quốc Bảo',
    role: 'Phụ huynh bé Linh, lớp 7',
    text: 'Điểm tiếng Anh của con tăng từ 6 lên 8.5 chỉ sau một học kỳ. Cô Giang dạy rất sát đề thi trường và giải thích ngữ pháp cực dễ hiểu.',
  },
  {
    name: 'Chị Bích Phương',
    role: 'Phụ huynh bé Nam, lớp 2',
    text: 'Ba mẹ bận mà vẫn biết con học gì nhờ app LMS. Mỗi buổi cô đều gửi nhận xét và bài tập về nhà qua hệ thống, rất tiện!',
  },
];

const gradeOptions = [
  {
    group: 'Cấp 1 (Tiểu học)',
    items: [1,2,3,4,5].map(l => ({ value: String(l), label: `Lớp ${l}` })),
  },
  {
    group: 'Cấp 2 (THCS)',
    items: [6,7,8,9].map(l => ({ value: String(l), label: `Lớp ${l}` })),
  },
];

export const LandingPage = () => {
  const formRef = useRef(null);
  const navigate = useNavigate();
  const [grade, setGrade] = React.useState('');

  // Scroll animation refs
  const featuresRef    = useScrollAnimation();
  const credRef        = useScrollAnimation();
  const credMetricsRef = useScrollAnimation();
  const testimonialRef = useScrollAnimation();
  const formSectionRef = useScrollAnimation();

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* =================== HERO =================== */}
      {/* Hero is visible on load — no scroll animation needed */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          {/* Left: Content */}
          <div>
            <div className={`${styles.heroBadge} anim-fade-up`}>
              <Sparkles size={13} />
              Dành cho học sinh từ lớp 1 đến lớp 9
            </div>
            <h1 className={styles.heroTitle}>
              Con tự tin tiếng Anh—<br />
              <span className={styles.heroTitleAccent}>Ba mẹ an tâm</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Cô Hương Giang đồng hành cùng các con học sinh từ cấp 1 đến cấp 2 trong
              hành trình xây dựng nền tảng tiếng Anh vững chắc — học vui, hiểu sâu, dùng được.
            </p>
            <div className={styles.heroActions}>
              <Button size="lg" variant="primary" onClick={scrollToForm}>
                Đăng ký học thử miễn phí
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/app/dashboard')}>
                Đăng nhập học viên
              </Button>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>800+</span>
                <span className={styles.statLabel}>Học sinh</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>5+ năm</span>
                <span className={styles.statLabel}>Kinh nghiệm</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>4.9★</span>
                <span className={styles.statLabel}>Phụ huynh đánh giá</span>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className={styles.heroVisual}>
            <div className={styles.heroImageBg}></div>
            <div className={styles.heroImageWrapper}>
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80"
                alt="Cô Hương Giang"
                className={styles.heroImage}
              />
            </div>
            <div className={styles.floatCard1}>
              <span className={styles.floatCardEmoji}>🎉</span>
              <div className={styles.floatCardText}>
                <span className={styles.floatCardTitle}>Học thử miễn phí</span>
                <span className={styles.floatCardSub}>Buổi học đầu tiên</span>
              </div>
            </div>
            <div className={styles.floatCard2}>
              <span className={styles.floatCardEmoji}>⭐</span>
              <div className={styles.floatCardText}>
                <span className={styles.floatCardTitle}>4.9 / 5.0</span>
                <span className={styles.floatCardSub}>Phụ huynh đánh giá</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== FEATURES =================== */}
      <section className={styles.features}>
        <div className={styles.container}>
          {/* Section header animates as one unit */}
          <div ref={featuresRef} className={`${styles.sectionHeader} anim-fade-up`}>
            <p className={styles.sectionLabel}>Phương pháp giảng dạy</p>
            <h2 className={styles.sectionTitle}>Tại sao các con thích học cùng cô Giang?</h2>
            <p className={styles.sectionSubtitle}>
              Mỗi buổi học được thiết kế để các con không chỉ hiểu bài mà còn muốn quay lại học tiếp.
            </p>
          </div>
          {/* Cards stagger in */}
          <div className={styles.featureGrid}>
            {features.map((f, i) => (
              <FeatureCard key={i} feature={f} delay={i} />
            ))}
          </div>
        </div>
      </section>

      {/* =================== CREDENTIALS =================== */}
      <section id="about" className={styles.credentials}>
        <div className={styles.credInner}>
          <div ref={credRef} className={`${styles.credContent} anim-slide-left`}>
            <p className={styles.sectionLabel}>Về cô Hương Giang</p>
            <h2 className={styles.sectionTitle} style={{ color: 'white' }}>
              Được đào tạo bài bản, truyền đạt bằng nhiệt huyết
            </h2>
            <div className={styles.credList}>
              {[
                'Tốt nghiệp Đại học Sư phạm Ngoại ngữ – chuyên ngành tiếng Anh',
                'Chứng chỉ giảng dạy cho trẻ em (Young Learners Teaching Certificate)',
                '5+ năm kinh nghiệm dạy học sinh cấp 1 và cấp 2',
                'Thiết kế chương trình học linh hoạt, bám sát SGK và đề thi trường',
                'Phụ huynh chấm 4.9/5 – "Cô kiên nhẫn, vui tính và hiệu quả"',
              ].map((item, i) => (
                <div key={i} className={styles.credItem}>
                  <div className={styles.credCheck}>
                    <CheckCircle2 size={16} color="white" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div ref={credMetricsRef} className={`${styles.credImageGrid} anim-slide-right`}>
            {[
              { value: '800+', label: 'Học sinh đã học' },
              { value: '5+ năm', label: 'Kinh nghiệm giảng dạy' },
              { value: '97%', label: 'Cải thiện điểm số' },
              { value: '4.9★', label: 'Đánh giá phụ huynh' },
            ].map((m, i) => (
              <div key={i} className={`${styles.credMetric} anim-delay-${i + 1}`}>
                <div className={styles.credMetricValue}>{m.value}</div>
                <div className={styles.credMetricLabel}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== TESTIMONIALS =================== */}
      <section className={styles.testimonials}>
        <div className={styles.container}>
          <div ref={testimonialRef} className={`${styles.sectionHeader} anim-fade-up`}>
            <p className={styles.sectionLabel}>Phụ huynh nói gì?</p>
            <h2 className={styles.sectionTitle}>Kết quả thật từ gia đình thật</h2>
          </div>
          <div className={styles.testimonialGrid}>
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} delay={i} />
            ))}
          </div>
        </div>
      </section>

      {/* =================== FORM — Compact Side-by-Side =================== */}
      <section ref={formRef} className={styles.formSection}>
        <div className={styles.formInner}>
          <div ref={formSectionRef} className={`${styles.formLayout} anim-fade-up`}>
            {/* Left: CTA copy */}
            <div className={styles.formCopy}>
              <p className={styles.sectionLabel} style={{ textAlign: 'left' }}>Bắt đầu hành trình</p>
              <h2 className={styles.formHeading}>Đăng ký học thử<br />buổi đầu miễn phí</h2>
              <p className={styles.formSubtext}>
                Cô Giang sẽ gọi điện xác nhận trong vòng <strong>24 giờ</strong> và sắp xếp buổi học thử phù hợp nhất với lịch của con.
              </p>
              <div className={styles.formChecklist}>
                {[
                  '1 buổi học thử hoàn toàn miễn phí',
                  'Cô đánh giá trình độ và tư vấn lộ trình',
                  'Không ràng buộc, không phí ẩn',
                ].map((item, i) => (
                  <div key={i} className={styles.formCheckItem}>
                    <CheckCircle2 size={18} color="var(--color-primary)" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <div className={styles.formCard}>
              <h3 className={styles.formCardTitle}>Thông tin đăng ký</h3>
              <div className={styles.formGrid}>
                <TextField label="Họ tên phụ huynh" placeholder="Ví dụ: Nguyễn Thị Lan" />
                <TextField label="Số điện thoại" placeholder="0901 234 567" />
                <Select
                  label="Lớp của con"
                  placeholder="— Chọn lớp —"
                  options={gradeOptions}
                  value={grade}
                  onChange={setGrade}
                />
                <Button size="lg" variant="primary" style={{ width: '100%', marginTop: '4px' }}>
                  Đăng ký học thử ngay →
                </Button>
              </div>
              <p className={styles.formFooter}>
                🔒 Thông tin của bạn được bảo mật. Cô sẽ liên hệ trong 24h.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ---- Sub-components with individual scroll animation ---- */

function FeatureCard({ feature, delay }) {
  const ref = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`${styles.featureCard} anim-fade-up anim-delay-${Math.min(delay + 1, 5)}`}
    >
      <div className={styles.featureIconBg}>{feature.icon}</div>
      <h3 className={styles.featureTitle}>{feature.title}</h3>
      <p className={styles.featureDesc}>{feature.desc}</p>
    </div>
  );
}

function TestimonialCard({ testimonial, delay }) {
  const ref = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`${styles.testimonialCard} anim-fade-up anim-delay-${Math.min(delay + 1, 5)}`}
    >
      <div className={styles.testimonialStars}>{'★★★★★'}</div>
      <p className={styles.testimonialText}>"{testimonial.text}"</p>
      <div className={styles.testimonialAuthor}>
        <div className={styles.testimonialAvatar}>
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <div className={styles.testimonialName}>{testimonial.name}</div>
          <div className={styles.testimonialRole}>{testimonial.role}</div>
        </div>
      </div>
    </div>
  );
}

