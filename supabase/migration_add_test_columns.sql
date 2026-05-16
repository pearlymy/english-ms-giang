-- ======================================================================================
-- MIGRATION: Thêm cột test-specific vào bảng assignments
-- Chạy file này trong Supabase SQL Editor
-- ======================================================================================

-- Thêm các cột cho bài kiểm tra (test)
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS is_test         boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_limit_min  integer,
  ADD COLUMN IF NOT EXISTS max_attempts    integer     NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS show_answer     text        NOT NULL DEFAULT 'Có',
  ADD COLUMN IF NOT EXISTS shuffle         boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status          text        NOT NULL DEFAULT 'published';

-- Thêm constraint cho show_answer (sau khi đã thêm cột)
ALTER TABLE public.assignments
  DROP CONSTRAINT IF EXISTS assignments_show_answer_check;

ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_show_answer_check
  CHECK (show_answer IN ('Có', 'Không', 'Sau deadline'));

-- Thêm constraint cho status
ALTER TABLE public.assignments
  DROP CONSTRAINT IF EXISTS assignments_status_check;

ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_status_check
  CHECK (status IN ('draft', 'published'));

-- Cấp quyền RLS cho admin insert/update (bao gồm cột mới)
-- (Policy đã tồn tại từ schema cũ, không cần tạo lại)

-- ======================================================================================
-- SEED DATA: Thêm Units (chapters) cho course-l1 nếu chưa có
-- ======================================================================================

-- Xóa chapters cũ của course-l1 có tên mặc định (tạo qua UI test)
-- Chỉ giữ lại chapters có tên hợp lệ
-- (Bỏ comment dòng dưới nếu muốn xóa sạch và seed lại)
-- DELETE FROM public.chapters WHERE course_id = 'course-l1';

-- Thêm 4 units cho Tiếng Anh Lớp 1 (chỉ insert nếu chưa tồn tại tên đó)
INSERT INTO public.chapters (id, course_id, name, order_index)
SELECT 'unit-l1-1', 'course-l1', 'Unit 1: My School', 1
WHERE NOT EXISTS (SELECT 1 FROM public.chapters WHERE course_id='course-l1' AND name='Unit 1: My School');

INSERT INTO public.chapters (id, course_id, name, order_index)
SELECT 'unit-l1-2', 'course-l1', 'Unit 2: My Family', 2
WHERE NOT EXISTS (SELECT 1 FROM public.chapters WHERE course_id='course-l1' AND name='Unit 2: My Family');

INSERT INTO public.chapters (id, course_id, name, order_index)
SELECT 'unit-l1-3', 'course-l1', 'Unit 3: My House', 3
WHERE NOT EXISTS (SELECT 1 FROM public.chapters WHERE course_id='course-l1' AND name='Unit 3: My House');

INSERT INTO public.chapters (id, course_id, name, order_index)
SELECT 'unit-l1-4', 'course-l1', 'Unit 4: Animals', 4
WHERE NOT EXISTS (SELECT 1 FROM public.chapters WHERE course_id='course-l1' AND name='Unit 4: Animals');

-- Kiểm tra kết quả
SELECT 'assignments columns' as check_type,
       column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'assignments'
  AND column_name IN ('is_test','time_limit_min','max_attempts','show_answer','shuffle','status')
ORDER BY column_name;
