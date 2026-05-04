-- ======================================================================================
-- HG English LMS — Seed Data (Dữ liệu mẫu ban đầu)
-- Chạy file này SAU KHI đã chạy schema.sql thành công.
-- ======================================================================================


-- ======================================================================================
-- COURSES (Khóa học)
-- ======================================================================================
insert into public.courses (id, name, description, class_group, grade_level, color, gradient) values
  ('course-l1', 'Tiếng Anh Lớp 1', 'Làm quen chữ cái, số đếm, màu sắc và những câu chào hỏi đơn giản đầu tiên.', 'Cấp 1', 1, '#f97316', 'linear-gradient(135deg, #f97316 0%, #fb923c 60%, #fed7aa 100%)'),
  ('course-l2', 'Tiếng Anh Lớp 2', 'Xây dựng vốn từ vựng cơ bản về gia đình, đồ vật và các hoạt động hàng ngày.', 'Cấp 1', 2, '#eab308', 'linear-gradient(135deg, #d97706 0%, #f59e0b 60%, #fde68a 100%)'),
  ('course-l3', 'Tiếng Anh Lớp 3', 'Phát âm chuẩn, ngữ pháp căn bản: câu đơn, động từ To Be và từ vựng chủ đề trường học.', 'Cấp 1', 3, '#22c55e', 'linear-gradient(135deg, #16a34a 0%, #22c55e 60%, #bbf7d0 100%)'),
  ('course-l4', 'Tiếng Anh Lớp 4', 'Mở rộng vốn từ, luyện nghe–nói chủ đề thiên nhiên, con vật và thời tiết.', 'Cấp 1', 4, '#06b6d4', 'linear-gradient(135deg, #0891b2 0%, #06b6d4 60%, #a5f3fc 100%)'),
  ('course-l5', 'Tiếng Anh Lớp 5', 'Hoàn thiện kỹ năng Cấp 1: đọc hiểu đoạn ngắn, viết câu hoàn chỉnh và hội thoại cơ bản.', 'Cấp 1', 5, '#3b82f6', 'linear-gradient(135deg, #2563eb 0%, #3b82f6 60%, #bfdbfe 100%)'),
  ('course-l6', 'Tiếng Anh Lớp 6', 'Bước vào Cấp 2: Present Simple, Present Continuous và từ vựng chủ đề cuộc sống đô thị.', 'Cấp 2', 6, '#8b5cf6', 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 60%, #ddd6fe 100%)'),
  ('course-l7', 'Tiếng Anh Lớp 7', 'Past Simple & Past Continuous, kỹ năng đọc hiểu trung cấp và viết đoạn văn mô tả.', 'Cấp 2', 7, '#ec4899', 'linear-gradient(135deg, #db2777 0%, #ec4899 60%, #fbcfe8 100%)'),
  ('course-l8', 'Tiếng Anh Lớp 8', 'Future tenses, câu điều kiện, luyện viết email và hội thoại giao tiếp thực tế.', 'Cấp 2', 8, '#14b8a6', 'linear-gradient(135deg, #0f766e 0%, #14b8a6 60%, #99f6e4 100%)'),
  ('course-l9', 'Tiếng Anh Lớp 9', 'Ôn tập toàn diện, luyện đề thi vào lớp 10 và phát triển kỹ năng 4 kỹ năng NGHE–NÓI–ĐỌC–VIẾT.', 'Cấp 2', 9, '#f43f5e', 'linear-gradient(135deg, #e11d48 0%, #f43f5e 60%, #fecdd3 100%)');


-- ======================================================================================
-- CHAPTERS (Chương học — dùng course-l3 làm ví dụ chính)
-- ======================================================================================
insert into public.chapters (id, course_id, name, order_index) values
  ('ch-1', 'course-l3', 'Chương 1 — Chào hỏi & Giới thiệu', 1),
  ('ch-2', 'course-l3', 'Chương 2 — Số đếm & Màu sắc',       2),
  ('ch-3', 'course-l3', 'Chương 3 — Trường học',               3),
  ('ch-4', 'course-l3', 'Chương 4 — Ngữ pháp: Động từ To Be', 4),
  ('ch-5', 'course-l3', 'Chương 5 — Từ vựng: Gia đình',       5),
  ('ch-6', 'course-l3', 'Chương 6 — Nghe hiểu',               6),
  ('ch-7', 'course-l7', 'Chương 1 — Present Simple',           1),
  ('ch-8', 'course-l7', 'Chương 2 — Past Simple',               2);


-- ======================================================================================
-- CLASSES (Lớp học)
-- ======================================================================================
insert into public.classes (id, code, name, grade_level, year, sequence, course_id) values
  ('cls-1', '2026.03.01', 'Lớp 3', 3, 2026, 1, 'course-l3'),
  ('cls-2', '2026.07.01', 'Lớp 7', 7, 2026, 1, 'course-l7');


-- ======================================================================================
-- ASSIGNMENTS (Bài tập mẫu)
-- ======================================================================================
insert into public.assignments (id, course_id, chapter_id, type, title, subject, class_group, due_date) values
  ('hw-001', 'course-l3', 'ch-5', 'quiz',      'Unit 5 — Từ vựng: Gia đình',          'Tiếng Anh Cấp 1', 'Lớp 3–4', '2026-05-10'),
  ('hw-002', 'course-l3', 'ch-4', 'quiz',      'Unit 4 — Ngữ pháp: Động từ To Be',    'Tiếng Anh Cấp 1', 'Lớp 3–4', '2026-04-28'),
  ('hw-003', 'course-l3', 'ch-3', 'quiz',      'Unit 3 — Nghe hiểu: Trường học',      'Tiếng Anh Cấp 1', 'Lớp 3–4', '2026-04-20'),
  ('hw-004', 'course-l3', 'ch-2', 'quiz',      'Unit 2 — Ôn tập Số đếm & Màu sắc',   'Tiếng Anh Cấp 1', 'Lớp 3–4', '2026-04-10'),
  ('hw-005', 'course-l3', 'ch-1', 'quiz',      'Unit 1 — Chào hỏi & Giới thiệu',      'Tiếng Anh Cấp 1', 'Lớp 3–4', '2026-04-01'),
  ('hw-006', 'course-l3', 'ch-6', 'listening', 'Listening A — Thói quen hàng ngày',   'Tiếng Anh Cấp 1', 'Lớp 3–4', '2026-05-15'),
  ('hw-007', 'course-l3', 'ch-6', 'listening', 'Listening B — A Day at the Zoo',      'Tiếng Anh Cấp 1', 'Lớp 3–4', '2026-05-20'),
  ('hw-008', 'course-l3', 'ch-6', 'listening', 'Listening C — Mua sắm hàng ngày',    'Tiếng Anh Cấp 1', 'Lớp 3–4', '2026-05-25');

-- Cập nhật script TTS cho bài listening
update public.assignments set script = 'Hello everyone! My name is Tom. I am ten years old.
I wake up at six o''clock every morning.
First, I wash my face and brush my teeth.
Then, I have breakfast with my family.
We usually eat rice, eggs, and vegetables.
After breakfast, I go to school by bicycle.
School starts at seven thirty.
My favorite subject is English.
After school, at four o''clock, I come home and do my homework.
In the evening, I watch TV for one hour, then I go to sleep at nine o''clock.'
where id = 'hw-006';

update public.assignments set script = 'Good afternoon! Today, I am at the City Zoo with my family. The zoo is very big and beautiful.
First, we see the elephants. They are very large and grey. The biggest elephant is four meters tall.
Next, we visit the monkeys. The monkeys are funny. They jump and play all day.
Then, we go to see the lions. Lions are called the king of the jungle. They are very strong and powerful.
After that, we visit the birds section. There are many colorful parrots. Parrots can talk and repeat words!
Finally, we see the dolphins at the water show. The dolphins are very smart. They can jump very high and do many tricks.
It is a wonderful day at the zoo!'
where id = 'hw-007';

-- hw-008 là bài grouped listening — script lưu trong audio_groups
update public.assignments set audio_mode = 'grouped' where id = 'hw-008';


-- ======================================================================================
-- AUDIO GROUPS (cho hw-008)
-- ======================================================================================
insert into public.audio_groups (id, assignment_id, label, script, order_index) values
  ('g1', 'hw-008', 'Đoạn 1 — Hiệu sách',
   'Conversation at a bookshop.
Shop assistant: Good morning! Can I help you?
Customer: Yes, please. I am looking for an English dictionary.
Shop assistant: Of course! We have two types. A small pocket dictionary for fifty thousand dong, and a big dictionary for one hundred and twenty thousand dong.
Customer: How many pages does the big one have?
Shop assistant: It has about eight hundred pages. It also has pictures and example sentences.
Customer: That sounds great! I will take the big one, please.
Shop assistant: Here you are. Would you like a bag?
Customer: Yes, please. Thank you very much!
Shop assistant: You are welcome. Have a nice day!', 1),
  ('g2', 'hw-008', 'Đoạn 2 — Siêu thị',
   'Conversation at a supermarket.
Mother: We need to buy some things for dinner tonight.
Child: What do we need, Mom?
Mother: We need two kilograms of rice, some vegetables, and some meat.
Child: Can I get some orange juice too?
Mother: Sure! But check the price first. We should not spend too much today.
Child: This one is twenty five thousand dong for one liter. Is that okay?
Mother: Yes, that is fine. Now let us go to the vegetable section.
Child: Look, Mom! The tomatoes are on sale. They are half price today!
Mother: Great! Let us get one kilogram of tomatoes then.
Child: This is fun! Shopping with you is always nice, Mom.', 2);


-- ======================================================================================
-- QUESTIONS — hw-001 (Từ vựng Gia đình)
-- ======================================================================================
insert into public.questions (id, assignment_id, text, options, correct_idx, explanation, order_index) values
  ('q1',  'hw-001', '"Mother" trong tiếng Việt nghĩa là gì?',                                          '["Cha","Mẹ","Anh","Em"]', 1, '"Mother" = Mẹ.', 1),
  ('q2',  'hw-001', 'Chọn từ ĐÚNG: "She is my ___." (Cô ấy là chị gái tôi)',                          '["brother","sister","father","uncle"]', 1, '"Sister" = chị/em gái.', 2),
  ('q3',  'hw-001', 'Từ nào KHÔNG phải từ chỉ thành viên gia đình?',                                   '["grandmother","neighbor","daughter","son"]', 1, '"Neighbor" = hàng xóm.', 3),
  ('q4',  'hw-001', '"My father''s mother" là ai?',                                                     '["Aunt","Cousin","Grandmother","Sister"]', 2, 'Mẹ của cha = Grandmother (bà nội).', 4),
  ('q5',  'hw-001', '"Parents" bao gồm những ai?',                                                      '["Cha và ông","Mẹ và bà","Cha và mẹ","Anh và chị"]', 2, '"Parents" = cha + mẹ.', 5),
  ('q6',  'hw-001', 'Dịch sang tiếng Anh: "Con trai"',                                                 '["daughter","nephew","son","niece"]', 2, '"Son" = con trai.', 6),
  ('q7',  'hw-001', '"Uncle" là ai trong tiếng Việt?',                                                  '["Cậu/Chú/Bác","Cô/Dì","Anh trai","Ông nội"]', 0, '"Uncle" = cậu, chú, hoặc bác trai.', 7),
  ('q8',  'hw-001', 'Câu nào ĐÚNG về ngữ pháp?',                                                       '["She have two brothers.","She has two brothers.","She are two brothers.","She having two brothers."]', 1, 'Chủ ngữ "She" dùng "has".', 8),
  ('q9',  'hw-001', '"My mother''s sister" là ai?',                                                     '["Grandmother","Cousin","Aunt","Niece"]', 2, 'Chị/em gái của mẹ = Aunt.', 9),
  ('q10', 'hw-001', 'Điền vào chỗ trống: "I ___ an only child."',                                      '["are","is","am","have"]', 2, '"I" luôn dùng "am".', 10);


-- ======================================================================================
-- QUESTIONS — hw-002 (Động từ To Be)
-- ======================================================================================
insert into public.questions (id, assignment_id, text, options, correct_idx, explanation, order_index) values
  ('q1',  'hw-002', 'Chọn dạng đúng: "She ___ a student."',        '["am","is","are","be"]', 1, 'She → "is".', 1),
  ('q2',  'hw-002', '"They ___ happy."',                             '["am","is","are","be"]', 2, 'They → "are".', 2),
  ('q3',  'hw-002', '"I ___ from Vietnam."',                         '["am","is","are","be"]', 0, 'I → "am".', 3),
  ('q4',  'hw-002', 'Câu phủ định: "He ___ not at home."',          '["am","is","are","be"]', 1, 'He → "is not".', 4),
  ('q5',  'hw-002', '"You ___ my best friend."',                     '["am","is","are","be"]', 2, 'You → "are".', 5),
  ('q6',  'hw-002', 'Câu hỏi đúng là: "___ she a teacher?"',        '["Am","Is","Are","Be"]', 1, 'She → "Is she...?"', 6),
  ('q7',  'hw-002', '"We ___ classmates."',                          '["am","is","are","be"]', 2, 'We → "are".', 7),
  ('q8',  'hw-002', '"It ___ a cat."',                               '["am","is","are","be"]', 1, 'It → "is".', 8),
  ('q9',  'hw-002', '"Are you tired?" — "Yes, I ___."',              '["am","is","are","be"]', 0, '"Yes, I am."', 9),
  ('q10', 'hw-002', '"My dog and my cat ___ cute."',                  '["am","is","are","be"]', 2, '2 chủ ngữ → "are".', 10);


-- ======================================================================================
-- QUESTIONS — hw-006 (Listening A — Thói quen hàng ngày)
-- ======================================================================================
insert into public.questions (id, assignment_id, text, options, correct_idx, explanation, order_index) values
  ('q1',  'hw-006', 'What time does Tom wake up?',          '["5 o''clock","6 o''clock","7 o''clock","8 o''clock"]', 1, '"I wake up at six o''clock."', 1),
  ('q2',  'hw-006', 'What does Tom do FIRST in the morning?','["Have breakfast","Go to school","Wash face and brush teeth","Watch TV"]', 2, '"First, I wash my face and brush my teeth."', 2),
  ('q3',  'hw-006', 'What does Tom have for breakfast?',    '["Bread and milk","Rice, eggs and vegetables","Noodles and soup","Fruit and cereal"]', 1, '"We usually eat rice, eggs, and vegetables."', 3),
  ('q4',  'hw-006', 'How does Tom go to school?',            '["By bus","By car","On foot","By bicycle"]', 3, '"I go to school by bicycle."', 4),
  ('q5',  'hw-006', 'What time does school start?',          '["7:00","7:30","8:00","6:30"]', 1, '"School starts at seven thirty."', 5),
  ('q6',  'hw-006', 'What is Tom''s favorite subject?',      '["Math","Science","English","Art"]', 2, '"My favorite subject is English."', 6),
  ('q7',  'hw-006', 'What time does Tom come home?',         '["3 o''clock","4 o''clock","5 o''clock","6 o''clock"]', 1, '"At four o''clock, I come home."', 7),
  ('q8',  'hw-006', 'What does Tom do after coming home?',   '["Play games","Watch TV","Do homework","Sleep"]', 2, '"I come home and do my homework."', 8),
  ('q9',  'hw-006', 'How long does Tom watch TV?',           '["30 minutes","One hour","Two hours","He doesn''t watch TV"]', 1, '"I watch TV for one hour."', 9),
  ('q10', 'hw-006', 'What time does Tom go to sleep?',       '["8 o''clock","9 o''clock","10 o''clock","10:30"]', 1, '"I go to sleep at nine o''clock."', 10);


-- ======================================================================================
-- ASSIGNMENT → CLASS MAPPING (Bài tập giao cho lớp nào)
-- ======================================================================================
insert into public.assignment_classes (assignment_id, class_id, due_date) values
  ('hw-001', 'cls-1', '2026-05-10'),
  ('hw-002', 'cls-1', '2026-04-28'),
  ('hw-003', 'cls-1', '2026-04-20'),
  ('hw-004', 'cls-1', '2026-04-10'),
  ('hw-005', 'cls-1', '2026-04-01'),
  ('hw-006', 'cls-1', '2026-05-15'),
  ('hw-007', 'cls-1', '2026-05-20'),
  ('hw-008', 'cls-1', '2026-05-25');


-- ======================================================================================
-- HOÀN TẤT!
-- Dữ liệu mẫu đã được import. Tiếp theo:
-- 1. Tạo tài khoản admin trong Authentication > Users
-- 2. Chạy: update public.users set role='admin', name='Hương Giang' where email='giang@hgenglish.vn';
-- ======================================================================================
