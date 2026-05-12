/**
 * validators.js — Business validation rules cho ms Giang English
 * Dùng chung cho StudentModal, ImportModal, và các form khác.
 */

/* ── Vietnamese text helpers ───────────────────────────────────────────── */

/** Bảng chuyển đổi ký tự tiếng Việt → ASCII */
const VIET_MAP = {
  // ── a ──────────────────────────────────────────────────────────────────
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a', å: 'a', ạ: 'a', ả: 'a',
  ă: 'a', ắ: 'a', ặ: 'a', ằ: 'a', ẳ: 'a', ẵ: 'a',
  ấ: 'a', ậ: 'a', ầ: 'a', ẩ: 'a', ẫ: 'a',
  // ── e ──────────────────────────────────────────────────────────────────
  è: 'e', é: 'e', ê: 'e', ë: 'e', ẹ: 'e', ẻ: 'e', ẽ: 'e',
  ế: 'e', ệ: 'e', ề: 'e', ể: 'e', ễ: 'e',
  // ── i ──────────────────────────────────────────────────────────────────
  ì: 'i', í: 'i', ï: 'i', ĩ: 'i', ị: 'i', ỉ: 'i',
  // ── o ──────────────────────────────────────────────────────────────────
  ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o', ọ: 'o', ỏ: 'o',
  ố: 'o', ộ: 'o', ồ: 'o', ổ: 'o', ỗ: 'o',
  ơ: 'o', ớ: 'o', ợ: 'o', ờ: 'o', ở: 'o', ỡ: 'o',
  // ── u ──────────────────────────────────────────────────────────────────
  ù: 'u', ú: 'u', ü: 'u', ũ: 'u', ụ: 'u', ủ: 'u',
  ư: 'u', ứ: 'u', ự: 'u', ừ: 'u', ử: 'u', ữ: 'u',
  // ── y ──────────────────────────────────────────────────────────────────
  ỳ: 'y', ý: 'y', ỵ: 'y', ỷ: 'y', ỹ: 'y',
  // ── đ ──────────────────────────────────────────────────────────────────
  đ: 'd',
  // ── Uppercase ──────────────────────────────────────────────────────────
  À: 'a', Á: 'a', Â: 'a', Ã: 'a', Ä: 'a', Å: 'a', Ạ: 'a', Ả: 'a',
  Ă: 'a', Ắ: 'a', Ặ: 'a', Ằ: 'a', Ẳ: 'a', Ẵ: 'a',
  Ấ: 'a', Ậ: 'a', Ầ: 'a', Ẩ: 'a', Ẫ: 'a',
  È: 'e', É: 'e', Ê: 'e', Ë: 'e', Ẹ: 'e', Ẻ: 'e', Ẽ: 'e',
  Ế: 'e', Ệ: 'e', Ề: 'e', Ể: 'e', Ễ: 'e',
  Ì: 'i', Í: 'i', Ï: 'i', Ĩ: 'i', Ị: 'i', Ỉ: 'i',
  Ò: 'o', Ó: 'o', Ô: 'o', Õ: 'o', Ö: 'o', Ọ: 'o', Ỏ: 'o',
  Ố: 'o', Ộ: 'o', Ồ: 'o', Ổ: 'o', Ỗ: 'o',
  Ơ: 'o', Ớ: 'o', Ợ: 'o', Ờ: 'o', Ở: 'o', Ỡ: 'o',
  Ù: 'u', Ú: 'u', Ü: 'u', Ũ: 'u', Ụ: 'u', Ủ: 'u',
  Ư: 'u', Ứ: 'u', Ự: 'u', Ừ: 'u', Ử: 'u', Ữ: 'u',
  Ỳ: 'y', Ý: 'y', Ỵ: 'y', Ỷ: 'y', Ỹ: 'y',
  Đ: 'd',
};


/**
 * Chuyển chuỗi tiếng Việt (có dấu hoặc không) → ASCII lowercase.
 * VD: "Nguyễn Văn An" → "nguyen van an"
 */
export const removeVietnamese = (str) =>
  str
    .split('')
    .map((c) => VIET_MAP[c] ?? c)
    .join('')
    .toLowerCase();

/* ── Username generator ────────────────────────────────────────────────── */

/**
 * Sinh username từ họ và tên:
 *   Tên chính + chữ cái đầu của họ + chữ cái đầu của tên lót
 *   Viết thường, không dấu, không khoảng trắng.
 *
 * VD:
 *   "Nguyễn Văn An"  → "annv"
 *   "Trần Thị Minh"  → "minhtt"
 *   "An"             → "an"  (chỉ 1 từ)
 */
export const generateUsernameBase = (fullName) => {
  if (!fullName || !fullName.trim()) return '';

  const words = removeVietnamese(fullName.trim())
    .replace(/[^a-z\s]/g, '')   // bỏ ký tự đặc biệt / số
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '';
  if (words.length === 1) return words[0];

  // Tên chính là từ cuối cùng
  const lastName = words[words.length - 1];
  // Các từ trước (họ + tên lót) → lấy chữ cái đầu
  const initials = words.slice(0, -1).map((w) => w[0]).join('');

  return lastName + initials;
};

/**
 * Tìm username duy nhất từ danh sách học viên hiện tại.
 * Nếu base chưa tồn tại → trả base.
 * Nếu tồn tại → thêm số tăng dần: base1, base2, ...
 *
 * @param {string} base - Username cơ sở (đã sinh từ tên)
 * @param {string[]} existingUsernames - Danh sách username đã có
 * @param {string} [excludeId] - ID học viên đang sửa (bỏ qua chính nó)
 * @returns {string}
 */
export const generateUniqueUsername = (base, existingUsernames, excludeUsername = null) => {
  if (!base) return '';
  const existing = new Set(
    existingUsernames
      .filter((u) => u !== excludeUsername)
      .map((u) => u?.toLowerCase())
  );

  if (!existing.has(base.toLowerCase())) return base;

  let i = 1;
  while (existing.has(`${base}${i}`.toLowerCase())) i++;
  return `${base}${i}`;
};

/* ── Field validators ──────────────────────────────────────────────────── */

/**
 * Validate Họ và tên:
 * - Bắt buộc
 * - Cho phép tiếng Việt có dấu / không dấu
 * - Không chứa số, ký tự đặc biệt
 * - Không có khoảng trắng liên tiếp
 * @returns {string} error message hoặc '' nếu hợp lệ
 */
export const validateFullName = (val) => {
  if (!val || !val.trim()) return 'Họ và tên là bắt buộc';
  if (val.trim().length < 2) return 'Họ và tên quá ngắn';

  // Không cho phép số
  if (/\d/.test(val)) return 'Họ và tên không được chứa số';

  // Không cho phép ký tự đặc biệt (chỉ cho chữ cái, dấu tiếng Việt, khoảng trắng)
  // Regex: chỉ cho Unicode letters + space
  if (/[^a-zA-ZÀ-ỹĐđ\s]/.test(val)) return 'Họ và tên không được chứa ký tự đặc biệt';

  // Không cho khoảng trắng liên tiếp
  if (/\s{2,}/.test(val)) return 'Không được có khoảng trắng liên tiếp';

  return '';
};

/**
 * Auto-format Họ và tên: viết hoa chữ cái đầu mỗi từ.
 * VD: "nguyen van an" → "Nguyen Van An"
 */
export const capitalizeEachWord = (str) =>
  str
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');

/**
 * Validate Email:
 * - Không bắt buộc (nếu trống → OK)
 * - Nếu có nhập → phải đúng định dạng
 * @returns {string} error message hoặc ''
 */
export const validateEmail = (val) => {
  if (!val || !val.trim()) return ''; // optional
  const trimmed = val.trim();
  // RFC 5322-like pattern (đơn giản hoá)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Email không đúng định dạng (VD: abc@gmail.com)';
  return '';
};

/**
 * Validate Số điện thoại Việt Nam:
 * - Bắt buộc
 * - Chỉ số, 10 chữ số
 * - Bắt đầu bằng 03, 05, 07, 08, 09
 * @returns {string} error message hoặc ''
 */
export const validatePhone = (val) => {
  if (!val || !val.trim()) return 'Vui lòng nhập số điện thoại';
  const digits = val.replace(/\D/g, '');
  if (digits.length < 10) return 'Vui lòng nhập đủ 10 số';
  if (digits.length > 10) return 'Số điện thoại không được quá 10 chữ số';
  if (!/^(03|05|07|08|09)/.test(digits))
    return 'Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09';
  return '';
};

/**
 * Validate Mật khẩu (chỉ dùng khi tạo mới):
 * - Bắt buộc khi isNew = true
 * - Tối thiểu 6 ký tự
 * @returns {string} error message hoặc ''
 */
export const validatePassword = (val, isNew = false) => {
  if (isNew && (!val || !val.trim())) return 'Mật khẩu là bắt buộc';
  if (val && val.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  return '';
};

/* ── Validate toàn bộ form học viên ──────────────────────────────────── */

/**
 * Validate tất cả fields của StudentModal.
 * @param {object} form - { name, email, phone, password }
 * @param {boolean} isNew - true khi tạo mới
 * @returns {{ name, email, phone, password }} - object lỗi, '' = không lỗi
 */
export const validateStudentForm = (form, isNew = false) => ({
  name:     validateFullName(form.name),
  // Email: optional — chỉ validate format nếu có nhập giá trị
  email:    form.email?.trim() ? validateEmail(form.email) : '',
  phone:    validatePhone(form.phone),
  password: validatePassword(form.password, isNew),
});

/** Trả true nếu form không có lỗi nào */
export const isFormValid = (errors) =>
  Object.values(errors).every((e) => !e);
