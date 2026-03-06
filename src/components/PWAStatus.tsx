'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Wifi, WifiOff } from 'lucide-react';

export default function PWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show status when installed
  if (!isInstalled) return null;

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
      {/* Installed Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-md rounded-full border border-green-500/30">
        <Smartphone className="w-4 h-4 text-green-400" />
        <span className="text-xs font-medium text-green-300">App Mode</span>
      </div>

      {/* Online/Offline Status */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 backdrop-blur-md rounded-full border transition-all duration-300 ${
          isOnline
            ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30'
            : 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/30 animate-pulse'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-300">Offline</span>
          </>
        )}
      </div>
    </div>
  );
}
