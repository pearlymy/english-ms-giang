# Project Documentation Hub

> Đây là file điều hướng chính. Agent phải đọc file này trước, sau đó đọc các tài liệu chi tiết theo đúng thứ tự.

---
Khi tôi đọc lệnh ReviewAgents: thì review và sửa lệnh agent trong file 00. Main

---

## 1. Documentation Order

Agent phải làm việc theo thứ tự:

```text
1. 01-design/DESIGN_OVERVIEW.md
2. 01-design/DESIGN_TOKENS.md
3. 01-design/MOTION_SYSTEM.md
4. 01-design/COMPONENT_ARCHITECTURE.md
5. 01-design/COMPONENT_SPECS.md
6. 01-design/PAGE_PATTERNS.md
7. 02-prd/PRD_OVERVIEW.md
8. 02-prd/USER_STORIES.md
9. 02-prd/FUNCTIONAL_REQUIREMENTS.md
10. 02-prd/NON_FUNCTIONAL_REQUIREMENTS.md
11. 03-technical/TECHNICAL_OVERVIEW.md
12. 03-technical/API_SPEC.md
13. 03-technical/DATA_MODEL.md
14. 04-dev/DEV_PLAN.md
15. 05-test-plan/TEST_PLAN.md
16. 05-test-plan/TEST_CASES.md
17. 06-release/RELEASE_CHECKLIST.md
```

---

## 2. Source of Truth Priority

Khi có mâu thuẫn, ưu tiên:

```text
1. 00-master/PROJECT_BRIEF.md
2. 01-design/*
3. 02-prd/*
4. 03-technical/*
5. 04-dev/*
6. 05-test-plan/*
7. Code hiện tại
```

---

## 3. Phase Rule

Không được code Phase 2 nếu Phase 1 chưa Done.  
Không được code Phase 3 nếu Phase 2 chưa Done.

---

## 4. Agent Rule

Agent không được:

- hard-code màu, spacing, radius, shadow, animation
- tạo component one-off trong page
- tạo feature ngoài PRD
- bỏ qua test plan
- bỏ qua accessibility
- bỏ qua loading / empty / error state
- code vượt phase hiện tại
