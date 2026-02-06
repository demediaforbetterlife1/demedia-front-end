// Service Worker for Push Notifications ONLY - NO CACHING
// This service worker handles push notifications but does NOT cache any content
// All content is always fetched fresh from the network

const CACHE_NAME = 'demedia-no-cache-v1';

// Install event - Skip caching entirely
self.addEventListener('install', (event) => {
  console.log('Service Worker installed - NO CACHING MODE');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - Clear all caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated - Clearing all caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - ALWAYS fetch from network, NEVER use cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).catch((error) => {
      console.error('Fetch failed:', error);
      // Return a basic error response instead of cached content
      return new Response('Network error occurred', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});

// Push event
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'DeMedia', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/assets/images/head.png',
    badge: data.badge || '/assets/images/head.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'DeMedia', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  const data = event.notification.data || {};
  
  if (data.action === 'navigate' && data.url) {
    event.waitUntil(
      clients.openWindow(data.url)
    );
  } else if (data.action === 'open_modal') {
    // Send message to all clients to open modal
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'OPEN_MODAL',
            data: data
          });
        });
      })
    );
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Background sync triggered')
    );
  }
});

// Message event
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle cache clear requests
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('All caches cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
