"""
Tạo file Excel template với:
- Cột gọn: No, Question Type (dropdown), Question Text, Option A-D, Correct Answer, Explanation
- Data validation dropdown cho cột Question Type
- Bỏ: Unit, Skill, Audio File, Transcript
"""
try:
    import openpyxl
    from openpyxl.worksheet.datavalidation import DataValidation
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'openpyxl', '-q'])
    import openpyxl
    from openpyxl.worksheet.datavalidation import DataValidation

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ─── Tạo workbook ───────────────────────────────────────────────
wb = Workbook()
ws = wb.active
ws.title = "Câu hỏi"

# ─── Header cột ─────────────────────────────────────────────────
HEADERS = [
    "Question No",
    "Question Type",
    "Question Text",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Correct Answer",
    "Explanation",
]

# Màu header
header_fill = PatternFill("solid", fgColor="1E40AF")
hint_fill   = PatternFill("solid", fgColor="EFF6FF")

for col_idx, h in enumerate(HEADERS, 1):
    cell = ws.cell(row=1, column=col_idx, value=h)
    cell.font      = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
    cell.fill      = header_fill
    cell.alignment = Alignment(horizontal="center", vertical="center")

# ─── Column widths ───────────────────────────────────────────────
widths = [14, 28, 50, 25, 25, 25, 25, 20, 35]
for i, w in enumerate(widths, 1):
    ws.column_dimensions[get_column_letter(i)].width = w
ws.row_dimensions[1].height = 30


# ─── Dropdown data validation cho cột B (Question Type) ─────────
TYPE_OPTIONS = [
    "Trắc nghiệm (1 đáp án)",
    "Trắc nghiệm (nhiều đáp án)",
    "Đúng / Sai",
    "Điền vào chỗ trống",
    "Viết ngắn",
    "Nối đôi",
    "Sắp xếp thứ tự",
    "Nghe hiểu",
]
# Tạo sheet ẩn chứa danh sách để dropdown hoạt động đúng với chuỗi dài
ws_lists = wb.create_sheet("_Lists", 1)
ws_lists.sheet_state = "hidden"
for r, opt in enumerate(TYPE_OPTIONS, 1):
    ws_lists.cell(row=r, column=1, value=opt)

list_range = f"_Lists!$A$1:$A${len(TYPE_OPTIONS)}"

dv = DataValidation(
    type="list",
    formula1=list_range,
    allow_blank=True,
    showDropDown=False,   # False = hiện mũi tên dropdown
    showErrorMessage=True,
    errorTitle="Loại không hợp lệ",
    error="Vui lòng chọn từ danh sách.",
    showInputMessage=True,
    promptTitle="Chọn loại câu hỏi",
    prompt="Bấm vào ô rồi chọn loại từ danh sách."
)
dv.sqref = "B2:B1000"
ws.add_data_validation(dv)

# ─── Dữ liệu test (bắt đầu từ row 2) ────────────────────────────────
thin   = Side(style="thin", color="E2E8F0")
border = Border(left=thin, right=thin, top=thin, bottom=thin)
fills  = [PatternFill("solid", fgColor="FFFFFF"), PatternFill("solid", fgColor="F8FAFC")]

# (No, Type, Text, A, B, C, D, Answer, Explanation)
ROWS = [
    # 1. Multiple choice — hợp lệ
    ("1", "Trắc nghiệm (1 đáp án)",
     "Which sentence is correct?",
     "She go to school", "She goes to school", "She going to school", "She gone to school",
     "B", "Present simple 3rd person singular uses 'goes'."),

    # 2. True/False — hợp lệ
    ("2", "Đúng / Sai",
     "Dogs can fly.",
     "", "", "", "",
     "Sai", "Dogs cannot fly, they are mammals."),

    # 3. Fill in the blank — hợp lệ
    ("3", "Điền vào chỗ trống",
     "I ___ (eat) breakfast at 7am every day.",
     "", "", "", "",
     "eat", "Present simple: I + eat (1st person)"),

    # 4. Listening — audio sẽ upload ở Bước 3
    ("4", "Nghe hiểu",
     "Listen and choose: What sport does Tom play?",
     "Football", "Basketball", "Swimming", "Tennis",
     "A", ""),

    # 5. Short answer — giáo viên chấm, không cần đáp án
    ("5", "Viết ngắn",
     "Describe your favorite season in 2-3 sentences.",
     "", "", "", "",
     "", ""),

    # 6. Multiple choice — thiếu đáp án → WARNING
    ("6", "Trắc nghiệm (1 đáp án)",
     "What is the main idea of the passage?",
     "Nature conservation", "Ocean pollution", "Climate change", "Deforestation",
     "", ""),

    # 7. Nối đôi — cú pháp: "left=right, left=right"
    ("7", "Nối đôi",
     "Match the words with their meanings:",
     "", "", "", "",
     "happy=vui, sad=buồn, big=lớn, small=nhỏ", ""),

    # 8. Sắp xếp thứ tự — cú pháp: items ngăn bởi dấu phẩy
    ("8", "Sắp xếp thứ tự",
     "Put the words in the correct order to form a sentence:",
     "", "", "", "",
     "I, go, to, school, every day", ""),

    # 9. Trắc nghiệm nhiều đáp án — đáp án: A,C
    ("9", "Trắc nghiệm (nhiều đáp án)",
     "Which of the following are primary colors?",
     "Red", "Green", "Blue", "Yellow",
     "A,C", "Red and Blue are primary colors."),
]

for row_idx, row_data in enumerate(ROWS, 2):  # data bắt đầu row 2
    fill = fills[row_idx % 2]
    for col_idx, val in enumerate(row_data, 1):
        cell = ws.cell(row=row_idx, column=col_idx, value=val)
        cell.font      = Font(name="Calibri", size=10)
        cell.fill      = fill
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        cell.border    = border
    ws.row_dimensions[row_idx].height = 24

ws.freeze_panes = "A2"

# ─── Lưu file ────────────────────────────────────────────────────
import os

# File test
OUT_TEST = r"E:\IT_Project\01. ms Giang English\english-ms-giang\public\test-upload.xlsx"
wb.save(OUT_TEST)
print(f"✅ test-upload.xlsx: {OUT_TEST}")

# File template (mau-bai-tap.xlsx) — chỉ giữ hàng header + guide, xoá data
wb2 = Workbook()
ws2 = wb2.active
ws2.title = "Câu hỏi"

# Copy header
for col_idx, h in enumerate(HEADERS, 1):
    cell = ws2.cell(row=1, column=col_idx, value=h)
    cell.font      = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
    cell.fill      = header_fill
    cell.alignment = Alignment(horizontal="center", vertical="center")
for i, w in enumerate(widths, 1):
    ws2.column_dimensions[get_column_letter(i)].width = w
ws2.row_dimensions[1].height = 30

# Dropdown trên template
ws2_lists = wb2.create_sheet("_Lists", 1)
ws2_lists.sheet_state = "hidden"
for r, opt in enumerate(TYPE_OPTIONS, 1):
    ws2_lists.cell(row=r, column=1, value=opt)

dv2 = DataValidation(
    type="list",
    formula1=list_range,
    allow_blank=True,
    showDropDown=False,
    showErrorMessage=True,
    errorTitle="Loại không hợp lệ",
    error="Vui lòng chọn từ danh sách.",
    showInputMessage=True,
    promptTitle="Chọn loại câu hỏi",
    prompt="Bấm vào ô rồi chọn loại từ danh sách."
)
dv2.sqref = "B2:B1000"
ws2.add_data_validation(dv2)

ws2.freeze_panes = "A2"

OUT_TEMPLATE = r"E:\IT_Project\01. ms Giang English\english-ms-giang\public\mau-bai-tap.xlsx"
wb2.save(OUT_TEMPLATE)
print(f"✅ mau-bai-tap.xlsx:  {OUT_TEMPLATE}")
print()
print("Cấu trúc cột:")
for i, h in enumerate(HEADERS, 1):
    print(f"  {get_column_letter(i)}: {h}")
print()
print("Loại câu hỏi (dropdown):")
for opt in TYPE_OPTIONS:
    print(f"  - {opt}")
