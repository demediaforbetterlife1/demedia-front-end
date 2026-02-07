'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  buildTime: string;
  buildId: string;
  cachePolicy: string;
  environment: string;
  logo: string;
  cacheBuster: boolean;
  timestamp?: number;
}

/**
 * Hook to check for application version updates
 * NEVER auto-reloads - only notifies user
 */
export function useVersionCheck(checkInterval: number = 60000) {
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkVersion = async () => {
      try {
        // Fetch version with cache-busting parameter
        const response = await fetch(`/version.json?v=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          console.warn('Failed to fetch version info');
          return;
        }

        const versionInfo: VersionInfo = await response.json();

        // First load - set current version
        if (!currentVersion) {
          setCurrentVersion(versionInfo);
          console.log('📦 Current version:', versionInfo.buildId);
          return;
        }

        // Check if version has changed
        if (versionInfo.buildId !== currentVersion.buildId) {
          console.log('🔄 New version detected!');
          console.log('Current:', currentVersion.buildId);
          console.log('New:', versionInfo.buildId);
          setHasUpdate(true);
          
          // Store update info but DON'T auto-reload
          localStorage.setItem('update_available', 'true');
          localStorage.setItem('new_version', versionInfo.buildId);
          
          // Dispatch event for notification component
          window.dispatchEvent(new CustomEvent('app:update-available', {
            detail: {
              oldVersion: currentVersion.buildId,
              newVersion: versionInfo.buildId,
              timestamp: Date.now()
            }
          }));
          
          console.log('✅ Update notification dispatched - NO AUTO-RELOAD');
        }
      } catch (error) {
        console.error('Error checking version:', error);
      }
    };

    // Check immediately on mount
    checkVersion();

    // Set up periodic checks
    intervalId = setInterval(checkVersion, checkInterval);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentVersion, checkInterval]);

  return {
    currentVersion,
    hasUpdate,
  };
}
