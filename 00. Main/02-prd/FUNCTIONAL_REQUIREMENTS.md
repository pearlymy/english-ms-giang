# Functional Requirements

---

## Phase 1 Requirements

| ID | Requirement | Acceptance Criteria | Priority |
|---|---|---|---|
| P1-FR-001 | Hiển thị trang chủ (Landing Page) với thông tin giới thiệu trung tâm | Trang load đúng, có hero, features, testimonials, CTA | Must |
| P1-FR-002 | Hiển thị lịch khai giảng các lớp học | Bảng hiển thị đúng dữ liệu, group theo Cấp 1 / Cấp 2, có trạng thái chỗ | Must |
| P1-FR-003 | StatusBadge trạng thái lớp học | Hiển thị "Còn nhận" (xanh, pulse), "Gần đầy" (vàng), "Đã đầy" (đỏ, mờ) | Must |
| P1-FR-004 | Nút đăng ký dẫn đến form liên hệ | Click "Đăng ký" → scroll đến form trên Landing Page | Must |
| P1-FR-005 | ContactStrip cuối trang lịch khai giảng | Hiển thị email + nút "Gọi ngay", không có inline form | Must |
| P1-FR-006 | Responsive trên mobile (≤ 768px) | Bảng scroll ngang, ContactStrip stack dọc, button full-width | Must |
| P1-FR-007 | Design System showcase page | `/design-system` hiển thị tất cả components, variants, states | Should |
| P1-FR-008 | Điều hướng breadcrumb | Breadcrumb từ trang lịch khai giảng về trang chủ | Should |

---

## Phase 2 Requirements

| ID | Requirement | Acceptance Criteria | Priority | Status |
|---|---|---|---|---|
| P2-FR-001 | Form đăng ký học | Phụ huynh điền form, gửi đăng ký thành công, có email confirm | Should | ⬜ Chưa làm |
| P2-FR-002 | Dashboard quản lý học sinh | Giáo viên xem danh sách, điểm, tiến độ | Should | ✅ Done (mock) |
| P2-FR-003 | Quản lý lịch học | Cô Giang cập nhật lịch khai giảng trực tiếp trên app | Should | ⬜ Chưa làm |
| P2-FR-004 | Quản lý khóa học & bài tập | Giáo viên xem cấu trúc Khóa → Chương → Bài tập | Should | ✅ Done (mock) |
| P2-FR-005 | Phân quyền Admin / Student | Sidebar & Dashboard tự động đổi giao diện theo role | Must | ✅ Done |

---

## Phase 3 Requirements

| ID | Requirement | Acceptance Criteria | Priority |
|---|---|---|---|
| P3-FR-001 | Hệ thống thông báo | Email/SMS nhắc học sinh trước buổi học | Could |
| P3-FR-002 | Thanh toán học phí online | Tích hợp cổng thanh toán, xuất hóa đơn | Could |

---

## Requirement Rules

- Phase 1 không chứa requirement của Phase 2
- Phase 2 không được bắt đầu nếu Phase 1 chưa Done
- Mỗi requirement phải có acceptance criteria
