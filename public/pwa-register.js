// PWA Service Worker Registration
// This script registers the service worker and handles updates

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              console.log('New service worker available');
              
              // Show update notification
              if (window.showUpdateNotification) {
                window.showUpdateNotification();
              }
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'OPEN_MODAL') {
          // Handle modal opening from push notifications
          console.log('Opening modal from push notification:', event.data.data);
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });

  // Handle app installation
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Store the event for later use
    window.deferredPrompt = deferredPrompt;
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    
    // Track installation
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'PWA Installation'
      });
    }
  });
}

// Utility function to install PWA
window.installPWA = async function() {
  if (window.deferredPrompt) {
    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    window.deferredPrompt = null;
  }
};

// Handle offline/online status
window.addEventListener('online', () => {
  console.log('App is online');
  document.body.classList.remove('offline');
});

window.addEventListener('offline', () => {
  console.log('App is offline');
  document.body.classList.add('offline');
});

// Add offline styles
const offlineStyles = `
  .offline {
    filter: grayscale(0.5);
  }
  
  .offline::before {
    content: "You're offline";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff6b6b;
    color: white;
    text-align: center;
    padding: 8px;
    z-index: 9999;
    font-size: 14px;
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = offlineStyles;
document.head.appendChild(styleSheet);