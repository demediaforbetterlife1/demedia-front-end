$filePath = "e:\BrandNewDemeida\demedia\src\app\(pages)\profile\page.tsx"
$content = Get-Content $filePath -Encoding UTF8 -Raw

# Fix the malformed video tag closing
$content = $content -replace '(\s+src=\{videoUrl\}\s+)/>\s*</div>', '$1/>'

Set-Content $filePath -Value $content -Encoding UTF8 -NoNewline
Write-Host "Fixed video tag syntax error"
