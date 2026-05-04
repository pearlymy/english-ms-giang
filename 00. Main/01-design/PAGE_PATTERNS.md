# Page Patterns

---

## 1. Login Page

Reference:
- UI-02

Rules:
- Form centered hoặc theo UI reference
- Submit button rõ
- Validation message rõ
- Không custom input/button riêng

---

## 2. Form Page

Reference:
- UI-03

Rules:
- Form section rõ
- Field spacing consistent
- Helper/error text consistent
- Action footer rõ

---

## 3. Dashboard

Reference:
- UI-01

Rules:
- Card thống nhất
- Heading hierarchy rõ
- Main action rõ
- Chart/table container dùng surface token

---

## 4. Table Page

Reference:
- UI-04

Rules:
- Filter zone
- Table zone
- Pagination zone
- Empty/loading/error state thống nhất

---

## 5. Mobile Layout

Reference:
- UI-07

Rules:
- Single-column
- Touch target đủ lớn
- Spacing thoáng
- Không ép table lớn lên mobile nếu không phù hợp

---

## 6. Schedule Page (Lịch khai giảng)

Pattern: **Grouped Table Page**

Layout zones (top → bottom):
1. **PageHeader** — breadcrumb + sectionLabel + h1 + subtitle
2. **GroupedTable** — bảng `<table>` với group header rows
3. **ContactStrip** — dải liên hệ cuối trang

### GroupedTable rules:
- Data được group theo category (VD: Cấp 1 / Cấp 2) bằng `LEVEL_GROUPS` config
- Group header là `<tr class="groupHeaderRow">` với `<td colSpan={N}>` chứa dot + label
- **GOTCHA:** KHÔNG dùng `display: flex` trực tiếp trên `<td>` — sẽ phá vỡ `colSpan`.
  Thay thế: bọc nội dung trong `<div>` bên trong `<td>`.
- Data rows KHÔNG lặp lại dot/prefix vì group header đã hiển thị category rồi
- Dòng "full" dùng `opacity: 0.5` (class `rowFull`)
- StatusBadge dùng component spec 10b

### Table Header Gradient:
```css
background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 45%, var(--color-accent) 100%);
```
→ Dùng token, không hard-code hex.

### ContactStrip rules:
- Layout: icon-circle (gradient) + text block (title + email) + CTA button (gradient pill)
- Nền: gradient subtle (`rgba` từ primary palette)
- KHÔNG có form đăng ký trong strip này — chỉ phone/email + "Gọi ngay"
- Responsive: flex-row → flex-column trên mobile, button full-width

---

## 7. Admin Dashboard Page

Pattern: **Gradient Hero + Stats Grid + Dual Card Row**

Layout zones (top → bottom):
1. **Hero** — gradient (`--brand-700 → --brand-500 → --brand-400`), greeting + date
2. **StatsGrid** — 4 columns, mỗi card = icon chip (colored) + value + label
3. **BottomGrid** — 2 columns: upcoming deadlines card + recent submissions card

### Token rules:
- Hero gradient: `--brand-*` scale tokens — không dùng hex
- Score color: `--color-success` (≥8), `--color-warning` (≥6), `--color-error` (<6)
- Card background: `--surface-primary`; row hover: `--surface-secondary`
- Icon chip bg: `--color-*-subtle` tokens

---

## 8. Admin Table Page (Học viên / Students)

Pattern: **Gradient Hero + Filter Bar + CSS Grid Table**

Layout zones (top → bottom):
1. **Hero** — gradient pill, icon + title + subtitle
2. **FilterBar** — search input (trái) + segmented filter buttons (phải)
3. **Table** — CSS Grid (không dùng `<table>`), header + data rows, mỗi row clickable

### Table rules:
- Grid columns: `grid-template-columns` — không flex trên row
- Score color-coded bằng `--color-success / warning / error`
- Progress bar: `--brand-500` fill, `--border-subtle` track
- Empty state: centered text trong `.tableBody`

---

## 9. Admin Course Detail Page

Pattern: **Gradient Hero + Tab Bar + Accordion List**

Layout zones:
1. **Hero** — course gradient, back button (ghost pill), title + meta
2. **Tabs** — segmented 2 tab: "Chương & Bài tập" / "Học viên đã đăng ký"
3. **ChapterList** — accordion cards, toggle mở/đóng từng chương
4. **AssignmentRows** — trong chương đã mở: icon + title + type/count + date + submit count

### Accordion rules:
- Default: tất cả chương mở (`isOpen = openChapters[id] !== false`)
- Chapter header: full-width `<button>`, flex space-between
- Assignment row: click → navigate tới edit form
- **GOTCHA:** Nút "Thêm bài tập" trong chapter header — dùng `e.stopPropagation()` để không toggle accordion

---
