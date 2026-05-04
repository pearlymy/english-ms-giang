# Component Specs

> Đặc tả từng component chính.

---

## 1. Button

Reference UI:
- UI-02
- UI-03
- UI-05

Based on:
- `ButtonBase`

Variants:
- primary
- secondary
- outline
- ghost
- danger

Sizes:
- sm
- md
- lg

States:
- default
- hover
- active
- focus
- disabled
- loading

Rules:
- Mỗi action group chỉ có một primary button
- Danger chỉ dùng cho destructive action
- Loading button không trigger lại action
- Icon-only button phải có accessible label
- Không tạo button riêng trong page

---

## 2. TextField

Reference UI:
- UI-02
- UI-03

Based on:
- `InputBase`
- `Text`

Variants:
- default
- error
- success

States:
- default
- hover
- focus
- filled
- error
- disabled
- readonly

Rules:
- Label luôn rõ
- Error message gần input
- Helper text không thay thế error text
- Input linked với label/error/helper

---

## 3. Card

Reference UI:
- UI-01
- UI-04

Based on:
- `Surface`
- `Stack`

Variants:
- default
- outlined
- elevated
- interactive

Rules:
- Card chỉ hover nếu clickable
- Padding dùng spacing token
- Header/body/footer consistent

---

## 4. Modal

Reference UI:
- UI-05

Based on:
- `Surface`
- `Text`
- `Button`

Variants:
- default
- confirm
- danger
- form

Rules:
- Overlay fade
- Dialog fade + scale/slide nhẹ
- Focus trap
- ESC close nếu phù hợp
- Return focus về trigger

---

## 5. Table

Reference UI:
- UI-04

Variants:
- default
- compact

States:
- loading
- empty
- error
- row hover
- selected row

Rules:
- Header rõ
- Pagination thống nhất
- Empty/error/loading dùng component chung
- Không custom table style từng page

---

## 6. EmptyState

Reference UI:
- UI-08

Structure:
- icon/illustration
- title
- description
- primary action
- optional secondary action

---

## 7. ErrorState

Reference UI:
- UI-09

Structure:
- icon
- title
- description
- recovery action

---

## 8. LoadingState

Reference UI:
- UI-10

Variants:
- spinner
- skeleton
- inline

Rules:
- Skeleton khi layout đã biết
- Spinner cho tác vụ ngắn
- Không gây layout shift mạnh

---

## 9. Avatar

Reference UI:
- UI-45, UI-112

Based on:
- `@radix-ui/react-avatar`

Sizes:
- sm
- md
- lg

Rules:
- Fallback initials phải hiển thị khi ảnh lỗi
- Hỗ trợ ảnh vuông (radius) hoặc tròn (pill)

---

## 10. Badge

Reference UI:
- UI-112, UI-522

Variants:
- default
- success
- error
- warning

Rules:
- Chữ luôn rõ nét trên nền màu nhạt (subtle)
- Chỉ dùng text ngắn (1-2 từ)

---

## 10b. StatusBadge  *(Lịch khai giảng)*

> Pill badge với animated dot, dùng để hiển thị trạng thái lớp học.

Variants:
- `open`   — Còn nhận  → emerald green dot (pulse animation)
- `almost` — Gần đầy   → amber dot
- `full`   — Đã đầy    → rose red dot

Structure:
```
<span class="statusBadge statusOpen|statusAlmost|statusFull">
  <span class="statusDot" />   ← animated dot
  {label}
</span>
```

Motion:
- `open` dot: `animation: pulse 2s infinite` — box-shadow expand/collapse
- `almost`, `full`: static dot, no animation

Rules:
- Dùng `prefers-reduced-motion` để tắt pulse
- Màu nền dùng `rgba()` subtle, không solid
- Border subtle cùng màu họ

Token checklist (phải dùng token, không hard-code):
- Spacing: `var(--radius-pill)`, `var(--font-weight-semibold)`, `var(--font-size-*)`
- Màu cụ thể (emerald, amber, rose) hiện đang hard-code hex → TODO: thêm vào `global.css`

---

## 11. Tabs

Reference UI:
- UI-45, UI-112

Based on:
- `@radix-ui/react-tabs`

Rules:
- Dùng thanh gạch dưới (indicator) cho active state
- Bàn phím điều hướng (Arrow keys) chuẩn Radix

---

## 12. Dropdown

Reference UI:
- Header Navigation

Based on:
- `@radix-ui/react-dropdown-menu`

Rules:
- Hỗ trợ ESC để đóng
- Hỗ trợ focus trap
- Hỗ trợ Divider bên trong menu item

---

## 13. Divider

Rules:
- Margin tùy chỉnh
- Hỗ trợ horizontal và vertical
- Màu sắc dùng `--color-border`

---

## 14. Toast

Provider: `<ToastProvider>` wrap tại `main.jsx`
Hook: `useToast()` → `toast.success / error / warning / info / dismiss`

Variants:
- success
- error
- warning
- info

Props per call:
- `message` (required)
- `title` (optional)
- `duration` — ms, default 4000. Set 0 for persistent.

Motion (MOTION_SYSTEM.md):
- Enter: slide from right + fade — `180ms`, `easing.enter`
- Exit: slide to right + fade — `180ms`, `easing.exit`

Rules:
- Toasts stack bottom-right (bottom-center trên mobile ≤640px)
- Auto-dismiss sau `duration` ms; timer cleared khi user tự đóng
- Max width 360px desktop, full-width mobile
- `aria-live="polite"` cho accessibility
- `prefers-reduced-motion` — tắt transform, chỉ giữ opacity
- Không giới hạn số toast đồng thời (stacks vertically)
