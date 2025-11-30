// Clear all browser caches
(function() {
  'use strict';
  
  console.log('🧹 Starting cache cleanup...');
  
  // Clear Service Worker caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
        console.log('✅ Deleted cache:', name);
      }
    });
  }
  
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.unregister();
        console.log('✅ Unregistered service worker');
      }
    });
  }
  
  // Clear localStorage
  try {
    // Keep auth token but clear everything else
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    localStorage.clear();
    if (token) localStorage.setItem('token', token);
    if (userId) localStorage.setItem('userId', userId);
    console.log('✅ Cleared localStorage (kept auth)');
  } catch (e) {
    console.warn('Could not clear localStorage:', e);
  }
  
  // Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ Cleared sessionStorage');
  } catch (e) {
    console.warn('Could not clear sessionStorage:', e);
  }
  
  // Clear IndexedDB
  if ('indexedDB' in window) {
    try {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
            console.log('✅ Deleted IndexedDB:', db.name);
          }
        });
      });
    } catch (e) {
      console.warn('Could not clear IndexedDB:', e);
    }
  }
  
  console.log('🎉 Cache cleanup complete! Reloading page...');
  
  // Force reload from server
  setTimeout(() => {
    window.location.reload(true);
  }, 1000);
})();
