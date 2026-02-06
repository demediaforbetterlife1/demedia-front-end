// Aggressive Cache Buster - Runs on every page load
(function() {
  'use strict';
  
  console.log('🧹 Cache Buster: Starting aggressive cache clearing...');
  
  // 1. Clear all browser caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        caches.delete(name);
        console.log('🗑️ Deleted cache:', name);
      });
    });
  }
  
  // 2. Clear localStorage version tracking
  const APP_VERSION = Date.now().toString();
  const STORED_VERSION = localStorage.getItem('app_version');
  
  if (STORED_VERSION !== APP_VERSION) {
    console.log('🔄 New version detected, clearing storage...');
    
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
  }
  
  // 3. Unregister old service workers and register new one
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      registrations.forEach(function(registration) {
        registration.unregister().then(function() {
          console.log('🔌 Unregistered old service worker');
        });
      });
      
      // Register fresh service worker
      setTimeout(function() {
        navigator.serviceWorker.register('/sw.js?v=' + Date.now(), {
          scope: '/',
          updateViaCache: 'none'
        }).then(function(registration) {
          console.log('✅ Registered fresh service worker');
          
          // Force update check
          registration.update();
          
          // Listen for updates
          registration.addEventListener('updatefound', function() {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New service worker available, reloading...');
                window.location.reload();
              }
            });
          });
        }).catch(function(error) {
          console.log('⚠️ Service worker registration failed:', error);
        });
      }, 100);
    });
  }
  
  // 4. Add cache-busting query params to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string') {
      const separator = url.includes('?') ? '&' : '?';
      url = url + separator + '_cb=' + Date.now();
    }
    return originalFetch(url, options);
  };
  
  // 5. Prevent browser back/forward cache
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      console.log('🔄 Page restored from cache, reloading...');
      window.location.reload();
    }
  });
  
  // 6. Add meta tags to prevent caching
  const metaTags = [
    { httpEquiv: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
    { httpEquiv: 'Pragma', content: 'no-cache' },
    { httpEquiv: 'Expires', content: '0' }
  ];
  
  metaTags.forEach(function(tag) {
    const meta = document.createElement('meta');
    if (tag.httpEquiv) meta.httpEquiv = tag.httpEquiv;
    if (tag.name) meta.name = tag.name;
    meta.content = tag.content;
    document.head.appendChild(meta);
  });
  
  console.log('✅ Cache Buster: Complete! All caches cleared.');
})();
