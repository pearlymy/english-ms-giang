filepath = r'src\pages\AdminUserManagement\AdminUserManagement.jsx'
with open(filepath, 'r', encoding='utf-8', newline='') as f:
    content = f.read()

# Detect line ending
has_crlf = '\r\n' in content
print(f'Line endings: {"CRLF" if has_crlf else "LF"}')

# Find the exact block
start = content.find('const ConfirmDeleteClassModal')
end_marker = ');\r\n' if has_crlf else ');\n'
end_idx = content.find(end_marker, start)
print(f'Block from {start} to {end_idx + len(end_marker)}')

old_block = content[start:end_idx + len(end_marker)]
print('--- OLD BLOCK ---')
print(old_block[:200])

new_block = '''const ConfirmDeleteClassModal = ({ open, cls, studentCount, onConfirm, onClose }) => {
  const hasStudents = studentCount > 0;
  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title="Xóa lớp học"
      description={`Lớp "${cls?.name}" · Mã: ${cls?.code}`}
      primaryAction={{
        label: hasStudents ? 'Không thể xóa' : 'Xóa lớp',
        danger: true,
        onClick: hasStudents ? undefined : onConfirm,
        disabled: hasStudents,
      }}
      secondaryAction={{ label: hasStudents ? 'Đóng' : 'Hủy' }}
    >
      {hasStudents ? (
        <div className={styles.deleteWarningBlock}>
          <div className={styles.deleteWarningIcon}>
            <AlertCircle size={22} />
          </div>
          <div className={styles.deleteWarningBody}>
            <p className={styles.deleteWarningTitle}>
              Lớp này đang có <strong>{studentCount} học viên</strong> — không thể xóa ngay.
            </p>
            <p className={styles.deleteWarningDesc}>
              Vui lòng <strong>chuyển toàn bộ học viên</strong> sang lớp khác trước,
              sau đó quay lại xóa lớp khi lớp đã trống.
            </p>
            <p className={styles.deleteWarningHint}>
              💡 Dùng nút <strong>Chuyển lớp</strong> ở cột thao tác để chuyển nhanh.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.deleteWarning}>
          <Trash2 size={16} />
          <span>
            Lớp này không còn học viên. Xác nhận xóa?{' '}
            Thao tác <strong>không thể hoàn tác</strong>.
          </span>
        </div>
      )}
    </Modal>
  );
};
'''

if has_crlf:
    new_block = new_block.replace('\n', '\r\n')

new_content = content[:start] + new_block + content[end_idx + len(end_marker):]

with open(filepath, 'w', encoding='utf-8', newline='') as f:
    f.write(new_content)

print('SUCCESS: File written')
