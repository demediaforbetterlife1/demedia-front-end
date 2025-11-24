$filePath = "e:\BrandNewDemeida\demedia\src\app\(pages)\profile\page.tsx"
$lines = Get-Content $filePath -Encoding UTF8

$inUserPosts = $false
$modified = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Track if we're in the UserPosts section (starts around line 1943, ends around line 2400)
    if ($line -match 'const UserPosts = ') {
        $inUserPosts = $true
    }
    if ($inUserPosts -and $line -match '^\s*\}\s*;?\s*$' -and $i -gt 2300) {
        $inUserPosts = $false
    }
    
    # Only replace img tags in UserPosts section
    if ($inUserPosts) {
        # Replace opening img tag for single image
        if ($line -match '^\s*<img\s*$') {
            $nextLine = $lines[$i + 1]
            if ($nextLine -match 'src=\{galleryImages\[0\]\}') {
                # This is the single image case
                $lines[$i] = $line -replace '<img', '<div className="relative w-full h-[500px]"><MediaImage'
                $modified = $true
            }
            elseif ($nextLine -match 'src=\{imageUrl\}') {
                # This is the grid image case
                $lines[$i] = $line -replace '<img', '<div className="relative w-full h-72"><MediaImage'
                $modified = $true
            }
        }
        
        # Replace className line and add fallbackSrc
        if ($line -match 'className="w-full rounded-2xl object-cover') {
            if ($line -match 'max-h-\[500px\]') {
                # Single image
                $lines[$i] = '                                            className="object-cover"'
                $lines[$i + 1] = '                                            fallbackSrc="/assets/images/default-post.svg"'
                $lines[$i + 2] = '                                            fill'
                $lines[$i + 3] = '                                            priority'
                $modified = $true
            }
            elseif ($line -match 'max-h-72') {
                # Grid images
                $lines[$i] = '                                                    className="object-cover transition-transform duration-500 group-hover/media:scale-105"'
                $lines[$i + 1] = '                                                    fallbackSrc="/assets/images/default-post.svg"'
                $lines[$i + 2] = '                                                    fill'
                $modified = $true
            }
        }
        
        # Remove onError handlers and close with /> then add closing div
        if ($line -match 'onError=') {
            # Skip the onError block
            $j = $i
            while ($j -lt $lines.Count -and $lines[$j] -notmatch '/>') {
                $j++
            }
            if ($j -lt $lines.Count) {
                $lines[$j] = $lines[$j] -replace '/>', '/></div>'
                # Remove lines from $i to $j-1
                for ($k = $i; $k -lt $j; $k++) {
                    $lines[$k] = ''
                }
                $modified = $true
            }
        }
    }
}

# Remove empty lines that were created
$lines = $lines | Where-Object { $_ -ne '' }

Set-Content $filePath -Value $lines -Encoding UTF8
Write-Host "Manually replaced img tags with MediaImage - Modified: $modified"
