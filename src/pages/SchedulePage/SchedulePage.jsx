import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import styles from './SchedulePage.module.css';

/* ─────────────────────────────────────────────────────────────────────────
   SCHEDULE DATA
   Cập nhật tại đây. Không cần chỉnh code khác.
   level    : 'cap1' | 'cap2'
   session  : buổi học (VD: Thứ 2 & Thứ 4)
   time     : khung giờ
   startDate: ngày khai giảng (dd/mm/yyyy)
   status   : 'open' | 'almost' | 'full'
───────────────────────────────────────────────────────────────────────── */
const CLASSES = [
  {
    id: 1,
    level: 'cap1',
    levelLabel: 'Lớp 1–2',
    session: 'Thứ 3 & Thứ 5',
    time: '17:00 – 18:30',
    startDate: '12/05/2026',
    status: 'open',
  },
  {
    id: 2,
    level: 'cap1',
    levelLabel: 'Lớp 3–4',
    session: 'Thứ 2 & Thứ 4',
    time: '17:00 – 18:30',
    startDate: '11/05/2026',
    status: 'open',
  },
  {
    id: 3,
    level: 'cap1',
    levelLabel: 'Lớp 5',
    session: 'Thứ 4 & Thứ 6',
    time: '17:00 – 18:30',
    startDate: '13/05/2026',
    status: 'almost',
  },
  {
    id: 4,
    level: 'cap1',
    levelLabel: 'Ôn thi học kỳ',
    session: 'Thứ 6 & Thứ 7',
    time: '17:00 – 18:30',
    startDate: '16/05/2026',
    status: 'almost',
  },
  {
    id: 5,
    level: 'cap2',
    levelLabel: 'Lớp 6',
    session: 'Thứ 4 & Thứ 6',
    time: '19:00 – 20:30',
    startDate: '13/05/2026',
    status: 'open',
  },
  {
    id: 6,
    level: 'cap2',
    levelLabel: 'Lớp 7–8',
    session: 'Thứ 2 & Thứ 4',
    time: '19:00 – 20:30',
    startDate: '11/05/2026',
    status: 'almost',
  },
  {
    id: 7,
    level: 'cap2',
    levelLabel: 'Lớp 9',
    session: 'Thứ 3 & Thứ 5',
    time: '19:00 – 20:30',
    startDate: '12/05/2026',
    status: 'full',
  },
  {
    id: 8,
    level: 'cap2',
    levelLabel: 'Ôn thi học kỳ',
    session: 'Thứ 6 & Thứ 7',
    time: '19:00 – 20:30',
    startDate: '16/05/2026',
    status: 'open',
  },
  {
    id: 9,
    level: 'cap1',
    levelLabel: 'Thứ 7 sáng',
    session: 'Thứ 7',
    time: '08:00 – 09:30',
    startDate: '17/05/2026',
    status: 'open',
  },
  {
    id: 10,
    level: 'cap2',
    levelLabel: 'Giao tiếp',
    session: 'Thứ 7',
    time: '10:00 – 11:30',
    startDate: '17/05/2026',
    status: 'almost',
  },
];

const STATUS_CONFIG = {
  open:   { label: 'Còn nhận',  cls: 'statusOpen' },
  almost: { label: 'Gần đầy',   cls: 'statusAlmost' },
  full:   { label: 'Đã đầy',    cls: 'statusFull' },
};

const LEVEL_GROUPS = [
  { key: 'cap1', label: 'Cấp 1', dotClass: 'dot_cap1' },
  { key: 'cap2', label: 'Cấp 2', dotClass: 'dot_cap2' },
];

export const SchedulePage = () => {
  const navigate = useNavigate();
  const tableRef = useScrollAnimation();

  const grouped = useMemo(() => {
    return LEVEL_GROUPS.map((grp) => ({
      ...grp,
      rows: CLASSES.filter((c) => c.level === grp.key),
    }));
  }, []);

  return (
    <div className={styles.page}>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbLink}>Trang chủ</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span>Lịch khai giảng</span>
        </div>
        <p className={styles.sectionLabel}>Lịch khai giảng 2026</p>
        <h1 className={styles.pageTitle}>Các lớp học sắp khai giảng</h1>
        <p className={styles.pageSubtitle}>
          Lớp nhỏ 5–8 học sinh · Mỗi buổi 90 phút · Đăng ký sớm để giữ chỗ
        </p>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableWrap} ref={tableRef}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Trình độ</th>
              <th>Buổi học</th>
              <th>Khung giờ</th>
              <th>Ngày khai giảng</th>
              <th>Trạng thái</th>
              <th>Đăng ký</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((grp) => (
              <React.Fragment key={grp.key}>
                {/* ── Group header row ── */}
                <tr className={styles.groupHeaderRow}>
                  <td colSpan={6} className={styles.groupHeaderCell}>
                    <div className={styles.groupHeaderInner}>
                      <span className={`${styles.levelDot} ${styles[grp.dotClass]}`} />
                      {grp.label}
                    </div>
                  </td>
                </tr>

                {/* ── Data rows ── */}
                {grp.rows.map((cls) => {
                  const status = STATUS_CONFIG[cls.status];
                  return (
                    <tr key={cls.id} className={cls.status === 'full' ? styles.rowFull : ''}>
                      <td className={styles.levelCell}>
                        {cls.levelLabel}
                      </td>
                      <td className={styles.sessionCell}>{cls.session}</td>
                      <td className={styles.timeCell}>{cls.time}</td>
                      <td className={styles.dateCell}>{cls.startDate}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[status.cls]}`}>
                          <span className={styles.statusDot} />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        {cls.status !== 'full' ? (
                          <button
                            className={styles.registerBtn}
                            onClick={() => navigate('/', { state: { scrollToForm: true } })}
                          >
                            Đăng ký
                          </button>
                        ) : (
                          <span className={styles.fullMsg}>Lớp đã đầy</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Bottom note ── */}
      <div className={styles.tableNote}>
        <div className={styles.noteIconWrap}>
          {/* Phone SVG icon */}
          <svg className={styles.noteIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
          </svg>
        </div>
        <div className={styles.noteContent}>
          <p className={styles.noteTitle}>Muốn hỏi thêm hoặc chờ lớp mới?</p>
          <p className={styles.noteText}>
            Liên hệ trực tiếp cô Giang: <a href="mailto:contact@hgenglish.vn" className={styles.noteEmail}>contact@hgenglish.vn</a>
          </p>
        </div>
        <a href="tel:+84123456789" className={styles.callBtn}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
          </svg>
          Gọi ngay
        </a>
      </div>
    </div>
  );
};
