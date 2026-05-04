# Agent Start Prompt

```text
You are working inside this project.

Read 00-master/README.md first.

Then read the CORE documentation in this order:
1. 00-master/PROJECT_BRIEF.md
2. 03-technical/TECHNICAL_OVERVIEW.md
3. 04-dev/DEV_PLAN.md

For specific tasks, dynamically look up relevant files from:
- 01-design/ (e.g., DESIGN_OVERVIEW.md, DESIGN_TOKENS.md, COMPONENT_ARCHITECTURE.md, PAGE_PATTERNS.md)
- 02-prd/ (e.g., PRD_OVERVIEW.md, USER_STORIES.md)
- 05-test-plan/ (e.g., TEST_PLAN.md)

Current phase: Phase 1

Your rules:
- Do not code Phase 2 before Phase 1 is Done.
- **ZERO hard-coded values in ANY CSS file (components, pages, layouts).** This includes:
  - Colors → use `var(--color-*)` tokens
  - Gradients → use `var(--gradient-*)` tokens  
  - Shadows / glows → use `var(--shadow-*)` tokens
  - Spacing → use `var(--spacing-*)` tokens
  - Border radius → use `var(--radius-*)` tokens
  - Font sizes / weights → use `var(--font-size-*)` / `var(--font-weight-*)` tokens
  - **If a value does not have a token yet, ADD the token to `global.css` first, THEN reference it.**
- Use design-system foundations, primitives, components, patterns, then pages.
- Do not create one-off page components.
- Follow UI reference images if available.
- Follow test plan.
- Specs are for reference. Always update the Spec files (01-design, 02-prd, 03-technical) to match your final decisions and implementation.
- You must adhere to the workflows defined in 00. Main/GUIDELINE.md. If you discover a better workflow or a missing step, you MUST update GUIDELINE.md to ensure future projects can benefit from it.
- At the end of every completed task, propose **5 upgrade suggestions** for the next iteration.
- **Scroll Animation rule:** Every element that has an `anim-*` class MUST also have a `ref` returned from `useScrollAnimation()`. An `anim-*` class without a ref will leave the element permanently invisible (`opacity: 0`). Always verify this pairing before committing.

## ⚠️ Lessons Learned — SchedulePage (cập nhật 02/05/2026)

**[BUG] `display: flex` on `<td>` phá vỡ `colSpan`**
- KHÔNG dùng `display: flex` / `display: grid` trực tiếp trên `<td>` hoặc `<th>`.
- Browser sẽ bỏ qua `colSpan` khi td có flex/grid display model.
- FIX: Bọc nội dung trong `<div>` bên trong `<td>`, đặt flex trên div đó.

**[PATTERN] Grouped Table**
- Dùng `LEVEL_GROUPS` config array để render group header rows.
- Group header: `<tr><td colSpan={N}><div class="groupHeaderInner">dot + label</div></td></tr>`
- Data rows trong group KHÔNG repeat lại dot/prefix đã có ở group header.
- Xem chi tiết: `01-design/PAGE_PATTERNS.md` → Section 6.

**[COMPONENT] StatusBadge**
- Pill + colored dot + optional pulse animation (chỉ cho `open` status).
- Xem spec đầy đủ: `01-design/COMPONENT_SPECS.md` → Section 10b.

**[TOKEN] Status colors chưa tokenized**
- Màu emerald (#059669), amber (#d97706), rose (#dc2626) trong StatusBadge hiện đang hard-code.
- TODO: Thêm `--color-status-open`, `--color-status-almost`, `--color-status-full` vào `global.css`.

**[SYNC] Sau mỗi thay đổi UI, phải sync tài liệu:**
- `01-design/COMPONENT_SPECS.md` — component mới / thay đổi variant
- `01-design/PAGE_PATTERNS.md` — pattern mới / layout change
- `02-prd/FUNCTIONAL_REQUIREMENTS.md` — nếu có thêm/bớt tính năng
- `02-prd/USER_STORIES.md` — nếu có thêm/bớt user story

First, summarize:
1. What project you understand
2. Current phase
3. What docs are missing
4. What you need to implement first
```
