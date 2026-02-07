// Aggressive Cache Buster - Runs on every page load
(function() {
  'use strict';
  
  console.log('🧹 Cache Buster: Starting AGGRESSIVE cache prevention...');
  
  // 1. IMMEDIATELY clear all browser caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        caches.delete(name);
        console.log('🗑️ Deleted cache:', name);
      });
    });
  }
  
  // 2. Clear all storage except auth tokens
  try {
    // Preserve auth tokens
    const authToken = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    // Clear everything else
    const keysToPreserve = ['token', 'userId'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(function(key) {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('🧹 LocalStorage cleaned (preserved auth)');
  } catch (e) {
    console.warn('⚠️ Could not clean localStorage:', e);
  }
  
  // 3. Force version check with aggressive cache busting
  const versionUrl = '/version.json?v=' + Date.now() + '&cb=' + Math.random() + '&nocache=true';
  fetch(versionUrl, {
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
    
    if (STORED_VERSION !== APP_VERSION) {
      console.log('🔄 NEW VERSION DETECTED - Force refresh all content');
      console.log('Old version:', STORED_VERSION);
      console.log('New version:', APP_VERSION);
      
      // Set new version immediately
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.setItem('last_cache_clear', Date.now().toString());
      
      // Force reload all images and content
      const images = document.querySelectorAll('img');
      images.forEach(function(img) {
        if (img.src && !img.src.includes('?')) {
          img.src = img.src + '?v=' + Date.now();
        }
      });
      
      console.log('✅ Version updated, content refreshed');
    } else {
      console.log('✅ Version current:', APP_VERSION);
    }
  })
  .catch(function(error) {
    console.log('⚠️ Version check failed, forcing refresh anyway:', error);
    // Force refresh even if version check fails
    localStorage.setItem('last_cache_clear', Date.now().toString());
  });
  
  // 4. Aggressive Service Worker management
  if ('serviceWorker' in navigator) {
    // First, unregister ALL existing service workers
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      registrations.forEach(function(registration) {
        registration.unregister();
        console.log('🗑️ Unregistered service worker:', registration.scope);
      });
      
      // Then register our no-cache service worker
      navigator.serviceWorker.register('/sw.js?v=' + Date.now(), {
        scope: '/',
        updateViaCache: 'none'
      }).then(function(registration) {
        console.log('✅ No-cache service worker registered');
        
        // Force immediate update check
        registration.update();
        
        // Listen for updates and force activation
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed') {
                console.log('🔄 New service worker installed, taking control');
                newWorker.postMessage({ action: 'skipWaiting' });
              }
            });
          }
        });
      }).catch(function(error) {
        console.log('⚠️ Service worker registration failed:', error);
      });
    });
  }
  
  // 5. Prevent ALL browser caching mechanisms
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      console.log('🔄 Page restored from bfcache - forcing reload');
      window.location.reload(true);
    }
  });
  
  // 6. Override fetch to add cache busting to ALL requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Add cache busting to all requests
    if (typeof url === 'string') {
      const separator = url.includes('?') ? '&' : '?';
      url = url + separator + 'cb=' + Date.now() + '&v=' + Math.random();
    }
    
    // Force no-cache headers
    const newOptions = {
      ...options,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        ...(options?.headers || {})
      }
    };
    
    return originalFetch.call(this, url, newOptions);
  };
  
  // 7. Force refresh of all cached elements
  setTimeout(function() {
    // Refresh all images
    const images = document.querySelectorAll('img');
    images.forEach(function(img) {
      const originalSrc = img.src;
      if (originalSrc && !originalSrc.includes('data:')) {
        const separator = originalSrc.includes('?') ? '&' : '?';
        img.src = originalSrc + separator + 't=' + Date.now();
      }
    });
    
    // Refresh all stylesheets
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(function(link) {
      const href = link.href;
      if (href) {
        const separator = href.includes('?') ? '&' : '?';
        link.href = href + separator + 't=' + Date.now();
      }
    });
    
    console.log('🔄 Refreshed all cached elements');
  }, 100);
  
  console.log('✅ AGGRESSIVE Cache Buster: Complete! NO CACHING ENABLED.');
})();
