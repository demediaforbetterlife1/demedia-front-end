// Service Worker for Push Notifications
const CACHE_NAME = 'demedia-cache-v1';
const urlsToCache = [
  '/',
  '/home',
  '/sign-in',
  '/sign-up',
  '/favicon.ico',
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

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
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
