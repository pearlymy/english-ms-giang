# API Spec

---

## 1. API Principles

- Consistent response shape
- Consistent error shape
- Validate input
- Do not expose internal error
- Support loading/error states in UI

---

## 2. Response Format

```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```

---

## 3. Error Format

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input"
  }
}
```

---

## 4. Endpoints

| Method | Endpoint | Purpose | Phase |
|---|---|---|---|
| GET | `/api/items` | List items | Phase 1 |
| POST | `/api/items` | Create item | Phase 1 |
| GET | `/api/items/:id` | Get detail | Phase 2 |
| PATCH | `/api/items/:id` | Update item | Phase 2 |
| DELETE | `/api/items/:id` | Delete item | Phase 3 |
