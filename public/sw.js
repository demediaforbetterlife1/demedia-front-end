// Enhanced Service Worker for PWA with Version Control
const VERSION = '1.0.0';
const CACHE_NAME = `demedia-v${VERSION}-${Date.now()}`;
const RUNTIME_CACHE = `demedia-runtime-v${VERSION}`;
const IMAGE_CACHE = `demedia-images-v${VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/home',
  '/sign-in',
  '/sign-up',
  '/profile',
  '/messeging',
  '/assets/images/logo.png',
  '/assets/images/logo1.png',
  '/images/default-avatar.svg',
  '/images/default-post.svg',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const okUrls = [];
      
      for (const url of PRECACHE_URLS) {
        try {
          const response = await fetch(url, { cache: 'no-store' });
          if (response.ok) {
            okUrls.push(url);
          }
        } catch (e) {
          console.warn('[SW] Failed to fetch:', url);
        }
      }
      
      if (okUrls.length > 0) {
        await cache.addAll(okUrls);
        console.log('[SW] Cached', okUrls.length, 'resources');
      }
      
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', VERSION);
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      console.log('[SW] Found caches:', cacheNames);
      
      // Delete all old caches
      await Promise.all(
        cacheNames
          .filter(name => {
            // Keep only current version caches
            return !name.includes(`v${VERSION}`) && name.startsWith('demedia-');
          })
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
      
      console.log('[SW] Cache cleanup complete');
      
      // Take control of all clients immediately
      await self.clients.claim();
      
      // Notify all clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: VERSION
        });
      });
    })()
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) return;

  // Handle images with cache first strategy
  if (request.destination === 'image') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGE_CACHE);
        const cached = await cache.match(request);
        
        if (cached) return cached;
        
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          // Return default image on error
          return caches.match('/images/default-post.svg');
        }
      })()
    );
    return;
  }

  // Handle API requests with network first
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          return response;
        } catch (error) {
          console.log('[SW] Network request failed, checking cache');
          const cached = await caches.match(request);
          return cached || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch (error) {
          const cached = await caches.match(request);
          if (cached) return cached;
          
          // Return offline page
          const offlineCache = await caches.match('/');
          return offlineCache || new Response('Offline', { 
            status: 503,
            headers: { 'Content-Type': 'text/html' }
          });
        }
      })()
    );
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match(request);
        return cached || new Response('Offline', { status: 503 });
      }
    })()
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

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
    icon: data.icon || '/assets/images/logo.png',
    badge: '/assets/images/logo.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: [200, 100, 200],
    image: data.image,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'DeMedia', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-posts') {
    event.waitUntil(
      // Sync posts when back online
      fetch('/api/posts/sync')
        .then(response => console.log('[SW] Posts synced'))
        .catch(error => console.error('[SW] Sync failed:', error))
    );
  }
});

// Message event
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(names => {
        return Promise.all(names.map(name => caches.delete(name)));
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(
      fetch('/api/posts/latest')
        .then(response => response.json())
        .then(data => {
          console.log('[SW] Content updated in background');
        })
        .catch(error => console.error('[SW] Background update failed:', error))
    );
  }
});

console.log('[SW] Service worker loaded');
