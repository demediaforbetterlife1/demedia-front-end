'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
      
      // Don't show if already dismissed recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed > 7) { // Show again after 7 days
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS install prompt if on iOS and not standalone
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem('pwa-install-dismissed-ios');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed > 7) {
        setShowInstallPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    if (isIOS) {
      localStorage.setItem('pwa-install-dismissed-ios', Date.now().toString());
    } else {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // Don't show if user dismissed and not enough time passed
  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {isIOS ? (
                <Smartphone className="h-6 w-6 text-blue-500" />
              ) : (
                <Monitor className="h-6 w-6 text-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Install DeMEDIA
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isIOS 
                  ? "Tap the share button and select 'Add to Home Screen'"
                  : "Install our app for a better experience"
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {!isIOS && deferredPrompt && (
          <div className="mt-3">
            <Button
              onClick={handleInstallClick}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          </div>
        )}
        
        {isIOS && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <span>1. Tap</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v5.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 8.586V3a1 1 0 011-1z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>at the bottom</span>
            </div>
            <div className="mt-1">2. Select "Add to Home Screen"</div>
          </div>
        )}
      </div>
    </div>
  );
}