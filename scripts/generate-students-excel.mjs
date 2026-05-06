/**
 * generate-students-excel.mjs
 * Fetch classes from Supabase → sinh file Excel học viên mẫu (5-20 hs/lớp)
 * Chạy: node scripts/generate-students-excel.mjs
 */
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

/* ── Supabase config ─────────────────────────────────────────────────────── */
const SUPABASE_URL     = 'https://irkhpiwktnzdaohonmko.supabase.co';
const SUPABASE_ANON    = 'sb_publishable_IazFC_G8ifww9eRbK09yFg__g-NuSHK';
const supabase         = createClient(SUPABASE_URL, SUPABASE_ANON);

/* ── Dữ liệu mẫu tiếng Việt ─────────────────────────────────────────────── */
const HO = [
  'Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Phan','Vũ','Đặng',
  'Bùi','Đỗ','Hồ','Ngô','Dương','Lý','Đinh','Cao','Lâm','Võ','Trịnh',
];
const TEN_DEM = [
  'Văn','Thị','Hữu','Đức','Minh','Bảo','Gia','Quang','Thành','Anh',
  'Ngọc','Lan','Thu','Xuân','Phương','Trung','Hải','Bá','Công','Kim',
];
const TEN = [
  'An','Bình','Chi','Dũng','Em','Giang','Hương','Khanh','Linh','Mai',
  'Nam','Ngân','Oanh','Phúc','Quân','Như','Sơn','Trang','Uyên','Vân',
  'Yến','Hà','Huy','Khoa','Long','Nhung','Quỳnh','Thảo','Trinh','Tuấn',
  'Khang','Hưng','Thắng','Tú','Khánh','Hân','Nhi','Thư','Lâm','Tiến',
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Sinh tên ngẫu nhiên */
const randomName = () => `${rand(HO)} ${rand(TEN_DEM)} ${rand(TEN)}`;

/** Sinh username: [tên][viết tắt họ+đệm]
 * VD: Nguyễn Hải Quân → quannh
 */
const toUsername = (name, idx, classCode, usedUsernames) => {
  const removeDiacritics = (s) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd');

  const parts = name.trim().split(' ');
  const ten   = removeDiacritics(parts[parts.length - 1]).toLowerCase();       // từ cuối
  const initials = parts.slice(0, -1)
    .map(p => removeDiacritics(p)[0]?.toLowerCase() ?? '')                      // chữ cái đầu
    .join('');
  let base = ten + initials;  // vd: quannh

  // Tránh trùng username
  let username = base;
  let counter  = 2;
  while (usedUsernames.has(username)) {
    username = base + counter;
    counter++;
  }
  usedUsernames.add(username);
  return username;
};

/** Số điện thoại ngẫu nhiên */
const randomPhone = () => {
  const prefixes = ['090','091','092','093','094','096','097','098','032','033','034','035','038','039','070','079','077'];
  return rand(prefixes) + String(randInt(1000000, 9999999));
};

/** Mật khẩu mặc định */
const defaultPassword = () => '123456';

/* ── Main ─────────────────────────────────────────────────────────────────── */
async function main() {
  console.log('📡 Đang lấy danh sách lớp từ Supabase...');

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, code, name, grade_level, year')
    .order('year', { ascending: false })
    .order('grade_level', { ascending: true });

  if (error) {
    console.error('❌ Lỗi khi lấy lớp:', error.message);
    process.exit(1);
  }

  if (!classes || classes.length === 0) {
    console.warn('⚠️  Không có lớp nào trong database. Hãy tạo lớp trước!');
    process.exit(0);
  }

  console.log(`✅ Tìm thấy ${classes.length} lớp: ${classes.map(c => c.code).join(', ')}`);

  const rows = [];
  const usedUsernames = new Set();  // global: tránh trùng username toàn bộ file

  for (const cls of classes) {
    const count = randInt(5, 20);
    console.log(`   → Lớp ${cls.code} (${cls.name}): ${count} học viên`);

    const usedNamesInClass = new Set();
    for (let i = 1; i <= count; i++) {
      let name;
      do { name = randomName(); } while (usedNamesInClass.has(name));
      usedNamesInClass.add(name);

      const username = toUsername(name, i, cls.code, usedUsernames);
      const password = defaultPassword();
      const email    = `${username}@gmail.com`;
      const phone    = Math.random() > 0.3 ? randomPhone() : '';

      rows.push({
        username,
        name,
        email,
        phone,
        password,
        class_code: cls.code,
      });
    }
  }

  /* ── Ghi file Excel ────────────────────────────────────────────────────── */
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ['username', 'name', 'email', 'phone', 'password', 'class_code'],
  });

  // Căn rộng cột tự động
  const colWidths = [
    { wch: 28 },  // username
    { wch: 22 },  // name
    { wch: 32 },  // email
    { wch: 14 },  // phone
    { wch: 18 },  // password
    { wch: 12 },  // class_code
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Học viên');

  const __dir = path.dirname(fileURLToPath(import.meta.url));
  const outPath = path.join(__dir, '..', 'students_seed.xlsx');
  XLSX.writeFile(wb, outPath);

  console.log(`\n✅ Đã tạo file: students_seed.xlsx`);
  console.log(`   Tổng cộng: ${rows.length} học viên cho ${classes.length} lớp`);
  console.log(`\n💡 Bây giờ vào app → Người dùng → Học viên → "Import Excel" và chọn file này!`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
