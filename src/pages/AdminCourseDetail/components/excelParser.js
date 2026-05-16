/**
 * excelParser.js
 * Parse Excel (.xlsx) file thành danh sách câu hỏi cho CreateAssignmentDrawer.
 *
 * Cấu trúc cột (hàng 1 = header, dữ liệu từ hàng 2):
 *   A: Question No   B: Question Type  C: Question Text
 *   D: Option A      E: Option B       F: Option C    G: Option D
 *   H: Correct Answer   I: Explanation
 *
 * Lưu ý:
 *   - Unit / Skill: hệ thống tự nhận biết từ context (unit đang tạo bài tập)
 *   - Audio File:   giáo viên upload trực tiếp ở Bước 3 với câu Listening
 *   - Transcript:   không cần trong Excel
 *   - Question Type: chọn từ dropdown trong Excel (không nhập tay)
 */
import * as XLSX from 'xlsx';

/* ── Bảng map Question Type (dropdown value → internal type) ── */
const TYPE_MAP = {
  // Dropdown values (chính xác từ Excel data validation)
  'Trắc nghiệm (1 đáp án)':    'multiple_choice',
  'Trắc nghiệm (nhiều đáp án)': 'multiple_response',
  'Đúng / Sai':                 'true_false',
  'Điền vào chỗ trống':         'fill_in',
  'Viết ngắn':                  'short_answer',
  'Nối đôi':                    'matching',
  'Sắp xếp thứ tự':             'ordering',
  'Nghe hiểu':                  'listening',

  // Fallback — giá trị tiếng Anh / viết tắt phổ biến
  'multiple_choice':    'multiple_choice',
  'multiple choice':    'multiple_choice',
  'mc':                 'multiple_choice',
  'mcq':                'multiple_choice',
  'trắc nghiệm':        'multiple_choice',

  'multiple_response':  'multiple_response',
  'multiple response':  'multiple_response',
  'mr':                 'multiple_response',

  'true_false':         'true_false',
  'true/false':         'true_false',
  'tf':                 'true_false',
  'đúng/sai':           'true_false',

  'fill_in':            'fill_in',
  'fill in':            'fill_in',
  'fill in the blank':  'fill_in',
  'gap fill':           'fill_in',
  'điền':               'fill_in',

  'short_answer':       'short_answer',
  'short answer':       'short_answer',
  'writing':            'short_answer',
  'essay':              'short_answer',
  'viết ngắn':          'short_answer',

  'matching':           'matching',
  'match':              'matching',
  'nối đôi':            'matching',
  'nối từ':             'matching',

  'ordering':           'ordering',
  'order':              'ordering',
  'sắp xếp':            'ordering',

  'listening':          'listening',
  'nghe hiểu':          'listening',
  'listen':             'listening',
};

const normalizeType = (raw) => {
  if (!raw) return null;
  return TYPE_MAP[String(raw).trim()] ?? TYPE_MAP[String(raw).trim().toLowerCase()] ?? null;
};

/* Danh sách loại hợp lệ để hiển thị trong error message */
const VALID_TYPES_HINT =
  'Trắc nghiệm (1 đáp án), Trắc nghiệm (nhiều đáp án), Đúng / Sai, Điền vào chỗ trống, Viết ngắn, Nối đôi, Sắp xếp thứ tự, Nghe hiểu';

/* Các loại câu giáo viên chấm thủ công — không yêu cầu Correct Answer */
/* (ordering và multiple_response vẫn cần đáp án để hệ thống tự chấm) */
const TEACHER_GRADED = new Set(['short_answer', 'matching']);

/**
 * Đọc file Excel và trả về { questions, errors, warnings, meta }
 * @param {File} file  — File object từ input[type=file]
 */
export async function parseExcelToQuestions(file) {
  const errors   = [];
  const warnings = [];

  const buffer = await file.arrayBuffer();
  const wb     = XLSX.read(buffer, { type: 'array' });

  const sheetName = wb.SheetNames[0];
  const ws        = wb.Sheets[sheetName];

  // Cột mới: No, Type, Text, A, B, C, D, Answer, Explanation
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: ['no', 'type', 'text', 'optA', 'optB', 'optC', 'optD', 'answer', 'explanation'],
    range:  1, // bỏ qua header row
    defval: '',
  });

  const questions = [];
  let autoId = 1;

  for (let i = 0; i < rows.length; i++) {
    const row    = rows[i];
    const rowNum = i + 2;

    // Bỏ qua dòng hoàn toàn trống
    const allEmpty = Object.values(row).every(v => String(v).trim() === '');
    if (allEmpty) continue;

    // ── Validate Question Text ──
    const text = String(row.text ?? '').trim();
    if (!text) continue; // bỏ qua lặng lẽ

    // ── Validate & map Question Type ──
    const rawType = String(row.type ?? '').trim();
    const qType   = normalizeType(rawType);
    if (!qType) {
      errors.push({
        row: rowNum,
        type: 'invalid_type',
        rawType,
        message: `Dòng ${rowNum}: Loại câu hỏi "${rawType}" không hợp lệ.`,
        fixHint: `Chọn từ dropdown trong cột "Question Type": ${VALID_TYPES_HINT}`,
        rowData: { text, type: rawType },
      });
      continue;
    }

    // ── Build fields ──
    const answer      = String(row.answer      ?? '').trim();
    const optA        = String(row.optA        ?? '').trim();
    const optB        = String(row.optB        ?? '').trim();
    const optC        = String(row.optC        ?? '').trim();
    const optD        = String(row.optD        ?? '').trim();
    const explanation = String(row.explanation ?? '').trim();

    // ── Warning: thiếu đáp án (MCQ, TF, Fill-in, Ordering, Multiple Response) ──
    const REQUIRES_ANSWER = ['multiple_choice', 'true_false', 'fill_in', 'ordering', 'multiple_response'];
    if (!answer && REQUIRES_ANSWER.includes(qType)) {
      warnings.push({
        row: rowNum,
        message: `Dòng ${rowNum} — Câu ${autoId} (${rawType}): Chưa có "Correct Answer". Hãy bổ sung ở Bước 3.`,
      });
    }

    // ── Warning: MCQ thiếu lựa chọn ──
    if (qType === 'multiple_choice') {
      const missing = [
        !optA && 'Option A', !optB && 'Option B',
        !optC && 'Option C', !optD && 'Option D',
      ].filter(Boolean);
      if (missing.length > 0) {
        warnings.push({
          row: rowNum,
          message: `Dòng ${rowNum} — Câu ${autoId}: Thiếu ${missing.join(', ')}.`,
        });
      }
    }

    // ── Build options cho MC, TF, và Listening ──
    let options = undefined;
    if (qType === 'multiple_choice' || qType === 'multiple_response' || qType === 'listening') {
      options = [
        optA ? `A. ${optA}` : '',
        optB ? `B. ${optB}` : '',
        optC ? `C. ${optC}` : '',
        optD ? `D. ${optD}` : '',
      ].filter(Boolean);
    }
    
    if (qType === 'true_false') {
      options = ['Đúng', 'Sai'];
    }

    // ── Parse Matching pairs ──
    // Cú pháp: "happy=vui, sad=buồn" hoặc "A→X, B→Y"
    let pairs = undefined;
    let matchingDetectedAnswer = answer || null;
    if (qType === 'matching' && answer) {
      const rawPairs = answer.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      pairs = rawPairs.map(p => {
        const match = p.match(/^(.+?)\s*[=:→\-]+\s*(.+)$/);
        if (match) return { left: match[1].trim(), right: match[2].trim() };
        return { left: p, right: '' };
      }).filter(p => p.left && p.right);

      if (pairs.length > 0) {
        matchingDetectedAnswer = Object.fromEntries(pairs.map(p => [p.left, p.right]));
      }
    }

    // ── Parse Ordering items ──
    // Cú pháp: "item1, item2, item3" hoặc "1. item1; 2. item2"
    let orderItems = undefined;
    if (qType === 'ordering' && answer) {
      orderItems = answer
        .split(/[,;]+/)
        .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(Boolean);
    }

    // ── Parse Multiple Response answers ──
    // Cú pháp: "A,B" hoặc "A, C, D"
    let multiAnswers = undefined;
    if (qType === 'multiple_response' && answer) {
      multiAnswers = answer
        .split(/[,\s]+/)
        .map(s => s.trim().toUpperCase())
        .filter(s => ['A', 'B', 'C', 'D'].includes(s));
    }

    questions.push({
      id:             autoId++,
      type:           qType,
      content:        text,
      options,
      pairs,
      orderItems,
      optA, optB, optC, optD,
      // detectedAnswer: ordering → array (để isAnswered kiểm tra Array.isArray đúng)
      detectedAnswer: qType === 'matching'
        ? matchingDetectedAnswer
        : qType === 'multiple_response'
          ? (multiAnswers ?? null)
          : qType === 'ordering'
            ? (orderItems && orderItems.length > 0 ? orderItems : null)
            : (answer || null),
      answer,
      answers:        multiAnswers ?? [],  // cho multiple_response
      explanation:    explanation || null,
      audioFile:      null,  // luôn null — upload trực tiếp ở Bước 3
      audioUrl:       null,
      needsAudio:     qType === 'listening',
      rowNum,
    });
  }

  return {
    questions,
    errors,
    warnings,
    meta: {
      sheetName,
      totalDataRows: rows.length,
      parsedCount:   questions.length,
      errorCount:    errors.length,
      warningCount:  warnings.length,
    },
  };
}
