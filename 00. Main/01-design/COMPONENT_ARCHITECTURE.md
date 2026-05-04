# Component Architecture

> Mọi UI phải đi theo cấu trúc: foundations → primitives → components → patterns → pages.

---

## 1. Folder Structure

```text
src/design-system/
  foundations/
    tokens.ts
    theme.ts
    global.css
  primitives/
    Box/
    Text/
    Icon/
    Surface/
    Stack/
    Inline/
    ButtonBase/
    InputBase/
  components/
    Button/
    TextField/
    Select/
    Checkbox/
    Radio/
    Switch/
    Textarea/
    Card/
    Modal/
    Drawer/
    Tooltip/
    Tabs/
    Table/
    Pagination/
    Toast/
    EmptyState/
    ErrorState/
    LoadingState/
  patterns/
    PageHeader/
    FormSection/
    DataTablePage/
    AuthLayout/
```

---

## 2. Foundation Layer

Chứa:

- tokens
- theme
- CSS variables
- global reset
- typography setup
- motion setup

Không chứa business logic.

---

## 3. Primitive Layer

Primitives:

- `Box`
- `Text`
- `Icon`
- `Surface`
- `Stack`
- `Inline`
- `ButtonBase`
- `InputBase`

Primitive chỉ xử lý:

- layout cơ bản
- token mapping
- accessibility cơ bản
- state cơ bản

---

## 4. Component Layer

Reusable components:

- Button
- TextField
- Modal
- Table
- Toast
- EmptyState
- ErrorState
- LoadingState

Component phải:

- dùng primitive
- dùng token
- có variants rõ
- có states rõ
- có accessibility
- có motion theo rule

---

## 5. Pattern Layer

Patterns:

- PageHeader
- FormSection
- DataTablePage
- AuthLayout

Pattern được kết hợp nhiều components nhưng không được hard-code style.

---

## 6. Forbidden

- Không tạo one-off component trong page
- Không duplicate component gần giống nhau
- Không hard-code style
- Không đưa business logic vào design-system
