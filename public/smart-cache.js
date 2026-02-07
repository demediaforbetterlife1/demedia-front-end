// Smart Cache Management - NO AUTO-RELOAD
// Preserves user data and NEVER auto-reloads
(function() {
  'use strict';
  
  console.log('🎯 Smart Cache: Initializing (NO AUTO-RELOAD)...');
  
  // Check version from server (only once per session)
  const sessionChecked = sessionStorage.getItem('version_checked');
  
  if (sessionChecked) {
    console.log('✅ Version already checked this session');
    return;
  }
  
  // Check version from server
  fetch('/version.json?v=' + Date.now(), {
    cache: 'no-store'
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(versionData) {
    const SERVER_VERSION = versionData.buildId || '1.0.1';
    const STORED_VERSION = localStorage.getItem('app_version');
    
    // Mark as checked for this session
    sessionStorage.setItem('version_checked', 'true');
    
    if (!STORED_VERSION) {
      // First time - just set version
      localStorage.setItem('app_version', SERVER_VERSION);
      console.log('✅ Version initialized:', SERVER_VERSION);
      return;
    }
    
    if (STORED_VERSION !== SERVER_VERSION) {
      console.log('🔄 New version detected!');
      console.log('Old:', STORED_VERSION);
      console.log('New:', SERVER_VERSION);
      
      // Clear service worker caches silently
      if ('caches' in window) {
        caches.keys().then(function(names) {
          names.forEach(function(name) {
            caches.delete(name);
          });
        });
      }
      
      // Store update info but DON'T reload
      localStorage.setItem('update_available', 'true');
      localStorage.setItem('new_version', SERVER_VERSION);
      
      // Dispatch event for notification component
      window.dispatchEvent(new CustomEvent('app:update-available', {
        detail: {
          oldVersion: STORED_VERSION,
          newVersion: SERVER_VERSION,
          timestamp: Date.now()
        }
      }));
      
      console.log('✅ Update notification dispatched - NO AUTO-RELOAD');
    } else {
      console.log('✅ Version up to date:', SERVER_VERSION);
    }
  })
  .catch(function(error) {
    console.log('⚠️ Could not check version:', error);
  });
  
  // Service worker for offline support (optional)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    }).then(function(registration) {
      console.log('✅ Service worker registered');
      
      // Check for updates less frequently (every 5 minutes)
      setInterval(function() {
        registration.update();
      }, 300000); // Check every 5 minutes
      
    }).catch(function(error) {
      console.log('⚠️ Service worker registration failed:', error);
    });
  }
  
  console.log('✅ Smart Cache: Ready (NO AUTO-RELOAD)!');
})();
