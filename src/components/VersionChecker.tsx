'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

// Generate a build ID at build time
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || Date.now().toString();

export default function VersionChecker() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Check for updates every 3 minutes
    const checkForUpdates = async () => {
      try {
        // Fetch version info with cache-busting
        const response = await fetch(`/api/version?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const serverBuildId = data.buildId;

          // Compare build IDs
          if (serverBuildId && serverBuildId !== BUILD_ID) {
            console.log('🔄 New version detected!');
            console.log('Server Build ID:', serverBuildId);
            console.log('Current Build ID:', BUILD_ID);
            setShowUpdatePrompt(true);
          }
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // Check immediately on mount
    checkForUpdates();

    // Then check every 3 minutes
    const interval = setInterval(checkForUpdates, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      console.log('🧹 Clearing all caches...');

      // Clear all browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('Found caches:', cacheNames);
        await Promise.all(cacheNames.map(name => {
          console.log('Deleting cache:', name);
          return caches.delete(name);
        }));
      }

      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('Found service workers:', registrations.length);
        for (const registration of registrations) {
          console.log('Unregistering service worker');
          await registration.unregister();
        }
      }

      console.log('✅ Caches cleared, reloading...');

      // Force hard reload from server
      window.location.href = window.location.href + '?v=' + Date.now();
    } catch (error) {
      console.error('Error during update:', error);
      // Fallback to simple reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    // Show again in 10 minutes
    setTimeout(() => setShowUpdatePrompt(true), 10 * 60 * 1000);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-slow">
      <div className="relative">
        {/* Neon glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
        
        {/* Main card */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl p-4 max-w-sm mx-4 border-2 border-white/20">
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-1 shadow-lg border border-gray-600 transition-all"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {isUpdating ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <RefreshCw className="w-6 h-6 animate-pulse" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">New Version Available!</h3>
              <p className="text-xs text-white/90">Update now for the latest features</p>
            </div>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
