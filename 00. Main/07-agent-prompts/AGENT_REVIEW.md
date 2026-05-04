# Agent Review Prompt

```text
Review the current implementation ([PASTE CODE / DIFF HERE] or check git diff) against the relevant specs for this feature:

- Lookup relevant files in 01-design/ (Design System, Tokens, Specs)
- Lookup relevant files in 02-prd/ (Requirements, Edge Cases)
- Lookup relevant files in 03-technical/
- Lookup relevant files in 04-dev/
- Lookup relevant files in 05-test-plan/

Check:
1. Design system compliance
2. PRD compliance
3. Technical spec compliance
4. Test plan compliance
5. Phase compliance
6. Accessibility
7. Responsive behavior
8. Code quality

Rules:
- Specs are for reference. If the implementation is good but differs from the specs, recommend updating the specs instead of rejecting the code.

Output:
- Pass / Needs changes
- Critical issues
- Required fixes
- Optional improvements
- Can move to next phase: Yes / No
- 5 enhancements for the current feature
- 5 proposals for other features or new features
```
