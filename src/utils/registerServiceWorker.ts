export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);

          // Check for updates every minute
          setInterval(() => {
            registration.update();
          }, 60000);

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log('🔄 New Service Worker found, installing...');
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('✅ New Service Worker installed!');
                  
                  // New service worker available - show update prompt
                  const shouldUpdate = confirm(
                    'New version available! Click OK to update now, or Cancel to update later.'
                  );
                  
                  if (shouldUpdate) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Handle controller change (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed, reloading...');
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('📢 Service Worker updated to version:', event.data.version);
        }
      });
    });
  }

  // Request notification permission after delay
  if ('Notification' in window && Notification.permission === 'default') {
    setTimeout(() => {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }, 5000);
  }

  // Register periodic background sync (if supported)
  if ('periodicSync' in navigator.serviceWorker) {
    navigator.serviceWorker.ready.then((registration: any) => {
      registration.periodicSync.register('update-content', {
        minInterval: 24 * 60 * 60 * 1000, // 24 hours
      }).catch((error: any) => {
        console.log('Periodic sync registration failed:', error);
      });
    });
  }
}
