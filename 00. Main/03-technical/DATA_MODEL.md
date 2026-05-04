# Data Model

---

## 1. Entities

### Entity: [Name]

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | yes | unique ID |
| name | string | yes | display name |
| status | string | yes | current status |
| createdAt | string | yes | ISO date |
| updatedAt | string | no | ISO date |

---

## 2. Relationships

```text
[Entity A] -> [Entity B]
```

---

## 3. Validation Rules

| Field | Rule | Error |
|---|---|---|
| name | required | Name is required |
| email | valid email | Invalid email |
