/**
 * Test Script for Photo Display Fix
 * 
 * Run this in the browser console to verify photo storage and retrieval
 */

console.log('🧪 Testing Photo Storage System...\n');

// Test 1: Check localStorage availability
console.log('Test 1: localStorage Availability');
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('✅ localStorage is available\n');
} catch (e) {
  console.error('❌ localStorage is NOT available:', e, '\n');
}

// Test 2: List all stored photos
console.log('Test 2: Stored Photos');
const photoKeys = Object.keys(localStorage).filter(k => k.startsWith('demedia_photo_'));
console.log(`Found ${photoKeys.length} photos in localStorage:`);
photoKeys.forEach((key, index) => {
  const value = localStorage.getItem(key);
  const size = value ? value.length : 0;
  const sizeKB = (size / 1024).toFixed(2);
  const photoId = key.replace('demedia_photo_', '');
  console.log(`  ${index + 1}. ${photoId} - ${sizeKB} KB`);
});
console.log('');

// Test 3: Check storage usage
console.log('Test 3: Storage Usage');
let totalSize = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    totalSize += localStorage.getItem(key)?.length || 0;
  }
}
const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
console.log(`Total localStorage usage: ${totalSizeMB} MB`);
console.log(`Estimated available: ~${(5 - parseFloat(totalSizeMB)).toFixed(2)} MB (typical limit is 5-10MB)\n`);

// Test 4: Validate photo data
console.log('Test 4: Photo Data Validation');
if (photoKeys.length > 0) {
  const firstKey = photoKeys[0];
  const photoData = localStorage.getItem(firstKey);
  if (photoData) {
    const isValidBase64 = photoData.startsWith('data:image/');
    console.log(`Sample photo (${firstKey}):`);
    console.log(`  - Is valid Base64: ${isValidBase64 ? '✅' : '❌'}`);
    console.log(`  - Format: ${photoData.substring(0, 30)}...`);
    console.log(`  - Length: ${photoData.length} characters`);
  }
} else {
  console.log('⚠️ No photos found to validate');
}
console.log('');

// Test 5: Check if blob URLs work
console.log('Test 5: Blob URL Support');
try {
  const testBlob = new Blob(['test'], { type: 'text/plain' });
  const blobUrl = URL.createObjectURL(testBlob);
  console.log('✅ Blob URLs are supported');
  console.log(`  Sample blob URL: ${blobUrl}`);
  URL.revokeObjectURL(blobUrl);
} catch (e) {
  console.error('❌ Blob URLs are NOT supported:', e);
}
console.log('');

// Test 6: Simulate photo retrieval
console.log('Test 6: Photo Retrieval Simulation');
if (photoKeys.length > 0) {
  const testKey = photoKeys[0];
  const photoId = testKey.replace('demedia_photo_', '');
  const photoData = localStorage.getItem(testKey);
  
  console.log(`Simulating retrieval of photo: ${photoId}`);
  console.log(`  1. URL format: local-storage://${photoId}`);
  console.log(`  2. localStorage key: ${testKey}`);
  console.log(`  3. Data retrieved: ${photoData ? '✅ Yes' : '❌ No'}`);
  console.log(`  4. Data format: ${photoData?.startsWith('data:image/') ? '✅ Valid Base64' : '❌ Invalid'}`);
} else {
  console.log('⚠️ No photos to test retrieval');
}
console.log('');

// Summary
console.log('📊 Summary:');
console.log(`  - Photos stored: ${photoKeys.length}`);
console.log(`  - Total size: ${totalSizeMB} MB`);
console.log(`  - localStorage: ${photoKeys.length > 0 ? '✅ Working' : '⚠️ Empty'}`);
console.log('\n✅ Test complete!');

// Helper function to clear all photos (use with caution!)
window.clearAllPhotos = function() {
  const count = photoKeys.length;
  photoKeys.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ Cleared ${count} photos from localStorage`);
};

console.log('\n💡 Tip: Run clearAllPhotos() to remove all stored photos');
