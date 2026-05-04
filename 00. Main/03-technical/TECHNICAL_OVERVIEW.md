# Technical Overview

---

## 1. Tech Stack

Frontend: React, Vite, Vanilla CSS
Backend: 
Database: 
Auth: 
Hosting: 
Testing: Vitest, Testing Library

---

## 2. Architecture

```text
src/
  app/ or pages/
  features/
  design-system/
  lib/
  hooks/
  services/
  types/
```

---

## 3. Implementation Principles

- Design system first
- Tokens before components
- Primitives before composite components
- Components before pages
- Phase 1 first
- No over-engineering

---

## 4. State Management

Phase 1:
- local state first
- global state only if necessary

---

## 5. Error Handling

Every async flow needs:
- loading state
- success handling
- error state
- retry if appropriate
