// Smart Cache Buster - NO AUTO-RELOAD
// Only clears caches and shows update notification when new version is detected
(function() {
  'use strict';
  
  console.log('🧹 Cache Buster: Starting smart cache management...');
  
  // 1. Clear browser caches silently (no reload)
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        caches.delete(name);
        console.log('🗑️ Deleted cache:', name);
      });
    });
  }
  
  // 2. Smart version check - only notify, never auto-reload
  fetch('/version.json?v=' + Date.now() + '&cb=' + Math.random(), {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache'
    }
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(versionData) {
    const APP_VERSION = versionData.buildId || Date.now().toString();
    const STORED_VERSION = localStorage.getItem('app_version');
    
    if (STORED_VERSION && STORED_VERSION !== APP_VERSION) {
      console.log('🔄 NEW VERSION DETECTED');
      console.log('Old version:', STORED_VERSION);
      console.log('New version:', APP_VERSION);
      
      // Store new version but DON'T reload
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.setItem('update_available', 'true');
      localStorage.setItem('new_version', APP_VERSION);
      
      // Dispatch event for update notification component
      window.dispatchEvent(new CustomEvent('app:update-available', {
        detail: {
          oldVersion: STORED_VERSION,
          newVersion: APP_VERSION,
          timestamp: Date.now()
        }
      }));
      
      console.log('✅ Update notification dispatched - user can reload when ready');
    } else if (!STORED_VERSION) {
      // First visit - just store version
      localStorage.setItem('app_version', APP_VERSION);
      console.log('✅ Version stored:', APP_VERSION);
    } else {
      console.log('✅ Version current:', APP_VERSION);
    }
  })
  .catch(function(error) {
    console.log('⚠️ Version check failed:', error);
  });
  
  // 3. Service Worker management - NO auto-reload
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js?v=' + Date.now(), {
      scope: '/',
      updateViaCache: 'none'
    }).then(function(registration) {
      console.log('✅ Service worker registered');
      
      // Check for updates but don't force reload
      registration.update();
      
      // Listen for updates and notify user
      registration.addEventListener('updatefound', function() {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available');
              
              // Notify user about update
              localStorage.setItem('sw_update_available', 'true');
              window.dispatchEvent(new CustomEvent('sw:update-available'));
            }
          });
        }
      });
    }).catch(function(error) {
      console.log('⚠️ Service worker registration failed:', error);
    });
  }
  
  // 4. Handle page visibility - NO auto-reload
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      console.log('🔄 Page restored from bfcache');
      // Just log, don't reload
    }
  });
  
  // 5. Periodic version check (every 5 minutes) - NO auto-reload
  setInterval(function() {
    fetch('/version.json?v=' + Date.now() + '&cb=' + Math.random(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(versionData) {
      const APP_VERSION = versionData.buildId || Date.now().toString();
      const STORED_VERSION = localStorage.getItem('app_version');
      
      if (STORED_VERSION && STORED_VERSION !== APP_VERSION) {
        console.log('🔄 New version detected during periodic check');
        localStorage.setItem('update_available', 'true');
        localStorage.setItem('new_version', APP_VERSION);
        
        // Dispatch event for update notification
        window.dispatchEvent(new CustomEvent('app:update-available', {
          detail: {
            oldVersion: STORED_VERSION,
            newVersion: APP_VERSION,
            timestamp: Date.now()
          }
        }));
      }
    })
    .catch(function(error) {
      console.log('⚠️ Periodic version check failed:', error);
    });
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  console.log('✅ Smart Cache Buster: Complete! NO AUTO-RELOAD.');
})();
