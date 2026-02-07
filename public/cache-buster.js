// Smart Cache Buster - DISABLED
// Update checking completely disabled to prevent false positives
(function() {
  'use strict';
  
  console.log('🧹 Cache Buster: DISABLED - No version checking');
  
  // Clear any stale update flags
  localStorage.removeItem('update_available');
  localStorage.removeItem('new_version');
  localStorage.removeItem('sw_update_available');
  
  console.log('✅ Update flags cleared');
})();
