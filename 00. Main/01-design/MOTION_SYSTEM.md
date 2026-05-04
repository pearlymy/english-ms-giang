# Motion System

> Quy chuẩn animation. Tất cả animation phải dùng motion tokens.

---

## 1. Motion Principles

- Motion phải có mục đích
- Nhanh, nhẹ, không gây khó chịu
- Giải thích thay đổi trạng thái
- Không dùng animation trang trí không cần thiết
- Hỗ trợ reduced motion

---

## 2. Motion Tokens

| Token | Value | Usage |
|---|---:|---|
| `motion.duration.fast` | `120ms` | hover/focus |
| `motion.duration.normal` | `180ms` | dropdown/tooltip |
| `motion.duration.slow` | `240ms` | modal/drawer |
| `motion.easing.standard` | `cubic-bezier(0.2,0,0,1)` | default |
| `motion.easing.enter` | `cubic-bezier(0,0,0.2,1)` | enter |
| `motion.easing.exit` | `cubic-bezier(0.4,0,1,1)` | exit |

---

## 3. Component Motion Rules

| Component | Rule |
|---|---|
| Button | hover subtle, active pressed nhẹ |
| Input | focus ring transition |
| Dropdown | fade + slight slide |
| Modal | overlay fade, dialog fade + scale |
| Drawer | slide from edge |
| Tooltip | quick fade |
| Toast | slide/fade |
| Tabs | active indicator transition |
| Accordion | height + opacity |
| Table row | background transition |

---

## 4. Reduced Motion

Nếu user bật reduced motion:
- bỏ transform không cần thiết
- chỉ giữ opacity transition tối thiểu
- không dùng parallax
- không dùng loop animation trừ loading cần thiết
