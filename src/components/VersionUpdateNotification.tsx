'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

/**
 * Component that monitors for version updates and notifies users
 * Shows a button to reload when a new version is available
 * NO AUTO-RELOAD - user must click to update
 * ONLY shows when there's actually a new version
 */
export function VersionUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    oldVersion: string;
    newVersion: string;
  } | null>(null);

  useEffect(() => {
    // Clear any stale update flags on mount
    const checkIfUpdateIsStillValid = async () => {
      try {
        const updateAvailable = localStorage.getItem('update_available');
        if (updateAvailable === 'true') {
          // Verify the update is still valid
          const response = await fetch(`/version.json?v=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });

          const versionData = await response.json();
          const serverVersion = versionData.buildId;
          const storedVersion = localStorage.getItem('app_version');

          // If versions match, clear the update flag
          if (serverVersion === storedVersion) {
            console.log('✅ Versions match - clearing stale update flag');
            localStorage.removeItem('update_available');
            localStorage.removeItem('new_version');
            return;
          }

          // If they don't match, show the notification
          console.log('🔄 Update still valid - showing notification');
          setUpdateInfo({
            oldVersion: storedVersion || 'unknown',
            newVersion: serverVersion
          });
          setShowNotification(true);
        }
      } catch (error) {
        console.error('Error checking update validity:', error);
        // Clear flags on error
        localStorage.removeItem('update_available');
        localStorage.removeItem('new_version');
      }
    };

    checkIfUpdateIsStillValid();

    // Listen for update available events
    const handleUpdateAvailable = (event: CustomEvent) => {
      console.log('🔔 Update notification received:', event.detail);
      
      // Verify this is a real update
      const { oldVersion, newVersion } = event.detail;
      if (oldVersion && newVersion && oldVersion !== newVersion) {
        setUpdateInfo({
          oldVersion: oldVersion,
          newVersion: newVersion
        });
        setShowNotification(true);
      } else {
        console.log('⚠️ Invalid update event - versions are the same');
      }
    };

    window.addEventListener('app:update-available', handleUpdateAvailable as EventListener);
    window.addEventListener('sw:update-available', handleUpdateAvailable as EventListener);

    return () => {
      window.removeEventListener('app:update-available', handleUpdateAvailable as EventListener);
      window.removeEventListener('sw:update-available', handleUpdateAvailable as EventListener);
    };
  }, []);

  const handleUpdate = () => {
    console.log('🔄 User initiated update - reloading...');
    
    // Clear update flags
    localStorage.removeItem('update_available');
    localStorage.removeItem('sw_update_available');
    
    // Update version
    if (updateInfo?.newVersion) {
      localStorage.setItem('app_version', updateInfo.newVersion);
    }
    
    // Reload the page
    window.location.reload();
  };

  const handleDismiss = () => {
    console.log('❌ User dismissed update notification');
    setShowNotification(false);
    
    // Clear the update flags so it doesn't show again
    localStorage.removeItem('update_available');
    localStorage.removeItem('new_version');
  };

  if (!showNotification || !updateInfo) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-4 right-4 z-[9999] max-w-sm"
      >
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1">🎉 New Update Available!</h3>
              <p className="text-sm opacity-90 mb-3">
                A new version of DeMedia is ready. Click update to get the latest features and improvements.
              </p>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4" />
                  Update Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200"
                  title="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Version info */}
              <p className="text-xs opacity-70 mt-2">
                Version: {updateInfo.oldVersion.substring(0, 12)}... → {updateInfo.newVersion.substring(0, 12)}...
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
