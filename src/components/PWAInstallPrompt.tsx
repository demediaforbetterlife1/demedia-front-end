"use client";

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const webkitStandalone = (window.navigator as any).standalone === true;
      setIsStandalone(standalone || webkitStandalone);
      setIsInstalled(standalone || webkitStandalone);
    };

    // Check if iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(isIOSDevice);
    };

    checkInstalled();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay if not already installed
      if (!isInstalled) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="bg-gradient-to-r from-purple-600 via-cyan-500 to-blue-600 p-[1px] rounded-2xl shadow-2xl">
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-xl">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Install DeMedia</h3>
                    <p className="text-sm text-gray-300">Get the full app experience</p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Works offline</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Push notifications</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Native app experience</span>
                </div>
              </div>

              {isIOS ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-300">
                    To install on iOS:
                  </p>
                  <ol className="text-xs text-gray-400 space-y-1 pl-4">
                    <li>1. Tap the Share button in Safari</li>
                    <li>2. Scroll down and tap "Add to Home Screen"</li>
                    <li>3. Tap "Add" to install</li>
                  </ol>
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:brightness-110 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Install App</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}