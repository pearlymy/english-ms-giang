"Dưới đây là bộ User Stories (Epic 3, 4, 5) cho tính năng 'Quản lý Chương và Bài tập' trong Dashboard Giáo viên. Hãy dựa vào đây để cập nhật Database Schema của hệ thống (lưu ý các trường như order_index để drag-drop, is_draft, max_retries, default_duration...). Sau khi chốt Schema, hãy triển khai các API (CRUD chương, bài tập, gán bài cho class) và tạo UI Components tương ứng trên frontend. Chú ý xử lý kỹ phần state logic khi Assign (Start Date, Deadline) và điều kiện hiển thị đáp án sau khi hết lượt làm lại (retries)."

Epic 3: Quản lý Chương (Chapter Management)
User Story 3.1: Tạo chương mới

As a Giáo viên

I want to tạo một chương mới bằng một popup nhỏ gọn.

So that tôi có thể tổ chức nội dung khóa học một cách nhanh chóng mà không bị chuyển trang.

Acceptance Criteria (AC):

Khi bấm nút + Thêm chương, hệ thống hiển thị một Modal/Popup.

Popup bao gồm các trường: Tên chương (Bắt buộc), Mô tả ngắn (Không bắt buộc).

Sau khi bấm "Lưu", popup đóng lại và chương mới được tự động thêm vào vị trí cuối cùng của danh sách chương hiện tại.

User Story 3.2: Sắp xếp thứ tự chương

As a Giáo viên

I want to kéo thả (drag & drop) các chương.

So that tôi có thể dễ dàng thay đổi thứ tự học của các chương theo ý muốn.

Acceptance Criteria (AC):

Giao diện cho phép giữ chuột (hold) và kéo thả các khối "Chương" lên/xuống.

Khi thả chuột (drop), hệ thống tự động gọi API cập nhật lại order_index của các chương trong Database.

Epic 4: Quản lý Bài tập / Bài học (Lesson & Exercise Management)
User Story 4.1: Tạo khung bài tập

As a Giáo viên

I want to tạo nhanh một khung bài tập trống nằm trong một chương.

So that tôi có thể lên dàn ý các bài tập trước, sau đó mới vào chỉnh sửa nội dung chi tiết.

Acceptance Criteria (AC):

Khi bấm + Thêm bài tập ở dưới cùng của một Chương, hệ thống tạo ngay một record bài tập trống (hoặc popup nhập nhanh Tên bài tập) và hiển thị trực tiếp trên UI.

User Story 4.2: Soạn thảo nội dung bài tập

As a Giáo viên

I want to chỉnh sửa bài tập để tải lên các file đa phương tiện và văn bản.

So that bài tập sinh động và truyền tải đủ nội dung.

Acceptance Criteria (AC):

Khi bấm icon "Edit" (cây bút) trên bài tập, hệ thống mở giao diện soạn thảo chi tiết.

Trình soạn thảo hỗ trợ upload/chèn: Hình ảnh (Image), File âm thanh (MP3), và Văn bản (Text/Rich Text).

User Story 4.3: Cấu hình thông số bài tập

As a Giáo viên

I want to thiết lập thời gian làm bài, điểm đạt và số lần làm lại.

So that tôi có thể kiểm soát độ khó và quy chế làm bài của học viên.

Acceptance Criteria (AC):

Giao diện cấu hình có các trường: Thời gian làm bài (phút), Điểm cần đạt (Pass score), Số lần làm lại tối đa.

Logic mặc định: Thời gian làm bài mặc định là 10 phút.

Có nút/checkbox: "Lưu cấu hình này làm mặc định cho các lần sau" (Save as default template).

Logic hiển thị đáp án: Hệ thống chỉ hiển thị đáp án cho học viên sau khi họ đã làm lại tối đa số lần cho phép (Mặc định set là tối đa 2 lần).

User Story 4.4: Lưu nháp (Draft Mode)

As a Giáo viên

I want to chuyển trạng thái bài tập thành "Nháp" (Draft).

So that học viên không thể nhìn thấy bài tập này dù nó đã nằm trong một chương được giao.

Acceptance Criteria (AC):

Mỗi bài tập có một trạng thái là Published hoặc Draft.

Nếu ở trạng thái Draft, API lấy danh sách bài tập phía học viên tuyệt đối không trả về bài tập này.

Epic 5: Giao bài (Assigning)
User Story 5.1: Giao bài ở cấp độ Chương

As a Giáo viên

I want to bấm icon máy bay giấy ở dòng tên Chương để giao toàn bộ bài tập trong chương đó.

So that tôi tiết kiệm thời gian, không phải giao lắt nhắt từng bài.

Acceptance Criteria (AC):

Bấm icon Assign (Máy bay giấy) -> Mở modal Assign.

Modal cho phép chọn nhiều Lớp học cùng lúc (Multi-select dropdown/checkbox).

Phải chọn Start Date (Ngày bắt đầu hiển thị) và Deadline (Hạn chót nộp bài).

Khi xác nhận, toàn bộ các bài tập (trừ bài đang Draft) trong chương đó sẽ được gán cho các lớp đã chọn với cùng Start Date và Deadline.

User Story 5.2: Giao bài ở cấp độ Bài tập lẻ

As a Giáo viên

I want to bấm icon Assign (hình nhóm người) ở dòng Bài tập để giao riêng bài đó.

So that tôi có thể giao các bài kiểm tra/bài tập cá biệt cho các lớp khác nhau với deadline khác nhau.

Acceptance Criteria (AC):

Bấm icon Assign (Nhóm người) trên 1 bài tập -> Mở modal Assign.

Tính năng tương tự 5.1 (Chọn nhiều lớp, set Start Date, set Deadline) nhưng thao tác này chỉ áp dụng cho duy nhất bài tập đó (Overwrite lại thông số nếu trước đó đã assign theo chương).

User Story 4.5: Nhóm câu hỏi dùng chung một file Audio (MP3)As a Giáo viênI want to tải lên 1 file MP3 và gán nó cho một dải câu hỏi liên tiếp (từ câu $n$ đến câu $n+x$).So that học viên có thể nghe một đoạn âm thanh duy nhất để trả lời cho toàn bộ cụm câu hỏi đó.Acceptance Criteria (AC):Trong giao diện soạn thảo bài tập, giáo viên có nút "Thêm Nhóm câu hỏi" (Add Question Group) hoặc "Thêm file Audio chung".Giáo viên có thể tải lên file MP3 và chọn dải câu hỏi áp dụng (Ví dụ: Áp dụng từ câu 1 đến câu 3).Về mặt hiển thị (UI) phía học viên: Khi làm bài, trình phát nhạc (Audio Player) của file MP3 này sẽ ghim (sticky) trên màn hình hoặc hiển thị rõ ràng ngay phía trên cụm câu hỏi từ $n$ đến $n+x$, giúp học viên vừa nghe vừa cuộn chuột đọc/đáp câu hỏi mà không bị mất thanh điều khiển audio.