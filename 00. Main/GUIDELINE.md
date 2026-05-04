# AI-Driven Project Setup Guideline

Tài liệu này đóng vai trò là SOP (Standard Operating Procedure) hướng dẫn từng bước thiết lập một dự án mới theo chuẩn "AI-Driven Design System Workflow". 

## Mục đích
Đảm bảo khi khởi tạo bất kỳ dự án nào, bạn (User) không cần phải gõ lại prompt dài dòng từ đầu. AI sẽ tự động đọc file này để hiểu kiến trúc, quy trình làm việc và cách thiết lập dự án chuẩn mực.

---

## Các bước thiết lập dự án mới

### Bước 1: Chuẩn bị tài nguyên thiết kế (UI References)
- Gom toàn bộ ảnh thiết kế (Figma Export) vào thư mục `01-design/ui-reference/`.
- **Lưu ý cực kỳ quan trọng:** Phải chuẩn bị sẵn 1-3 tấm ảnh Styleguide (hoặc các màn hình có chứa đầy đủ UI components nhất như Dashboard, Form). Điều này giúp AI Vision có thể bóc tách mã màu HEX chính xác nhất trong một lần chạy mà không cần quét cả nghìn file.

### Bước 2: Copy hệ thống Agent Prompts
- Copy toàn bộ thư mục `00. Main/07-agent-prompts/` (và file `GUIDELINE.md` này) từ dự án mẫu sang dự án mới.
- Hệ thống này bao gồm:
  - `AGENT_START.md`
  - `AGENT_PLANNER.md`
  - `AGENT_CODE_TASK.md`
  - `AGENT_REVIEW.md`

### Bước 3: Khởi động AI Agent (The First Prompt)
Chỉ cần mở cửa sổ chat với AI Agent và gửi đúng 1 câu lệnh khởi động sau:
> *"Hãy đọc file `00. Main/GUIDELINE.md`, `AGENT_START.md` và `AGENT_PLANNER.md` để khởi tạo dự án. Quét ảnh tiêu biểu trong thư mục `ui-reference` để bóc tách mã màu và tạo Design Tokens. Sau đó lên Kế hoạch thực thi Phase 1 (Primitives & Foundations)."*

### Bước 4: Vòng lặp phát triển (The Agile Workflow)
Sau khi Phase 1 hoàn thành, vòng lặp cho mọi tính năng tiếp theo sẽ diễn ra theo chuẩn:
1. **User đưa Yêu cầu:** Gửi ý tưởng tính năng.
2. **Planner Agent lập Kế hoạch:** AI tự nghiên cứu, viết file `implementation_plan.md` chia Phases.
3. **User Duyệt:** User kiểm tra và "Ok".
4. **Coder Agent Thực thi:** AI tự động sinh code, test và cập nhật lại tài liệu.
5. **Đề xuất mới:** Kết thúc task, AI luôn phải đưa ra 5 Đề xuất nâng cấp.

---

## Nguyên tắc "Living Document"
- File `GUIDELINE.md` này và các file Spec là các tài liệu "sống".
- **Quy tắc tuyệt đối cho AI Agent:** Nếu trong quá trình triển khai, AI phát hiện ra một công cụ mới tốt hơn, hoặc có cách setup dự án thông minh hơn (giúp tiết kiệm prompt hơn), AI **BẮT BUỘC** phải tự động cập nhật lại file `GUIDELINE.md` này. Không bao giờ để tài liệu bị lỗi thời so với thực tế dự án!
