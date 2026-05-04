# Frontend Architecture

---

## 1. Folder Structure

```text
src/
  design-system/
  features/
  hooks/
  lib/
  services/
  types/
```

---

## 2. Design System Implementation Order

1. tokens
2. theme
3. primitives
4. components
5. patterns
6. screens/pages

---

## 3. Feature Structure

```text
src/features/[feature-name]/
  components/
  hooks/
  services/
  types/
  pages/
```

---

## 4. Rules

- Feature components can compose design-system components
- Feature components cannot duplicate design-system components
- Page files should stay thin
- Business logic should not live in design-system
