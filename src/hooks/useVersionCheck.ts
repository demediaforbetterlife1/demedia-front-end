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
 * DISABLED - Causing false positives and performance issues
 */
export function useVersionCheck(checkInterval: number = 60000) {
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // DISABLED: Version checking is causing false positives
    // Clear any stale flags
    localStorage.removeItem('update_available');
    localStorage.removeItem('new_version');
    localStorage.removeItem('sw_update_available');
    
    console.log('📦 Version checking disabled to prevent false positives');
    
    // Don't set up any intervals or checks
    return () => {};
  }, []);

  return {
    currentVersion,
    hasUpdate: false, // Always return false
  };
}
