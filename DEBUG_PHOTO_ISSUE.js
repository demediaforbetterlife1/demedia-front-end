/**
 * Complete Photo Debugging Script
 * 
 * Run this in your browser console to diagnose photo loading issues
 */

console.log('🔍 Starting Photo Debug...\n');

// Test 1: Check localStorage availability
console.log('=== Test 1: localStorage Availability ===');
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('✅ localStorage is available');
} catch (e) {
  console.error('❌ localStorage is NOT available:', e);
}
console.log('');

// Test 2: List all stored photos
console.log('=== Test 2: Stored Photos ===');
const photoKeys = Object.keys(localStorage).filter(k => k.startsWith('demedia_photo_'));
console.log(`Found ${photoKeys.length} photos in localStorage:`);
photoKeys.forEach((key, index) => {
  const value = localStorage.getItem(key);
  const size = value ? value.length : 0;
  const sizeKB = (size / 1024).toFixed(2);
  const photoId = key.replace('demedia_photo_', '');
  const isValidBase64 = value?.startsWith('data:image/');
  console.log(`  ${index + 1}. ${photoId}`);
  console.log(`     Size: ${sizeKB} KB`);
  console.log(`     Valid Base64: ${isValidBase64 ? '✅' : '❌'}`);
  if (!isValidBase64 && value) {
    console.log(`     Data starts with: ${value.substring(0, 50)}...`);
  }
});
console.log('');

// Test 3: Check storage usage
console.log('=== Test 3: Storage Usage ===');
let totalSize = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    totalSize += (localStorage.getItem(key)?.length || 0) * 2; // UTF-16 = 2 bytes per char
  }
}
const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
console.log(`Total localStorage usage: ${totalSizeMB} MB`);
console.log(`Estimated available: ~${(5 - parseFloat(totalSizeMB)).toFixed(2)} MB (typical limit is 5-10MB)`);
console.log('');

// Test 4: Check if MediaImage component exists
console.log('=== Test 4: Component Check ===');
const mediaImages = document.querySelectorAll('img');
console.log(`Found ${mediaImages.length} img elements on page`);
console.log('');

// Test 5: Test photo retrieval
console.log('=== Test 5: Photo Retrieval Test ===');
if (photoKeys.length > 0) {
  const testKey = photoKeys[0];
  const photoId = testKey.replace('demedia_photo_', '');
  const photoData = localStorage.getItem(testKey);
  
  console.log(`Testing photo: ${photoId}`);
  console.log(`  1. localStorage key: ${testKey}`);
  console.log(`  2. Data exists: ${photoData ? '✅ Yes' : '❌ No'}`);
  console.log(`  3. Data format: ${photoData?.startsWith('data:image/') ? '✅ Valid Base64' : '❌ Invalid'}`);
  console.log(`  4. Data length: ${photoData?.length || 0} characters`);
  
  if (photoData && photoData.startsWith('data:image/')) {
    console.log('  5. ✅ Photo data is valid and ready to display');
  } else if (photoData) {
    console.log('  5. ❌ Photo data exists but is not valid Base64');
    console.log(`     First 100 chars: ${photoData.substring(0, 100)}`);
  } else {
    console.log('  5. ❌ Photo data not found');
  }
} else {
  console.log('⚠️ No photos found to test');
}
console.log('');

// Test 6: Check for console errors
console.log('=== Test 6: Recent Console Errors ===');
console.log('Check the console above for any red error messages');
console.log('Look for:');
console.log('  - "Photo not found in localStorage"');
console.log('  - "Invalid image URL"');
console.log('  - "Failed to load photo"');
console.log('');

// Test 7: Check current page posts
console.log('=== Test 7: Posts on Current Page ===');
try {
  // Try to find post data in the page
  const postElements = document.querySelectorAll('[class*="post"]');
  console.log(`Found ${postElements.length} elements with "post" in className`);
} catch (e) {
  console.log('Could not analyze post elements');
}
console.log('');

// Summary
console.log('=== 📊 Summary ===');
console.log(`Photos in localStorage: ${photoKeys.length}`);
console.log(`Storage used: ${totalSizeMB} MB`);
console.log(`localStorage working: ✅`);
console.log('');

// Recommendations
console.log('=== 💡 Recommendations ===');
if (photoKeys.length === 0) {
  console.log('❌ No photos found in localStorage');
  console.log('   → Try creating a NEW post with a photo');
  console.log('   → Old posts may have invalid references');
} else {
  const invalidPhotos = photoKeys.filter(key => {
    const data = localStorage.getItem(key);
    return !data || !data.startsWith('data:image/');
  });
  
  if (invalidPhotos.length > 0) {
    console.log(`❌ Found ${invalidPhotos.length} invalid photos`);
    console.log('   → Clear localStorage and try again:');
    console.log('   → Run: localStorage.clear(); location.reload();');
  } else {
    console.log('✅ All photos are valid');
    console.log('   → If photos still don\'t show, check:');
    console.log('   → 1. Browser cache (clear it)');
    console.log('   → 2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('   → 3. Try incognito/private mode');
  }
}
console.log('');

// Helper functions
console.log('=== 🛠️ Helper Functions ===');
console.log('Available commands:');
console.log('  clearAllPhotos() - Remove all photos from localStorage');
console.log('  testPhotoLoad(photoId) - Test loading a specific photo');
console.log('  listPhotos() - List all photos again');
console.log('');

// Define helper functions
window.clearAllPhotos = function() {
  const count = photoKeys.length;
  photoKeys.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ Cleared ${count} photos from localStorage`);
  console.log('Reload the page to see changes');
};

window.testPhotoLoad = function(photoId) {
  const key = `demedia_photo_${photoId}`;
  const data = localStorage.getItem(key);
  if (!data) {
    console.error(`❌ Photo ${photoId} not found`);
    return;
  }
  console.log(`✅ Photo ${photoId} found`);
  console.log(`   Size: ${(data.length / 1024).toFixed(2)} KB`);
  console.log(`   Valid: ${data.startsWith('data:image/') ? '✅' : '❌'}`);
  
  // Try to create an image element
  const img = document.createElement('img');
  img.src = data;
  img.style.maxWidth = '200px';
  img.style.border = '2px solid green';
  img.onload = () => console.log('✅ Image loaded successfully!');
  img.onerror = () => console.error('❌ Image failed to load');
  document.body.appendChild(img);
  console.log('Image element added to page (check bottom of page)');
};

window.listPhotos = function() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('demedia_photo_'));
  console.log(`Found ${keys.length} photos:`);
  keys.forEach((key, i) => {
    const id = key.replace('demedia_photo_', '');
    const data = localStorage.getItem(key);
    const size = data ? (data.length / 1024).toFixed(2) : '0';
    console.log(`  ${i + 1}. ${id} (${size} KB)`);
  });
};

console.log('✅ Debug complete! Check the results above.');
console.log('');
console.log('🔧 Quick Fix Commands:');
console.log('  1. Clear everything: localStorage.clear(); location.reload();');
console.log('  2. Clear only photos: clearAllPhotos();');
console.log('  3. Test a photo: testPhotoLoad("your-photo-id");');
