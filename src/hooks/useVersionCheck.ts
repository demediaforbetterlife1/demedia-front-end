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
 * ONLY shows notification when there's a REAL version change
 */
export function useVersionCheck(checkInterval: number = 60000) {
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isInitialLoad = true;

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

        // First load - set current version and store it
        if (!currentVersion || isInitialLoad) {
          setCurrentVersion(versionInfo);
          localStorage.setItem('app_version', versionInfo.buildId);
          console.log('📦 Current version:', versionInfo.buildId);
          isInitialLoad = false;
          
          // Clear any stale update flags on initial load
          localStorage.removeItem('update_available');
          localStorage.removeItem('new_version');
          return;
        }

        // Check if version has ACTUALLY changed
        if (versionInfo.buildId !== currentVersion.buildId) {
          // Double-check this is a real change, not a false positive
          const storedVersion = localStorage.getItem('app_version');
          
          if (storedVersion === versionInfo.buildId) {
            // This is a false positive - versions are actually the same
            console.log('⚠️ False positive update detected - ignoring');
            setCurrentVersion(versionInfo);
            return;
          }
          
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
