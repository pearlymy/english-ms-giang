# Design Tokens

> Mọi style phải đi qua token. Không hard-code style trong component hoặc page.

---

## 1. Color Tokens

### Brand

| Token | Purpose | Example |
|---|---|---|
| `color.primary` | CTA chính (solid) | `#210cae` |
| `color.primaryHover` | hover solid | `#1a0a8a` |
| `color.primaryActive` | pressed | `#130875` |
| `color.primarySubtle` | nền nhẹ | `#e0f9fd` |
| `color.primaryAccent` | cyan accent | `#4dc9e6` |
| `color.onPrimary` | text trên primary | `#FFFFFF` |
| `gradient.primary` | gradient chủ đạo | `linear-gradient(135deg, #4dc9e6, #210cae)` |

### Surface

| Token | Purpose | Example |
|---|---|---|
| `color.background` | page background | `#F9FAFB` |
| `color.surface` | card/modal/table | `#FFFFFF` |
| `color.surfaceHover` | hover phụ | `#F3F4F6` |
| `color.surfaceAlt` | surface phụ | `#F3F4F6` |
| `color.overlay` | modal overlay | `rgba(15,23,42,0.48)` |

### Text

| Token | Purpose | Example |
|---|---|---|
| `color.textPrimary` | text chính | `#111827` |
| `color.textSecondary` | text phụ | `#6B7280` |
| `color.textTertiary` | hint/meta | `#9CA3AF` |
| `color.textInverse` | text trên nền tối | `#FFFFFF` |

### Border

| Token | Purpose | Example |
|---|---|---|
| `color.border` | border mặc định | `#E5E7EB` |
| `color.borderStrong` | border mạnh | `#CBD5E1` |
| `color.borderFocus` | focus ring | `#625DF5` |
| `color.borderError` | error border | `#EF4444` |

### Semantic

| Token | Purpose | Example |
|---|---|---|
| `color.success` | success | `#10B981` |
| `color.warning` | warning | `#F59E0B` |
| `color.error` | error | `#EF4444` |
| `color.info` | info | `#0284C7` |

---

## 2. Typography Tokens

| Token | Purpose | Example |
|---|---|---|
| `font.family.base` | body | `"Inter", system-ui, sans-serif` |
| `font.size.xs` | caption | `12px` |
| `font.size.sm` | helper | `14px` |
| `font.size.md` | body | `16px` |
| `font.size.lg` | section title | `18px` |
| `font.size.xl` | page title small | `20px` |
| `font.size.2xl` | page title | `24px` |
| `font.weight.regular` | body | `400` |
| `font.weight.medium` | label | `500` |
| `font.weight.semibold` | title | `600` |
| `font.weight.bold` | strong title | `700` |

---

## 3. Spacing Tokens

| Token | Value | Usage |
|---|---:|---|
| `spacing.xs` | `4px` | icon gap |
| `spacing.sm` | `8px` | compact gap |
| `spacing.md` | `12px` | field gap |
| `spacing.lg` | `16px` | card padding |
| `spacing.xl` | `24px` | section gap |
| `spacing.2xl` | `32px` | page padding |
| `spacing.3xl` | `48px` | large gap |

---

## 4. Radius Tokens

| Token | Value | Usage |
|---|---:|---|
| `radius.sm` | `4px` | tag |
| `radius.md` | `8px` | dropdown |
| `radius.lg` | `12px` | card/modal |
| `radius.xl` | `16px` | large panel |
| `radius.pill` | `9999px` | button/input/badge |

---

## 5. Shadow Tokens

| Token | Usage |
|---|---|
| `shadow.none` | flat |
| `shadow.xs` | subtle |
| `shadow.sm` | card hover |
| `shadow.md` | dropdown |
| `shadow.lg` | modal/drawer |

---

## 6. Breakpoint Tokens

| Token | Value |
|---|---:|
| `breakpoint.sm` | `640px` |
| `breakpoint.md` | `768px` |
| `breakpoint.lg` | `1024px` |
| `breakpoint.xl` | `1280px` |
