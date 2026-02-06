'use client';

import { useVersionCheck } from '@/hooks/useVersionCheck';
import { useEffect, useState } from 'react';

/**
 * Component that monitors for version updates and notifies users
 * Automatically reloads the page when a new version is detected
 */
export function VersionUpdateNotification() {
  const { currentVersion, hasUpdate } = useVersionCheck(30000); // Check every 30 seconds
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (hasUpdate) {
      setShowNotification(true);
    }
  }, [hasUpdate]);

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-lg shadow-2xl max-w-sm">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          <div>
            <p className="font-semibold">Update Available!</p>
            <p className="text-sm opacity-90">Loading new version...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
