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
 * Checks version.json to detect new deployments
 * Shows notification but NEVER auto-reloads
 */
export function useVersionCheck(checkInterval: number = 120000) { // Check every 2 minutes
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let initialVersion: string | null = null;

    const fetchVersion = async () => {
      try {
        // Add cache-busting parameter to ensure fresh data
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });

        if (response.ok) {
          const versionData: VersionInfo = await response.json();
          
          // Store initial version on first load
          if (!initialVersion) {
            initialVersion = versionData.buildId;
            setCurrentVersion(versionData);
            console.log('📦 Current build:', versionData.buildId);
            return;
          }

          // Check if version has changed
          if (versionData.buildId !== initialVersion) {
            console.log('🆕 New version detected:', {
              old: initialVersion,
              new: versionData.buildId,
            });
            setHasUpdate(true);
            setCurrentVersion(versionData);
            
            // Store update flag for notification
            localStorage.setItem('update_available', 'true');
            localStorage.setItem('new_version', versionData.buildId);
          }
        }
      } catch (error) {
        console.error('Version check failed:', error);
        // Silently fail - don't disrupt user experience
      }
    };

    // Initial check
    fetchVersion();

    // Set up periodic checks
    intervalId = setInterval(fetchVersion, checkInterval);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkInterval]);

  return {
    currentVersion,
    hasUpdate,
  };
}
