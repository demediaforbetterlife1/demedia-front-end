$filePath = "e:\BrandNewDemeida\demedia\src\app\(pages)\profile\page.tsx"
$content = Get-Content $filePath -Encoding UTF8 -Raw

# Replace single image in UserPosts
$content = $content -replace `
    '(<div className="relative rounded-2xl overflow-hidden shadow-2xl ring-2 ring-gray-700/50 group/media">\s*)<img\s+src=\{galleryImages\[0\]\}\s+alt="Post content"\s+className="w-full rounded-2xl object-cover max-h-\[500px\] transition-transform duration-500 group-hover/media:scale-105"\s+onError=\{[^}]+\}\s*/>', `
    '$1<div className="relative w-full h-[500px]"><MediaImage src={galleryImages[0]} alt="Post content" className="object-cover" fallbackSrc="/assets/images/default-post.svg" fill priority /></div>'

# Replace multiple images in grid
$content = $content -replace `
    '(<div key=\{index\} className="relative rounded-2xl overflow-hidden shadow-xl ring-2 ring-gray-700/50 group/media">\s*)<img\s+src=\{imageUrl\}\s+alt=\{`Post content \$\{index \+ 1\}`\}\s+className="w-full rounded-2xl object-cover max-h-72 transition-transform duration-500 group-hover/media:scale-105"\s+onError=\{[^}]+\}\s*/>', `
    '$1<div className="relative w-full h-72"><MediaImage src={imageUrl} alt={`Post content ${index + 1}`} className="object-cover transition-transform duration-500 group-hover/media:scale-105" fallbackSrc="/assets/images/default-post.svg" fill /></div>'

Set-Content $filePath -Value $content -Encoding UTF8 -NoNewline
Write-Host "Successfully replaced img tags with MediaImage components"
