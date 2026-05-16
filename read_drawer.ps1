$f = 'E:\IT_Project\01. ms Giang English\english-ms-giang\src\pages\AdminCourseDetail\components\CreateAssignmentDrawer.jsx'
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)
Write-Host "=== Lines 800-850 (step render) ==="
for ($i = 799; $i -le 860; $i++) {
    Write-Host (($i+1).ToString().PadLeft(4) + ': ' + $lines[$i])
}
