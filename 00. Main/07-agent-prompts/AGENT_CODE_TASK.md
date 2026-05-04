# Agent Code Task Prompt

```text
Read 00-master/README.md and all required docs for the current task.

Current phase:
Phase 1

Current task:
[PASTE TASK HERE]

Before coding, respond with:
1. Relevant docs read
2. UI references used
3. Files to create/change
4. Assumptions
5. Confirmation that the task belongs to current phase

Then implement.

Rules:
- Use tokens
- Use primitives
- Use components
- Do not hard-code style
- Do not create one-off page UI
- Do not implement future phase
- Warn and ask for confirmation if the task requires changes that affect other existing components
- Always write/update unit tests for new logic and run tests to ensure no regressions
- Explain how to test your changes
- Specs are for reference. Always update the Spec files (01-design, 02-prd, 03-technical) to match your final implementation.
- **NEW COMPONENT RULE:** Whenever you create a new design system component (in `src/design-system/components/`), you MUST also add a showcase section for it in `/src/pages/DesignSystem/DesignSystem.jsx`. The showcase must demonstrate: all variants, all states (default, hover, error, disabled), and motion behavior. No exceptions.

## ⚠️ Critical Gotchas (learned from implementation)

- **`display: flex` on `<td>` → phá vỡ `colSpan`.**
  Always wrap flex content in `<div>` inside `<td>`, never put flex on `<td>` itself.

- **ZERO hard-coded hex in CSS.** Before writing any color value:
  1. Check if a token exists in `global.css`
  2. If not → ADD token to `global.css` first
  3. Then use `var(--token-name)` in your CSS
  Known TODO tokens: `--color-status-open`, `--color-status-almost`, `--color-status-full`

- **After any UI change, sync ALL relevant docs:**
  - `01-design/COMPONENT_SPECS.md`
  - `01-design/PAGE_PATTERNS.md`
  - `02-prd/FUNCTIONAL_REQUIREMENTS.md`
  - `02-prd/USER_STORIES.md`

After implementation, you must provide:
1. 5 enhancements for the current feature.
2. 5 proposals for other features or entirely new features.
```
