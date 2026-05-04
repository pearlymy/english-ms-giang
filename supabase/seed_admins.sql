-- ======================================================================================
-- INSERT ADMIN ACCOUNTS — HG English LMS
-- Chạy file này SAU KHI đã tạo user trong Supabase Authentication.
--
-- BƯỚC 1: Vào Supabase Dashboard > Authentication > Users > "Add user"
--   Tạo 3 user với email + mật khẩu:
--     - hieu@hgenglish.vn   (mật khẩu tùy chọn)
--     - giang@hgenglish.vn  (mật khẩu tùy chọn)
--     - trang@hgenglish.vn  (mật khẩu tùy chọn)
--
-- BƯỚC 2: Chạy SQL bên dưới trong Supabase > SQL Editor
-- ======================================================================================


-- ── Cấp quyền Admin + đặt tên hiển thị cho 3 tài khoản ────────────────────

update public.users
set
  role   = 'admin',
  name   = 'Hiệu',
  username = 'hieu'
where email = 'hieu@gmail.com';

update public.users
set
  role   = 'admin',
  name   = 'Hương Giang',
  username = 'giang'
where email = 'giang@gmail.com';

update public.users
set
  role   = 'admin',
  name   = 'Trang',
  username = 'trang'
where email = 'trang@gmail.com';


-- ── Kiểm tra kết quả ───────────────────────────────────────────────────────

select id, email, username, name, role, is_active
from public.users
where role = 'admin'
order by name;
