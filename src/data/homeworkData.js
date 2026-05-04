/**
 * homeworkData.js — Mock assignments for Phase 1
 * Replace with Supabase API calls in Phase 2.
 *
 * Assignment types:
 *   'quiz'      — text questions only, ABCD
 *   'listening' — browser TTS reads `script` aloud; student answers ABCD
 *                 Phase 2: add `audioUrl` field and swap TTS for <audio> element
 */

/* ─────────────────────────────────────────────────
   ASSIGNMENTS
───────────────────────────────────────────────── */
export const ASSIGNMENTS = [
  {
    id: 'hw-006',
    courseId: 'course-1',
    chapterId: 'ch-6',
    type: 'listening',
    title: 'Listening A — Thói quen hàng ngày',
    subject: 'Tiếng Anh Cấp 1',
    classGroup: 'Lớp 3–4',
    dueDate: '2026-05-15',
    /**
     * script — text read aloud by browser TTS (en-US).
     * Phase 2: replace with teacher-uploaded audioUrl.
     */
    script: `Hello everyone! My name is Tom. I am ten years old.
I wake up at six o'clock every morning.
First, I wash my face and brush my teeth.
Then, I have breakfast with my family.
We usually eat rice, eggs, and vegetables.
After breakfast, I go to school by bicycle.
School starts at seven thirty.
My favorite subject is English.
After school, at four o'clock, I come home and do my homework.
In the evening, I watch TV for one hour, then I go to sleep at nine o'clock.`,
    questions: [
      {
        id: 'q1', text: 'What time does Tom wake up?',
        options: ['5 o\'clock', '6 o\'clock', '7 o\'clock', '8 o\'clock'],
        correctIdx: 1,
        explanation: 'Tom says: "I wake up at six o\'clock every morning."',
      },
      {
        id: 'q2', text: 'What does Tom do FIRST in the morning?',
        options: ['Have breakfast', 'Go to school', 'Wash face and brush teeth', 'Watch TV'],
        correctIdx: 2,
        explanation: '"First, I wash my face and brush my teeth."',
      },
      {
        id: 'q3', text: 'What does Tom have for breakfast?',
        options: ['Bread and milk', 'Rice, eggs and vegetables', 'Noodles and soup', 'Fruit and cereal'],
        correctIdx: 1,
        explanation: '"We usually eat rice, eggs, and vegetables."',
      },
      {
        id: 'q4', text: 'How does Tom go to school?',
        options: ['By bus', 'By car', 'On foot', 'By bicycle'],
        correctIdx: 3,
        explanation: '"I go to school by bicycle."',
      },
      {
        id: 'q5', text: 'What time does school start?',
        options: ['7:00', '7:30', '8:00', '6:30'],
        correctIdx: 1,
        explanation: '"School starts at seven thirty."',
      },
      {
        id: 'q6', text: 'What is Tom\'s favorite subject?',
        options: ['Math', 'Science', 'English', 'Art'],
        correctIdx: 2,
        explanation: '"My favorite subject is English."',
      },
      {
        id: 'q7', text: 'What time does Tom come home?',
        options: ['3 o\'clock', '4 o\'clock', '5 o\'clock', '6 o\'clock'],
        correctIdx: 1,
        explanation: '"At four o\'clock, I come home."',
      },
      {
        id: 'q8', text: 'What does Tom do after coming home?',
        options: ['Play games', 'Watch TV', 'Do homework', 'Sleep'],
        correctIdx: 2,
        explanation: '"I come home and do my homework."',
      },
      {
        id: 'q9', text: 'How long does Tom watch TV?',
        options: ['30 minutes', 'One hour', 'Two hours', 'He doesn\'t watch TV'],
        correctIdx: 1,
        explanation: '"I watch TV for one hour."',
      },
      {
        id: 'q10', text: 'What time does Tom go to sleep?',
        options: ['8 o\'clock', '9 o\'clock', '10 o\'clock', '10:30'],
        correctIdx: 1,
        explanation: '"I go to sleep at nine o\'clock."',
      },
    ],
  },
  {
    id: 'hw-007',
    courseId: 'course-1',
    chapterId: 'ch-6',
    type: 'listening',
    title: 'Listening B — A Day at the Zoo',
    subject: 'Tiếng Anh Cấp 1',
    classGroup: 'Lớp 3–4',
    dueDate: '2026-05-20',
    script: `Good afternoon! Today, I am at the City Zoo with my family. The zoo is very big and beautiful.
First, we see the elephants. They are very large and grey. The biggest elephant is four meters tall.
Next, we visit the monkeys. The monkeys are funny. They jump and play all day.
Then, we go to see the lions. Lions are called the king of the jungle. They are very strong and powerful.
After that, we visit the birds section. There are many colorful parrots. Parrots can talk and repeat words!
Finally, we see the dolphins at the water show. The dolphins are very smart. They can jump very high and do many tricks.
It is a wonderful day at the zoo!`,
    questions: [
      {
        id: 'q1', text: 'Where is the speaker today?',
        options: ['At the beach', 'At the park', 'At the zoo', 'At the museum'],
        correctIdx: 2,
        explanation: '"Today, I am at the City Zoo."',
      },
      {
        id: 'q2', text: 'What color are the elephants?',
        options: ['Black', 'Brown', 'Grey', 'White'],
        correctIdx: 2,
        explanation: '"They are very large and grey."',
      },
      {
        id: 'q3', text: 'How tall is the biggest elephant?',
        options: ['2 meters', '3 meters', '4 meters', '5 meters'],
        correctIdx: 2,
        explanation: '"The biggest elephant is four meters tall."',
      },
      {
        id: 'q4', text: 'What do the monkeys do all day?',
        options: ['Sleep', 'Jump and play', 'Eat and swim', 'Run and hide'],
        correctIdx: 1,
        explanation: '"They jump and play all day."',
      },
      {
        id: 'q5', text: 'What are lions called?',
        options: ['King of the ocean', 'King of the jungle', 'King of the sky', 'King of the farm'],
        correctIdx: 1,
        explanation: '"Lions are called the king of the jungle."',
      },
      {
        id: 'q6', text: 'What can parrots do?',
        options: ['Swim underwater', 'Run very fast', 'Carry heavy things', 'Talk and repeat words'],
        correctIdx: 3,
        explanation: '"Parrots can talk and repeat words!"',
      },
      {
        id: 'q7', text: 'What color are the parrots?',
        options: ['Black and white', 'Brown', 'Colorful', 'Grey'],
        correctIdx: 2,
        explanation: '"There are many colorful parrots."',
      },
      {
        id: 'q8', text: 'What animals are at the water show?',
        options: ['Sharks', 'Crocodiles', 'Dolphins', 'Whales'],
        correctIdx: 2,
        explanation: '"We see the dolphins at the water show."',
      },
      {
        id: 'q9', text: 'What can dolphins do?',
        options: ['Jump high and do tricks', 'Talk and sing', 'Run on land', 'Climb trees'],
        correctIdx: 0,
        explanation: '"They can jump very high and do many tricks."',
      },
      {
        id: 'q10', text: 'How does the speaker feel about the day?',
        options: ['Boring', 'Tiring', 'Scary', 'Wonderful'],
        correctIdx: 3,
        explanation: '"It is a wonderful day at the zoo!"',
      },
    ],
  },
  {
    id: 'hw-008',
    courseId: 'course-1',
    chapterId: 'ch-6',
    type: 'listening',
    /**
     * audioMode: 'grouped'
     * Teacher assigns a separate audio clip to each group of questions.
     * audioGroups[].questionIds lists which question IDs that clip covers.
     * Phase 2: replace `script` with `audioUrl` (Supabase Storage URL).
     */
    audioMode: 'grouped',
    title: 'Listening C — Mua sắm hàng ngày',
    subject: 'Tiếng Anh Cấp 1',
    classGroup: 'Lớp 3–4',
    dueDate: '2026-05-25',
    audioGroups: [
      {
        id: 'g1',
        label: 'Đoạn 1 — Hiệu sách',
        script: `Conversation at a bookshop.
Shop assistant: Good morning! Can I help you?
Customer: Yes, please. I am looking for an English dictionary.
Shop assistant: Of course! We have two types. A small pocket dictionary for fifty thousand dong, and a big dictionary for one hundred and twenty thousand dong.
Customer: How many pages does the big one have?
Shop assistant: It has about eight hundred pages. It also has pictures and example sentences.
Customer: That sounds great! I will take the big one, please.
Shop assistant: Here you are. Would you like a bag?
Customer: Yes, please. Thank you very much!
Shop assistant: You are welcome. Have a nice day!`,
        questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
      },
      {
        id: 'g2',
        label: 'Đoạn 2 — Siêu thị',
        script: `Conversation at a supermarket.
Mother: We need to buy some things for dinner tonight.
Child: What do we need, Mom?
Mother: We need two kilograms of rice, some vegetables, and some meat.
Child: Can I get some orange juice too?
Mother: Sure! But check the price first. We should not spend too much today.
Child: This one is twenty five thousand dong for one liter. Is that okay?
Mother: Yes, that is fine. Now let us go to the vegetable section.
Child: Look, Mom! The tomatoes are on sale. They are half price today!
Mother: Great! Let us get one kilogram of tomatoes then.
Child: This is fun! Shopping with you is always nice, Mom.`,
        questionIds: ['q6', 'q7', 'q8', 'q9', 'q10'],
      },
    ],
    questions: [
      // ── Group 1: At the bookshop ──
      {
        id: 'q1', text: 'What is the customer looking for?',
        options: ['A notebook', 'An English dictionary', 'A storybook', 'A pencil case'],
        correctIdx: 1,
        explanation: '"I am looking for an English dictionary."',
      },
      {
        id: 'q2', text: 'How much does the small pocket dictionary cost?',
        options: ['30,000 đ', '50,000 đ', '80,000 đ', '120,000 đ'],
        correctIdx: 1,
        explanation: '"A small pocket dictionary for fifty thousand dong."',
      },
      {
        id: 'q3', text: 'How many pages does the big dictionary have?',
        options: ['About 400 pages', 'About 600 pages', 'About 800 pages', 'About 1000 pages'],
        correctIdx: 2,
        explanation: '"It has about eight hundred pages."',
      },
      {
        id: 'q4', text: 'What special features does the big dictionary have?',
        options: ['CD and audio files', 'Pictures and example sentences', 'Maps and grammar tables', 'Stickers and exercises'],
        correctIdx: 1,
        explanation: '"It also has pictures and example sentences."',
      },
      {
        id: 'q5', text: 'Which dictionary does the customer buy?',
        options: ['The small pocket one', 'The big one', 'Both dictionaries', 'Neither — too expensive'],
        correctIdx: 1,
        explanation: '"I will take the big one, please."',
      },
      // ── Group 2: At the supermarket ──
      {
        id: 'q6', text: 'Why are they at the supermarket?',
        options: ['To buy breakfast', 'To buy dinner ingredients', 'To buy school supplies', 'To meet a friend'],
        correctIdx: 1,
        explanation: '"We need to buy some things for dinner tonight."',
      },
      {
        id: 'q7', text: 'How much rice do they need?',
        options: ['1 kilogram', '2 kilograms', '3 kilograms', '5 kilograms'],
        correctIdx: 1,
        explanation: '"We need two kilograms of rice."',
      },
      {
        id: 'q8', text: 'What does the child want to get?',
        options: ['Apple juice', 'Orange juice', 'Milk', 'Water'],
        correctIdx: 1,
        explanation: '"Can I get some orange juice too?"',
      },
      {
        id: 'q9', text: 'How much is one liter of juice?',
        options: ['15,000 đ', '20,000 đ', '25,000 đ', '30,000 đ'],
        correctIdx: 2,
        explanation: '"This one is twenty five thousand dong for one liter."',
      },
      {
        id: 'q10', text: 'Why do they buy tomatoes?',
        options: ['They are the freshest', 'They are on sale — half price', 'The child loves tomatoes', 'They forgot to buy them before'],
        correctIdx: 1,
        explanation: '"The tomatoes are on sale. They are half price today!"',
      },
    ],
  },
  {
    id: 'hw-001',
    courseId: 'course-1',
    chapterId: 'ch-5',
    type: 'quiz',
    title: 'Unit 5 — Từ vựng: Gia đình',
    subject: 'Tiếng Anh Cấp 1',
    classGroup: 'Lớp 3–4',
    dueDate: '2026-05-10',
    questions: [
      {
        id: 'q1', text: '"Mother" trong tiếng Việt nghĩa là gì?',
        options: ['Cha', 'Mẹ', 'Anh', 'Em'],
        correctIdx: 1,
        explanation: '"Mother" = Mẹ. "Father" = Cha, "Brother" = Anh/Em trai.',
      },
      {
        id: 'q2', text: 'Chọn từ ĐÚNG để điền vào: "She is my ___." (Cô ấy là chị gái tôi)',
        options: ['brother', 'sister', 'father', 'uncle'],
        correctIdx: 1,
        explanation: '"Sister" = chị/em gái. "Brother" = anh/em trai.',
      },
      {
        id: 'q3', text: 'Từ nào KHÔNG phải từ chỉ thành viên gia đình?',
        options: ['grandmother', 'neighbor', 'daughter', 'son'],
        correctIdx: 1,
        explanation: '"Neighbor" = hàng xóm, không phải thành viên gia đình.',
      },
      {
        id: 'q4', text: '"My father\'s mother" là ai?',
        options: ['Aunt', 'Cousin', 'Grandmother', 'Sister'],
        correctIdx: 2,
        explanation: 'Mẹ của cha = Grandmother (bà nội).',
      },
      {
        id: 'q5', text: '"Parents" bao gồm những ai?',
        options: ['Cha và ông', 'Mẹ và bà', 'Cha và mẹ', 'Anh và chị'],
        correctIdx: 2,
        explanation: '"Parents" = cha + mẹ.',
      },
      {
        id: 'q6', text: 'Dịch sang tiếng Anh: "Con trai"',
        options: ['daughter', 'nephew', 'son', 'niece'],
        correctIdx: 2,
        explanation: '"Son" = con trai. "Daughter" = con gái.',
      },
      {
        id: 'q7', text: '"Uncle" là ai trong tiếng Việt?',
        options: ['Cậu/Chú/Bác', 'Cô/Dì', 'Anh trai', 'Ông nội'],
        correctIdx: 0,
        explanation: '"Uncle" = cậu, chú, hoặc bác trai.',
      },
      {
        id: 'q8', text: 'Câu nào ĐÚNG về ngữ pháp?',
        options: [
          'She have two brothers.',
          'She has two brothers.',
          'She are two brothers.',
          'She having two brothers.',
        ],
        correctIdx: 1,
        explanation: 'Chủ ngữ "She" (ngôi 3 số ít) dùng "has", không dùng "have".',
      },
      {
        id: 'q9', text: '"My mother\'s sister" là ai?',
        options: ['Grandmother', 'Cousin', 'Aunt', 'Niece'],
        correctIdx: 2,
        explanation: 'Chị/em gái của mẹ = Aunt (dì/cô).',
      },
      {
        id: 'q10', text: 'Điền vào chỗ trống: "I ___ an only child. I have no brothers or sisters."',
        options: ['are', 'is', 'am', 'have'],
        correctIdx: 2,
        explanation: 'Chủ ngữ "I" luôn dùng "am" với động từ "to be".',
      },
    ],
  },
  {
    id: 'hw-002',
    courseId: 'course-1',
    chapterId: 'ch-4',
    type: 'quiz',
    title: 'Unit 4 — Ngữ pháp: Động từ To Be',
    subject: 'Tiếng Anh Cấp 1',
    classGroup: 'Lớp 3–4',
    dueDate: '2026-04-28',
    questions: [
      {
        id: 'q1', text: 'Chọn dạng đúng: "She ___ a student."',
        options: ['am', 'is', 'are', 'be'],
        correctIdx: 1,
        explanation: 'She (ngôi 3 số ít) → "is".',
      },
      {
        id: 'q2', text: '"They ___ happy."',
        options: ['am', 'is', 'are', 'be'],
        correctIdx: 2,
        explanation: 'They (số nhiều) → "are".',
      },
      {
        id: 'q3', text: '"I ___ from Vietnam."',
        options: ['am', 'is', 'are', 'be'],
        correctIdx: 0,
        explanation: 'I → "am".',
      },
      {
        id: 'q4', text: 'Câu phủ định: "He ___ not at home."',
        options: ['am', 'is', 'are', 'be'],
        correctIdx: 1,
        explanation: 'He (ngôi 3 số ít) → "is not" hoặc "isn\'t".',
      },
      {
        id: 'q5', text: '"You ___ my best friend."',
        options: ['am', 'is', 'are', 'be'],
        correctIdx: 2,
        explanation: 'You → "are".',
      },
      {
        id: 'q6', text: 'Câu hỏi đúng là: "___  she a teacher?"',
        options: ['Am', 'Is', 'Are', 'Be'],
        correctIdx: 1,
        explanation: 'She → "Is she...?"',
      },
      {
        id: 'q7', text: '"We ___ classmates."',
        options: ['am', 'is', 'are', 'be'],
        correctIdx: 2,
        explanation: 'We (số nhiều) → "are".',
      },
      {
        id: 'q8', text: '"It ___ a cat."',
        options: ['am', 'is', 'are', 'be'],
        correctIdx: 1,
        explanation: 'It (ngôi 3 số ít) → "is".',
      },
      {
        id: 'q9', text: 'Trả lời ngắn: "Are you tired?" — "Yes, I ___."',
        options: ['am', 'is', 'are', 'be'],
        correctIdx: 0,
        explanation: 'Short answer "Yes, I am."',
      },
      {
        id: 'q10', text: '"My dog and my cat ___ cute."',
        options: ['am', 'is', 'are', 'be'],
        correctIdx: 2,
        explanation: '"My dog and my cat" = 2 chủ ngữ → dùng "are".',
      },
    ],
  },
  {
    id: 'hw-003',
    courseId: 'course-1',
    chapterId: 'ch-3',
    type: 'quiz',
    title: 'Unit 3 — Nghe hiểu: Trường học',
    subject: 'Tiếng Anh Cấp 1',
    classGroup: 'Lớp 3–4',
    dueDate: '2026-04-20',
    questions: [
      {
        id: 'q1', text: '"Classroom" nghĩa là gì?',
        options: ['Phòng ngủ', 'Phòng bếp', 'Phòng học', 'Phòng khách'],
        correctIdx: 2,
        explanation: '"Classroom" = phòng học.',
      },
      {
        id: 'q2', text: '"Teacher" nghĩa là gì?',
        options: ['Học sinh', 'Giáo viên', 'Hiệu trưởng', 'Phụ huynh'],
        correctIdx: 1,
        explanation: '"Teacher" = giáo viên.',
      },
      {
        id: 'q3', text: 'Dụng cụ nào KHÔNG có trong lớp học?',
        options: ['blackboard', 'desk', 'refrigerator', 'chalk'],
        correctIdx: 2,
        explanation: '"Refrigerator" = tủ lạnh, không có trong lớp học.',
      },
      {
        id: 'q4', text: '"Open your book." nghĩa là?',
        options: ['Đóng sách lại', 'Mở sách ra', 'Đặt sách xuống', 'Lấy sách ra'],
        correctIdx: 1,
        explanation: '"Open" = mở. Trái nghĩa là "Close/Shut".',
      },
      {
        id: 'q5', text: '"Homework" nghĩa là?',
        options: ['Bài kiểm tra', 'Bài học trên lớp', 'Bài tập về nhà', 'Sách giáo khoa'],
        correctIdx: 2,
        explanation: '"Homework" = bài tập về nhà.',
      },
      {
        id: 'q6', text: '"She sits next to me." nghĩa là?',
        options: [
          'Cô ấy ngồi trước tôi',
          'Cô ấy ngồi sau tôi',
          'Cô ấy ngồi cạnh tôi',
          'Cô ấy đứng cạnh tôi',
        ],
        correctIdx: 2,
        explanation: '"Next to" = cạnh bên.',
      },
      {
        id: 'q7', text: '"Pencil case" là gì?',
        options: ['Hộp bút chì', 'Cái thước', 'Cái tẩy', 'Cái bút mực'],
        correctIdx: 0,
        explanation: '"Pencil case" = hộp/túi đựng bút.',
      },
      {
        id: 'q8', text: 'Câu lệnh nào dùng trong lớp học?',
        options: [
          'Swim faster!',
          'Stand up, please.',
          'Cook the rice.',
          'Drive carefully.',
        ],
        correctIdx: 1,
        explanation: '"Stand up" là lệnh thường dùng trong lớp học.',
      },
      {
        id: 'q9', text: '"Library" là?',
        options: ['Thư viện', 'Canteen', 'Phòng thể thao', 'Phòng y tế'],
        correctIdx: 0,
        explanation: '"Library" = thư viện.',
      },
      {
        id: 'q10', text: '"How many students are in your class?" — "There ___ 25 students."',
        options: ['am', 'is', 'are', 'be'],
        correctIdx: 2,
        explanation: '"There are" dùng cho số nhiều.',
      },
    ],
  },
  {
    id: 'hw-004',
    courseId: 'course-1',
    chapterId: 'ch-2',
    type: 'quiz',
    title: 'Unit 2 — Ôn tập Số đếm & Màu sắc',
    subject: 'Tiếng Anh Cấp 1',
    classGroup: 'Lớp 3–4',
    dueDate: '2026-04-10',
    questions: [
      {
        id: 'q1', text: '"Fifteen" viết bằng số là?',
        options: ['5', '50', '15', '150'],
        correctIdx: 2,
        explanation: '"Fifteen" = 15.',
      },
      {
        id: 'q2', text: '"The sky is ___." (bầu trời màu xanh dương)',
        options: ['red', 'green', 'blue', 'yellow'],
        correctIdx: 2,
        explanation: '"Blue" = màu xanh dương.',
      },
      {
        id: 'q3', text: 'Màu nào là màu của lá cây?',
        options: ['purple', 'orange', 'green', 'pink'],
        correctIdx: 2,
        explanation: '"Green" = xanh lá cây.',
      },
      {
        id: 'q4', text: '"Thirty plus ten equals ___."',
        options: ['thirty', 'forty', 'fifty', 'twenty'],
        correctIdx: 1,
        explanation: '30 + 10 = 40 = "forty".',
      },
      {
        id: 'q5', text: 'Số thứ tự của 3 là?',
        options: ['three', 'third', 'thirdly', 'threeth'],
        correctIdx: 1,
        explanation: '"Third" = thứ ba (số thứ tự).',
      },
      {
        id: 'q6', text: '"My favorite color is ___." (màu vàng)',
        options: ['white', 'black', 'yellow', 'brown'],
        correctIdx: 2,
        explanation: '"Yellow" = màu vàng.',
      },
      {
        id: 'q7', text: '"One hundred" viết bằng số là?',
        options: ['10', '100', '1000', '110'],
        correctIdx: 1,
        explanation: '"One hundred" = 100.',
      },
      {
        id: 'q8', text: 'Màu của mặt trời mọc (màu cam) là?',
        options: ['red', 'orange', 'pink', 'yellow'],
        correctIdx: 1,
        explanation: '"Orange" = màu cam.',
      },
      {
        id: 'q9', text: '"How old are you?" — "I am ___ years old." (12 tuổi)',
        options: ['twelve', 'twenty', 'twelfth', 'two'],
        correctIdx: 0,
        explanation: '"Twelve" = 12.',
      },
      {
        id: 'q10', text: 'Màu trắng trong tiếng Anh là?',
        options: ['black', 'grey', 'white', 'silver'],
        correctIdx: 2,
        explanation: '"White" = màu trắng. "Black" = màu đen.',
      },
    ],
  },
  {
    id: 'hw-005',
    courseId: 'course-1',
    chapterId: 'ch-1',
    type: 'quiz',
    title: 'Unit 1 — Chào hỏi & Giới thiệu',
    subject: 'Tiếng Anh Cấp 1',
    classGroup: 'Lớp 3–4',
    dueDate: '2026-04-01',
    questions: [
      {
        id: 'q1', text: '"Nice to meet you." nghĩa là?',
        options: [
          'Tạm biệt nhé.',
          'Rất vui được gặp bạn.',
          'Bạn khỏe không?',
          'Cảm ơn bạn.',
        ],
        correctIdx: 1,
        explanation: '"Nice to meet you" = Rất vui được gặp bạn.',
      },
      {
        id: 'q2', text: '"What is your name?" — Câu trả lời đúng là?',
        options: [
          'I am fine.',
          'My name is Minh.',
          'I am 10 years old.',
          'I am from Hanoi.',
        ],
        correctIdx: 1,
        explanation: 'Hỏi tên → Trả lời "My name is ___."',
      },
      {
        id: 'q3', text: '"Goodbye" nghĩa là?',
        options: ['Xin chào', 'Cảm ơn', 'Tạm biệt', 'Xin lỗi'],
        correctIdx: 2,
        explanation: '"Goodbye" = tạm biệt.',
      },
      {
        id: 'q4', text: '"How are you?" — Câu trả lời thông thường là?',
        options: [
          'I am Minh.',
          'I am 10.',
          'I am fine, thank you.',
          'I am from Vietnam.',
        ],
        correctIdx: 2,
        explanation: '"How are you?" hỏi sức khỏe → "I am fine, thank you."',
      },
      {
        id: 'q5', text: '"Where are you from?" — "I am from ___."',
        options: ['ten', 'Monday', 'Vietnam', 'happy'],
        correctIdx: 2,
        explanation: 'Hỏi quê quán → trả lời bằng tên quốc gia/thành phố.',
      },
      {
        id: 'q6', text: '"Thank you." — Câu đáp lại lịch sự là?',
        options: [
          'No problem.',
          'You are welcome.',
          'Excuse me.',
          'Sorry.',
        ],
        correctIdx: 1,
        explanation: '"You are welcome." = Không có gì / Không sao.',
      },
      {
        id: 'q7', text: 'Lời chào buổi sáng là?',
        options: [
          'Good night.',
          'Good afternoon.',
          'Good morning.',
          'Good evening.',
        ],
        correctIdx: 2,
        explanation: '"Good morning" = Chào buổi sáng.',
      },
      {
        id: 'q8', text: '"How old are you?" — "I am ___ years old."',
        options: ['name', 'fine', 'ten', 'Vietnam'],
        correctIdx: 2,
        explanation: 'Hỏi tuổi → trả lời bằng số tuổi.',
      },
      {
        id: 'q9', text: '"Excuse me." dùng khi nào?',
        options: [
          'Khi muốn cảm ơn',
          'Khi muốn xin lỗi hoặc gây chú ý',
          'Khi tạm biệt',
          'Khi giới thiệu bản thân',
        ],
        correctIdx: 1,
        explanation: '"Excuse me" dùng để xin lỗi (khi va phải người), hoặc gây chú ý.',
      },
      {
        id: 'q10', text: '"See you tomorrow." nghĩa là?',
        options: [
          'Hẹn gặp ngày mai.',
          'Chúc ngủ ngon.',
          'Chúc buổi sáng tốt lành.',
          'Rất vui được gặp bạn.',
        ],
        correctIdx: 0,
        explanation: '"See you tomorrow" = Hẹn gặp lại ngày mai.',
      },
    ],
  },
];

/* ─────────────────────────────────────────────────
   SEED PROGRESS — Pre-seeded demo data for student
   (Stored in localStorage; only used as initial value)
───────────────────────────────────────────────── */
export const SEED_PROGRESS = {
  'hw-002': {
    attempts: [
      {
        number: 1,
        answers: [1, 2, 0, 1, 2, 1, 2, 1, 0, 2], // 9 correct
        score: 9,
        submittedAt: '2026-04-26T09:00:00Z',
      },
    ],
  },
  'hw-003': {
    attempts: [
      {
        number: 1,
        answers: [2, 1, 2, 1, 2, 2, 0, 2, 0, 2], // 6 correct
        score: 6,
        submittedAt: '2026-04-18T15:30:00Z',
      },
    ],
  },
  'hw-004': {
    attempts: [
      {
        number: 1,
        answers: [2, 2, 2, 1, 1, 2, 1, 1, 0, 2], // 7 correct
        score: 7,
        submittedAt: '2026-04-08T10:00:00Z',
      },
      {
        number: 2,
        answers: [2, 2, 2, 1, 1, 2, 1, 1, 0, 2], // 8 correct
        score: 8,
        submittedAt: '2026-04-09T14:00:00Z',
      },
    ],
  },
  'hw-005': {
    attempts: [
      {
        number: 1,
        answers: [1, 1, 2, 2, 2, 1, 2, 2, 1, 0], // 10 correct
        score: 10,
        submittedAt: '2026-03-30T08:00:00Z',
      },
    ],
  },
};

/* ─────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────── */
/** Score an attempt: compare answers array with correctIdx of each question */
export const scoreAttempt = (assignment, answers) => {
  let correct = 0;
  assignment.questions.forEach((q, i) => {
    if (answers[i] === q.correctIdx) correct++;
  });
  return correct;
};

/**
 * canViewAnswers — true if:
 *   any attempt scored ≥ 9, OR student has made ≥ 2 attempts
 */
export const canViewAnswers = (attempts = []) =>
  attempts.some((a) => a.score >= 9) || attempts.length >= 2;
