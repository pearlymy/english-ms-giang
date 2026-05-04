# Application Layout Specs (Phase 3.1)

Tài liệu đặc tả kiến trúc Layout tổng thể (Global Layout) cho ứng dụng Quản lý học tập (LMS). Layout này sẽ được bọc ngoài (Wrapper) toàn bộ các trang nội bộ (Dashboard, Courses, Settings) thông qua hệ thống React Router.

## 1. Grid/Flexbox Architecture
- **Mô hình kiến trúc:** Layout chia làm 2 cột chính.
  - Cột 1 (Cố định): `Sidebar`
  - Cột 2 (Linh hoạt): `Header` (cố định trên cùng) + `Main Content` (có thể cuộn).
- **Hành vi Responsive (Dự kiến):** Trên màn hình nhỏ (Mobile/Tablet), `Sidebar` sẽ bị ẩn đi và chuyển thành dạng Menu trượt (Drawer). Tạm thời ở Phase 3.1 chúng ta sẽ tập trung tối ưu cho Desktop (`min-width: 1024px`).

---

## 2. Các thành phần chi tiết (Outline)

### 2.1. Sidebar Component (`src/components/layout/Sidebar`)
Thanh điều hướng chính nằm dọc bên trái màn hình.

- **Kích thước:** Chiều rộng cố định `W = 260px`. Chiều cao `100vh` (chiếm trọn màn hình).
- **Màu nền:** `--color-surface` (Trắng) hoặc có thể xám siêu nhạt `--color-surface-alt`.
- **Đường viền:** Có viền phân cách mỏng bên phải (`1px solid var(--color-border)`).
- **Cấu trúc chia làm 3 phần:**
  1. **Top (Brand & Workspace):** 
     - Logo ứng dụng (Text hoặc Icon).
     - Component `Dropdown` để chọn Workspace (Ví dụ: "Personal" vs "Team").
  2. **Middle (Navigation Links):** 
     - Danh sách các liên kết chính dùng chữ + Icon (`lucide-react`):
       - `LayoutDashboard`: Home / Dashboard
       - `BookOpen`: My Courses
       - `MessageSquare`: Messages
       - `Settings`: Settings
     - Khi Active (đang ở trang đó), link có màu nền `--color-primary-subtle` và chữ màu `--color-primary`.
  3. **Bottom (User / Support):**
     - Liên kết "Help & Center" hoặc hiển thị số dung lượng lưu trữ (Storage).

---

### 2.2. Header Component (`src/components/layout/Header`)
Thanh công cụ ngang nằm trên cùng bên phải màn hình.

- **Kích thước:** Chiều cao cố định `H = 64px`. Chiều rộng `calc(100% - 260px)` (chiếm phần còn lại).
- **Hành vi:** Cố định (Sticky/Fixed) trên cùng, dính chặt với trần màn hình để User luôn có thể tương tác dù cuộn nội dung xuống sâu.
- **Đường viền:** Viền phân cách mỏng phía dưới (`1px solid var(--color-border)`).
- **Cấu trúc chia làm 2 phần (Flexbox Space-between):**
  1. **Left (Context Info):** 
     - Tên trang hiện tại (Ví dụ: `<Text size="xl" weight="bold">Dashboard</Text>`) hoặc đường dẫn `Breadcrumbs`.
  2. **Right (Actions):** 
     - `TextField` tích hợp Icon Kính lúp (Search Bar).
     - Icon cái chuông (`Bell`) bọc trong `NotificationBadge` (để báo có tin nhắn).
     - `Avatar` User có viền, bọc trong `Dropdown` menu (để Log out, Profile).

---

### 2.3. Main Content Wrapper (`<Outlet />`)
Khu vực hiển thị nội dung chính của từng trang riêng biệt.

- **Kích thước:** Chiều rộng chiếm hết khoảng trống, chiều cao `min-height: calc(100vh - 64px)`.
- **Màu nền:** `--color-background` (Góp phần làm nổi bật các thẻ `Card` màu trắng).
- **Padding:** `var(--spacing-2xl)` (tương đương 32px) để tạo khoảng thở thoải mái giữa nội dung và các viền màn hình.
- **Hành vi:** Thanh cuộn dọc (Scrollbar) sẽ xuất hiện ở khu vực này nếu nội dung dài.

---

## 3. UI Components Tái sử dụng
Layout này là cơ hội hoàn hảo để kiểm chứng độ mạnh mẽ của thư viện Component Layer vừa xây dựng xong. Các món sẽ được dùng:
- `Box`, `Stack`, `Text` (Layout Primitives)
- `Button` (Cho các action)
- `TextField` (Cho Search bar)
- `Avatar`, `Badge`, `NotificationBadge` (Cho cụm User)
- `Dropdown` (Cho Workspace và User Menu)
- `Divider` (Phân cách menu)
