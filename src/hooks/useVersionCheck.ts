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
 * Automatically detects when a new version is deployed
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
          
          // Auto-reload after 2 seconds to get new version
          setTimeout(() => {
            console.log('🔄 Reloading to apply updates...');
            window.location.reload();
          }, 2000);
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
