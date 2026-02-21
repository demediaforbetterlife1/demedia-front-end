'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/utils/pwa';

export default function PWAInitializer() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Log PWA status
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Running as installed PWA');
    }

    // Handle app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      // Track installation analytics here if needed
    });

    // Prevent iOS bounce effect
    document.body.addEventListener('touchmove', (e) => {
      if ((e.target as HTMLElement).closest('.scrollable')) {
        return;
      }
      e.preventDefault();
    }, { passive: false });

  }, []);

  return null;
}
