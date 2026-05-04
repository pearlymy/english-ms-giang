# PRD: Trang Landing Page (Cô Hương Giang)

Tài liệu này phác thảo cấu trúc nội dung và UI/UX cho trang Landing Page giới thiệu giáo viên tiếng Anh - Cô Hương Giang. Trang này sẽ đóng vai trò là "mặt tiền" của hệ thống LMS, thu hút học viên mới và cung cấp cổng đăng nhập cho học viên cũ.

## 1. Mục tiêu (Goals)
- Tạo ấn tượng chuyên nghiệp, hiện đại với phong cách thiết kế Loom-aesthetic (Clean, Airy).
- Tăng tỷ lệ chuyển đổi (Conversion Rate) thông qua form "Để lại thông tin tư vấn".
- Cung cấp điểm chạm để học viên hiện tại "Đăng nhập" vào hệ thống LMS bên trong.

---

## 2. Cấu trúc trang (Page Outline)

### 2.1. Top Navigation Bar (Thanh điều hướng trên cùng)
- **Left:** Logo (Ví dụ: `HG English` hoặc Icon cuốn sách).
- **Right:** 
  - Liên kết neo (Về cô Giang, Khóa học, Học viên).
  - Nút **Đăng nhập** (Button variant="ghost" hoặc "outline").

### 2.2. Hero Section (Phần màn hình đầu tiên)
Đây là phần quan trọng nhất, đập vào mắt người xem đầu tiên.
- **Layout:** Chia 2 cột (Text bên trái, Hình ảnh bên phải).
- **Cột Trái (Content):**
  - Label: `Badge` nhỏ ghi "Khai giảng khóa mới tháng 11".
  - Headline: Chữ siêu to (`Text size="4xl" weight="bold"`) - "Chinh phục tiếng Anh cùng Cô Hương Giang".
  - Sub-headline: "Lộ trình học cá nhân hóa, phương pháp truyền cảm hứng giúp bạn đột phá điểm số và tự tin giao tiếp."
  - **Call to Action (CTA):** 
    - Nút 1 (Primary, to): **Để lại thông tin tư vấn** (Nhấp vào sẽ cuộn xuống form hoặc mở Modal).
    - Nút 2 (Outline): **Khám phá lộ trình**.
- **Cột Phải (Visual):**
  - Hình ảnh chân dung Cô Hương Giang chất lượng cao, có các khối hình học bo cong (Pill) hoặc bóng đổ lơ lửng phía sau để tạo chiều sâu.

### 2.3. About Teacher Section (Giới thiệu Giáo viên)
- Khối thông tin giới thiệu profile:
  - Bằng cấp, chứng chỉ (Ví dụ: IELTS 8.5, TESOL).
  - Số năm kinh nghiệm (Ví dụ: 5+ năm giảng dạy).
  - Triết lý giảng dạy.

### 2.4. Why Choose Us / Khóa học tiêu biểu (Lợi ích)
- Sử dụng dạng Grid gồm 3 hoặc 4 Component `Card`.
- Mỗi thẻ gồm: Icon (`lucide-react`), Tên điểm mạnh (Giáo trình chuẩn quốc tế, Sửa lỗi 1-1...), và mô tả ngắn.

### 2.5. Tư vấn & Đăng ký (Lead Generation Form)
- Nằm trong một khối màu nền tím nhạt (`--color-primary-subtle`).
- Form nhập liệu dùng Component `TextField`:
  - Họ và tên.
  - Số điện thoại.
  - Mục tiêu học tập (Select/Dropdown).
  - Nút Submit: **Nhận tư vấn miễn phí**.

### 2.6. Footer
- Thông tin liên hệ (Email, SĐT, Địa chỉ).
- Link mạng xã hội.

---

## 3. Tech Specs & Routing
Do đây là trang Landing Page (không cần Sidebar và Header của LMS bên trong), chúng ta sẽ cần điều chỉnh lại Routing:
- Đường dẫn `/`: Sẽ trỏ về trang Landing Page này (dùng một Layout trống).
- Đường dẫn `/app` hoặc `/dashboard`: Sẽ trỏ về `MainLayout` (gồm Sidebar + Header) mà chúng ta vừa làm ở Phase 3.1.
