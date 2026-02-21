// Service Worker for PWA and Push Notifications
const CACHE_NAME = 'demedia-cache-v2';
const RUNTIME_CACHE = 'demedia-runtime-v2';
const IMAGE_CACHE = 'demedia-images-v2';

const urlsToCache = [
  '/',
  '/home',
  '/sign-in',
  '/sign-up',
  '/offline.html',
  '/manifest.json',
  '/assets/images/logo.png',
  '/assets/images/logo1.png',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    console.log('Opened cache');
    
    // Filter assets before adding and wrap in try/catch
    const okUrls = [];
    for (const url of urlsToCache) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) {
          okUrls.push(url);
        } else {
          console.warn('sw: asset fetch failed (not ok)', url, response.status);
        }
      } catch (e) {
        console.warn('sw: asset fetch failed', url, e);
      }
    }
    
    try {
      if (okUrls.length > 0) {
        await cache.addAll(okUrls);
        console.log('sw: cached', okUrls.length, 'assets');
      } else {
        console.warn('sw: no assets to cache');
      }
    } catch (e) {
      console.warn('sw: cache.addAll partial failure', e);
    }
  })());
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event with network-first strategy for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - Network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          });
        })
    );
    return;
  }

  // Navigation requests - Network first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match('/offline.html') || caches.match('/');
        })
    );
    return;
  }

  // Images - Cache first
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          return (
            response ||
            fetch(request).then((fetchResponse) => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            })
          );
        });
      })
    );
    return;
  }

  // Other requests - Cache first, fallback to network
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((fetchResponse) => {
        // Don't cache if not a success response
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type === 'error') {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return fetchResponse;
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
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
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
});
