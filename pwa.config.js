// PWA Configuration for DeMEDIA
// This file contains PWA-related configurations and utilities

const PWA_CONFIG = {
  // App information
  name: 'DeMEDIA - Social Media Platform',
  shortName: 'DeMEDIA',
  description: 'Powerful social media platform with high-quality UI for better experience. Connect, share, and discover content with friends.',
  
  // Display settings
  display: 'standalone',
  orientation: 'portrait-primary',
  startUrl: '/',
  scope: '/',
  
  // Theme colors
  themeColor: '#000000',
  backgroundColor: '#000000',
  
  // Categories
  categories: ['social', 'entertainment', 'lifestyle'],
  
  // Language and direction
  lang: 'en',
  dir: 'ltr',
  
  // Icon sizes for different platforms
  iconSizes: [
    72, 96, 128, 144, 152, 192, 384, 512
  ],
  
  // Shortcuts for app launcher
  shortcuts: [
    {
      name: 'Home Feed',
      shortName: 'Home',
      description: 'View your personalized home feed',
      url: '/home',
      icon: '/assets/images/head.png'
    },
    {
      name: 'Messages',
      shortName: 'Chat',
      description: 'Check your messages',
      url: '/messeging',
      icon: '/assets/images/head.png'
    },
    {
      name: 'Profile',
      shortName: 'Profile',
      description: 'View your profile',
      url: '/profile',
      icon: '/assets/images/head.png'
    }
  ],
  
  // Features
  features: {
    pushNotifications: true,
    backgroundSync: true,
    offlineSupport: true,
    installPrompt: true,
    updateNotifications: true
  },
  
  // Platform-specific settings
  platforms: {
    ios: {
      statusBarStyle: 'black-translucent',
      webAppCapable: true,
      appleTouchIcon: '/assets/images/head.png'
    },
    android: {
      webAppCapable: true,
      themeColor: '#000000'
    },
    windows: {
      tileColor: '#000000',
      browserConfig: '/browserconfig.xml'
    }
  }
};

// Utility functions for PWA
const PWA_UTILS = {
  // Check if app is installed
  isInstalled: () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  },
  
  // Check if PWA is supported
  isSupported: () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },
  
  // Get install prompt
  getInstallPrompt: () => {
    return window.deferredPrompt;
  },
  
  // Install PWA
  install: async () => {
    const prompt = PWA_UTILS.getInstallPrompt();
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      return outcome === 'accepted';
    }
    return false;
  },
  
  // Register service worker
  registerServiceWorker: async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  },
  
  // Check for updates
  checkForUpdates: async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      return registration.update();
    }
  },
  
  // Clear cache
  clearCache: async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  },
  
  // Get network status
  getNetworkStatus: () => {
    return {
      online: navigator.onLine,
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
    };
  },
  
  // Request notification permission
  requestNotificationPermission: async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },
  
  // Show notification
  showNotification: (title, options = {}) => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: '/assets/images/head.png',
          badge: '/assets/images/head.png',
          ...options
        });
      });
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PWA_CONFIG, PWA_UTILS };
} else if (typeof window !== 'undefined') {
  window.PWA_CONFIG = PWA_CONFIG;
  window.PWA_UTILS = PWA_UTILS;
}