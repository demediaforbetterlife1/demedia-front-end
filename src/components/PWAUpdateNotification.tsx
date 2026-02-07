'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export default function PWAUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker has taken control
        window.location.reload();
      });

      // Check for updates
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                setShowUpdate(true);
              }
            });
          }
        });
      });
    }

    // Global function for showing update notification
    window.showUpdateNotification = () => {
      setShowUpdate(true);
    };

    return () => {
      delete window.showUpdateNotification;
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.waiting) {
          // Tell the waiting service worker to skip waiting
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          // Force update check
          await registration.update();
        }
      }
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-update-dismissed', 'true');
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-blue-500 text-white rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <RefreshCw className={`h-5 w-5 ${isUpdating ? 'animate-spin' : ''}`} />
            <div className="flex-1">
              <h3 className="text-sm font-medium">
                Update Available
              </h3>
              <p className="text-xs opacity-90 mt-1">
                A new version of DeMEDIA is ready to install.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/70 hover:text-white"
            disabled={isUpdating}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 bg-white text-blue-500 hover:bg-gray-100"
            size="sm"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Now'
            )}
          </Button>
          <Button
            onClick={handleDismiss}
            disabled={isUpdating}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            size="sm"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}