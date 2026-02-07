// Service Worker for PWA with Push Notifications - NO CONTENT CACHING
// This service worker handles PWA features and push notifications but does NOT cache any content
// All content is always fetched fresh from the network

const CACHE_NAME = 'demedia-pwa-v1';
const STATIC_CACHE_NAME = 'demedia-static-v1';

// Install event - Cache only essential PWA assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installed - PWA Mode');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      // Only cache essential PWA assets
      return cache.addAll([
        '/manifest.json',
        '/assets/images/head.png',
        '/pwa-register.js'
      ]).catch((error) => {
        console.log('Failed to cache some assets:', error);
        // Don't fail installation if caching fails
      });
    }).then(() => {
      // Skip waiting to activate immediately
      self.skipWaiting();
    })
  );
});

// Activate event - Clean up old caches but keep static assets
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated - PWA Mode');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Keep static cache, delete everything else
          if (cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - ALWAYS fetch from network for content, use cache only for PWA assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle PWA static assets from cache
  if (url.pathname === '/manifest.json' || 
      url.pathname.includes('/assets/images/head.png') ||
      url.pathname === '/pwa-register.js') {
    
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        // Fallback to network if not in cache
        return fetch(event.request);
      })
    );
    return;
  }
  
  // For all other requests, ALWAYS fetch from network
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
      
      // Return offline page for navigation requests
      if (event.request.mode === 'navigate') {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>DeMEDIA - Offline</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: #000; 
                  color: #fff; 
                }
                .offline-icon { font-size: 64px; margin-bottom: 20px; }
                h1 { color: #ff6b6b; }
                button { 
                  background: #007bff; 
                  color: white; 
                  border: none; 
                  padding: 12px 24px; 
                  border-radius: 6px; 
                  cursor: pointer; 
                  margin-top: 20px;
                }
                button:hover { background: #0056b3; }
              </style>
            </head>
            <body>
              <div class="offline-icon">📱</div>
              <h1>You're Offline</h1>
              <p>DeMEDIA needs an internet connection to work.</p>
              <p>Please check your connection and try again.</p>
              <button onclick="window.location.reload()">Try Again</button>
            </body>
          </html>
        `, {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      // Return basic error response for other requests
      return new Response('Network error occurred', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});

// Push event - Enhanced for PWA
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'DeMEDIA', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/assets/images/head.png',
    badge: data.badge || '/assets/images/head.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'open',
        title: 'Open App',
        icon: '/assets/images/head.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/images/head.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'DeMEDIA', options)
  );
});

// Notification click event - Enhanced for PWA
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  const data = event.notification.data || {};
  
  if (event.action === 'close') {
    return;
  }
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if no existing window found
        const urlToOpen = data.url || '/';
        return clients.openWindow(urlToOpen);
      })
    );
  }
  
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
  }
});

// Background sync - For offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Processing background sync')
    );
  }
});

// Message event - Enhanced for PWA
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle cache clear requests
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter(name => name !== STATIC_CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('Content caches cleared, PWA assets preserved');
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
  
  // Handle update check
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    event.waitUntil(
      self.registration.update().then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ updated: true });
        }
      })
    );
  }
});

// Handle app shortcuts
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'home') {
    event.waitUntil(clients.openWindow('/home'));
  } else if (event.action === 'messages') {
    event.waitUntil(clients.openWindow('/messeging'));
  } else if (event.action === 'profile') {
    event.waitUntil(clients.openWindow('/profile'));
  }
});
