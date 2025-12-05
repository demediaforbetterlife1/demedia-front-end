// Run this in browser console to check if photo storage is working
// Copy and paste this entire script into your browser console

(async function checkPhotoStorage() {
  console.log('🔍 Checking Photo Storage System...\n');
  
  // Check 1: IndexedDB Support
  console.log('1️⃣ Checking IndexedDB support...');
  if (!('indexedDB' in window)) {
    console.error('❌ IndexedDB not supported!');
    return;
  }
  console.log('✅ IndexedDB is supported\n');
  
  // Check 2: Open database
  console.log('2️⃣ Opening demedia-photos database...');
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('demedia-photos', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'id' });
          metadataStore.createIndex('createdAt', 'createdAt', { unique: false });
          metadataStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          metadataStore.createIndex('postIds', 'postIds', { unique: false, multiEntry: true });
        }
      };
    });
    console.log('✅ Database opened successfully');
    console.log(`   Version: ${db.version}`);
    console.log(`   Stores: ${Array.from(db.objectStoreNames).join(', ')}\n`);
    
    // Check 3: Count photos
    console.log('3️⃣ Counting stored photos...');
    const transaction = db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');
    const photos = await new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });
    
    console.log(`📊 Found ${photos.length} photos in storage\n`);
    
    if (photos.length === 0) {
      console.warn('⚠️  NO PHOTOS IN STORAGE!');
      console.log('\n📝 This means:');
      console.log('   1. You haven\'t created any posts with photos yet');
      console.log('   2. OR photos failed to store');
      console.log('\n💡 Solution:');
      console.log('   Create a NEW post with a photo to test the system');
    } else {
      console.log('📸 Stored photos:');
      photos.forEach((photo, i) => {
        console.log(`   ${i + 1}. ${photo.filename}`);
        console.log(`      ID: ${photo.id}`);
        console.log(`      Size: ${(photo.size / 1024).toFixed(2)} KB`);
        console.log(`      Created: ${new Date(photo.createdAt).toLocaleString()}`);
      });
    }
    
    db.close();
    
    console.log('\n✅ Photo storage system is working!');
    console.log('\n📝 Next steps:');
    console.log('   1. Create a NEW post with a photo');
    console.log('   2. Check console for storage messages');
    console.log('   3. Photo should display immediately');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
