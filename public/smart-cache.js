// Smart Cache Management - Facebook-style
// Preserves user data while ensuring fresh content
(function() {
  'use strict';
  
  console.log('🎯 Smart Cache: Initializing...');
  
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
      
      // IMPORTANT: Only clear cache, NOT user data
      // Clear service worker caches
      if ('caches' in window) {
        caches.keys().then(function(names) {
          names.forEach(function(name) {
            caches.delete(name);
          });
        });
      }
      
      // Update version WITHOUT clearing localStorage
      localStorage.setItem('app_version', SERVER_VERSION);
      
      console.log('✅ Updated to new version, user data preserved');
      console.log('📦 Reloading to apply updates...');
      
      // Reload once to get new version
      setTimeout(function() {
        window.location.reload();
      }, 500);
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
      }, 300000); // Check every 5 minutes instead of 1 minute
      
    }).catch(function(error) {
      console.log('⚠️ Service worker registration failed:', error);
    });
  }
  
  console.log('✅ Smart Cache: Ready!');
})();
