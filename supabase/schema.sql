-- ======================================================================================
-- HG English LMS — Full Database Schema
-- Có thể chạy lại nhiều lần mà không bị lỗi (idempotent).
-- Chạy toàn bộ file này trong Supabase SQL Editor.
-- ======================================================================================


-- ======================================================================================
-- BƯỚC 0: DỌN DẸP — Xóa trigger, function và bảng cũ (nếu có) trước khi tạo lại
-- ======================================================================================

-- Xóa trigger và function cũ
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Xóa bảng theo đúng thứ tự (bảng con trước, bảng cha sau) để tránh lỗi FK
drop table if exists public.assignment_logs    cascade;
drop table if exists public.submissions        cascade;
drop table if exists public.assignment_classes cascade;
drop table if exists public.questions          cascade;
drop table if exists public.audio_groups       cascade;
drop table if exists public.assignments        cascade;
drop table if exists public.classes            cascade;
drop table if exists public.chapters           cascade;
drop table if exists public.courses            cascade;
drop table if exists public.users              cascade;


-- ======================================================================================
-- BẢNG 1: users (Hồ sơ người dùng - mở rộng từ auth.users)
-- ======================================================================================
create table public.users (
  id         uuid    not null references auth.users on delete cascade primary key,
  email      text    not null,
  username   text    unique,
  name       text,
  role       text    not null default 'student' check (role in ('admin', 'student')),
  is_active  boolean not null default true,
  phone      text,
  class_id   text,     -- FK -> classes.id (thêm constraint sau khi tạo bảng classes)
  avatar     text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- RLS cho bảng users
alter table public.users enable row level security;

-- Cho phép bất kỳ ai cũng có thể đọc (để tra cứu username lúc đăng nhập)
create policy "Anyone can view users"
  on public.users for select
  using ( true );

create policy "Admins can update all profiles"
  on public.users for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert profiles"
  on public.users for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Trigger: Tự động tạo hồ sơ khi có user đăng ký mới
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username, role, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'name', 'New User')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ======================================================================================
-- BẢNG 2: courses (Khóa học)
-- ======================================================================================
create table public.courses (
  id          text primary key,         -- vd: 'course-l6'
  name        text not null,
  description text,
  class_group text,                     -- vd: 'Cấp 1', 'Cấp 2'
  grade_level integer not null,
  color       text,
  gradient    text,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

alter table public.courses enable row level security;

create policy "Anyone can view courses"
  on public.courses for select using (true);

create policy "Admins can manage courses"
  on public.courses for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ======================================================================================
-- BẢNG 3: chapters (Chương học)
-- ======================================================================================
create table public.chapters (
  id          text primary key,
  course_id   text not null references public.courses(id) on delete cascade,
  name        text not null,
  order_index integer not null default 1,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

alter table public.chapters enable row level security;

create policy "Anyone can view chapters"
  on public.chapters for select using (true);

create policy "Admins can manage chapters"
  on public.chapters for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ======================================================================================
-- BẢNG 4: classes (Lớp học)
-- ======================================================================================
create table public.classes (
  id          text primary key,         -- vd: 'cls-1'
  code        text not null unique,     -- vd: '2026.03.01'
  name        text not null,
  grade_level integer not null,
  year        integer not null,
  sequence    integer not null default 1,
  course_id   text references public.courses(id) on delete set null,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

-- Thêm FK từ users.class_id -> classes.id (sau khi bảng classes đã tồn tại)
alter table public.users
  add constraint users_class_id_fkey
  foreign key (class_id) references public.classes(id) on delete set null;

alter table public.classes enable row level security;

create policy "Anyone can view classes"
  on public.classes for select using (true);

create policy "Admins can manage classes"
  on public.classes for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ======================================================================================
-- BẢNG 5: assignments (Bài tập)
-- ======================================================================================
create table public.assignments (
  id          text primary key,
  course_id   text references public.courses(id) on delete cascade,
  chapter_id  text references public.chapters(id) on delete set null,
  type        text not null check (type in ('quiz', 'listening')),
  audio_mode  text check (audio_mode in ('single', 'grouped')),
  title       text not null,
  subject     text,
  class_group text,
  due_date    date,
  script      text,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

alter table public.assignments enable row level security;

create policy "Authenticated users can view assignments"
  on public.assignments for select
  using ( auth.role() = 'authenticated' );

create policy "Admins can manage assignments"
  on public.assignments for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ======================================================================================
-- BẢNG 6: audio_groups (Nhóm câu hỏi theo đoạn audio)
-- ======================================================================================
create table public.audio_groups (
  id            text primary key,
  assignment_id text not null references public.assignments(id) on delete cascade,
  label         text not null,
  script        text,
  order_index   integer not null default 1
);

alter table public.audio_groups enable row level security;

create policy "Authenticated users can view audio_groups"
  on public.audio_groups for select
  using ( auth.role() = 'authenticated' );

create policy "Admins can manage audio_groups"
  on public.audio_groups for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ======================================================================================
-- BẢNG 7: questions (Câu hỏi)
-- ======================================================================================
create table public.questions (
  id             text    not null,
  assignment_id  text    not null references public.assignments(id) on delete cascade,
  audio_group_id text    references public.audio_groups(id) on delete set null,
  text           text    not null,
  options        jsonb   not null,   -- ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"]
  correct_idx    integer not null,   -- 0-based index
  explanation    text,
  order_index    integer not null default 1,
  primary key (id, assignment_id)
);

alter table public.questions enable row level security;

create policy "Authenticated users can view questions"
  on public.questions for select
  using ( auth.role() = 'authenticated' );

create policy "Admins can manage questions"
  on public.questions for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ======================================================================================
-- BẢNG 8: assignment_classes (Giao bài tập cho lớp)
-- ======================================================================================
create table public.assignment_classes (
  id            uuid primary key default gen_random_uuid(),
  assignment_id text not null references public.assignments(id) on delete cascade,
  class_id      text not null references public.classes(id) on delete cascade,
  due_date      date,
  assigned_at   timestamp with time zone default timezone('utc', now()) not null,
  unique (assignment_id, class_id)
);

alter table public.assignment_classes enable row level security;

create policy "Authenticated users can view assignment_classes"
  on public.assignment_classes for select
  using ( auth.role() = 'authenticated' );

create policy "Admins can manage assignment_classes"
  on public.assignment_classes for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ======================================================================================
-- BẢNG 9: submissions (Bài nộp của học sinh)
-- ======================================================================================
create table public.submissions (
  id             uuid    primary key default gen_random_uuid(),
  student_id     uuid    not null references public.users(id) on delete cascade,
  assignment_id  text    not null references public.assignments(id) on delete cascade,
  score          numeric(5,2) not null,
  answers        jsonb   not null,   -- [1, 0, 2, 3, ...] index đáp án học sinh chọn
  attempt_number integer not null default 1,
  submitted_at   timestamp with time zone default timezone('utc', now()) not null
);

create index submissions_student_id_idx    on public.submissions(student_id);
create index submissions_assignment_id_idx on public.submissions(assignment_id);

alter table public.submissions enable row level security;

create policy "Students can view own submissions"
  on public.submissions for select
  using ( auth.uid() = student_id );

create policy "Students can insert own submissions"
  on public.submissions for insert
  with check ( auth.uid() = student_id );

create policy "Admins can view all submissions"
  on public.submissions for select
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ======================================================================================
-- BẢNG 10: assignment_logs (Nhật ký giao bài)
-- ======================================================================================
create table public.assignment_logs (
  id             text primary key,   -- vd: '20260504.001'
  assignment_id  text not null references public.assignments(id) on delete cascade,
  class_id       text not null references public.classes(id) on delete cascade,
  action         text not null check (action in ('assigned', 'revoked', 'due_date_updated')),
  due_date       date,
  performed_by   uuid references public.users(id) on delete set null,
  performed_at   timestamp with time zone default timezone('utc', now()) not null
);

alter table public.assignment_logs enable row level security;

create policy "Admins can manage assignment_logs"
  on public.assignment_logs for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );


-- ======================================================================================
-- HƯỚNG DẪN SAU KHI CHẠY SQL:
--
-- Bước 1: Chạy file seed.sql để nhập dữ liệu mẫu (courses, chapters, classes...)
--
-- Bước 2: Tạo tài khoản Admin
--   Vào Supabase Dashboard > Authentication > Users > "Add user"
--   Điền email: giang@hgenglish.vn và đặt mật khẩu.
--
-- Bước 3: Cấp quyền Admin — Chạy câu lệnh sau trong SQL Editor:
--
--   update public.users
--   set role = 'admin', name = 'Hương Giang'
--   where email = 'giang@hgenglish.vn';
-- ======================================================================================
