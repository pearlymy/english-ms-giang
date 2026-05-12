import openpyxl

wb = openpyxl.load_workbook(r'c:\Users\84932\OneDrive\Desktop\Test Web Giang.xlsx', data_only=True)
ws = wb.worksheets[0]

results = {'Failed': [], 'Passed': [], 'Skipped': []}
current_module = ''

for i, row in enumerate(ws.iter_rows(values_only=True)):
    vals = [c for c in row if c is not None and str(c).strip() != '']
    if not vals:
        continue
    row_list = list(row)

    # Detect module header row (col0 is a string like "Quan ly hoc vien")
    if row_list[0] and isinstance(row_list[0], str) and row_list[0] not in ['STT', 'Nen them']:
        current_module = str(row_list[0]).strip()

    # Test case row: col6 has status
    status = row_list[6] if len(row_list) > 6 else None
    test_name = row_list[2] if len(row_list) > 2 else None
    note = row_list[8] if len(row_list) > 8 else None

    if status in ['Failed', 'Passed', 'Skipped'] and test_name:
        results[status].append({
            'module': current_module,
            'test': str(test_name).strip(),
            'note': str(note).strip() if note else ''
        })

print('=== FAILED TESTS ===')
for t in results['Failed']:
    print(f"[{t['module']}] {t['test']}")
    if t['note']:
        print(f"  NOTE: {t['note']}")

print('\n=== SKIPPED TESTS ===')
for t in results['Skipped']:
    print(f"[{t['module']}] {t['test']}")
    if t['note']:
        print(f"  NOTE: {t['note']}")

print(f'\n=== SUMMARY ===')
print(f'Total Passed:  {len(results["Passed"])}')
print(f'Total Failed:  {len(results["Failed"])}')
print(f'Total Skipped: {len(results["Skipped"])}')
