// Aggressive Cache Buster - Runs on every page load
(function() {
  'use strict';
  
  console.log('🧹 Cache Buster: Starting cache management...');
  
  // 1. Clear all browser caches (only on first load or version change)
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        caches.delete(name);
        console.log('🗑️ Deleted cache:', name);
      });
    });
  }
  
  // 2. Check version from version.json instead of Date.now()
  fetch('/version.json?v=' + Date.now(), {
    cache: 'no-store'
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(versionData) {
    const APP_VERSION = versionData.buildId || '1.0.1';
    const STORED_VERSION = localStorage.getItem('app_version');
    
    if (STORED_VERSION !== APP_VERSION) {
      console.log('🔄 New version detected, clearing storage...');
      console.log('Old version:', STORED_VERSION);
      console.log('New version:', APP_VERSION);
      
      // Clear all localStorage except auth tokens
      const authToken = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      localStorage.clear();
      
      // Restore auth
      if (authToken) localStorage.setItem('token', authToken);
      if (userId) localStorage.setItem('userId', userId);
      
      // Set new version
      localStorage.setItem('app_version', APP_VERSION);
      
      console.log('✅ Storage cleared, new version:', APP_VERSION);
    } else {
      console.log('✅ Version unchanged:', APP_VERSION);
    }
  })
  .catch(function(error) {
    console.log('⚠️ Could not check version:', error);
  });
  
  // 3. Service worker management (only register, don't constantly unregister)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    }).then(function(registration) {
      console.log('✅ Service worker registered');
      
      // Force update check
      registration.update();
      
      // Listen for updates
      registration.addEventListener('updatefound', function() {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available');
              // Don't auto-reload, let user decide
            }
          });
        }
      });
    }).catch(function(error) {
      console.log('⚠️ Service worker registration failed:', error);
    });
  }
  
  // 4. Prevent browser back/forward cache
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      console.log('🔄 Page restored from bfcache');
      // Don't auto-reload, just log
    }
  });
  
  console.log('✅ Cache Buster: Complete!');
})();
