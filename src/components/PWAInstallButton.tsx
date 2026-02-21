'use client';

import { useEffect, useState } from 'react';
import { X, Download, Smartphone, Monitor, Tablet, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Detect device type
    const width = window.innerWidth;
    if (width < 768) {
      setDeviceType('mobile');
    } else if (width < 1024) {
      setDeviceType('tablet');
    } else {
      setDeviceType('desktop');
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => {
          setShowInstallPrompt(true);
          setIsAnimating(true);
        }, 3000); // Show after 3 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if user dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed > 7) {
        localStorage.removeItem('pwa-install-dismissed');
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        // Show iOS instructions
        setShowInstallPrompt(true);
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setIsAnimating(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled) return null;

  const DeviceIcon = deviceType === 'mobile' ? Smartphone : deviceType === 'tablet' ? Tablet : Monitor;

  return (
    <>
      {/* Floating Install Button */}
      {!showInstallPrompt && (deferredPrompt || isIOS) && (
        <button
          onClick={() => {
            setShowInstallPrompt(true);
            setIsAnimating(true);
          }}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Install DeMedia App"
        >
          <div className="relative">
            {/* Animated gradient background with pulse */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 animate-pulse transition-opacity" />
            
            {/* Rotating gradient ring */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full opacity-50 blur-sm animate-spin-slow" />
            
            {/* Button content */}
            <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <Download className="w-5 h-5" />
              <span className="font-semibold hidden sm:inline">Install App</span>
            </div>
          </div>
        </button>
      )}

      {/* Install Prompt Modal */}
      {showInstallPrompt && (
        <div 
          className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isAnimating ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div 
            className={`relative w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden transition-all duration-300 ${
              isAnimating ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
            }`}
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-blue-600/10 pointer-events-none animate-gradient" />
            
            {/* Sparkle effects */}
            <div className="absolute top-10 left-10 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
            <div className="absolute top-20 right-16 w-1 h-1 bg-pink-400 rounded-full animate-ping animation-delay-300" />
            <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping animation-delay-700" />
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors backdrop-blur-sm"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>

            <div className="relative p-8">
              {/* Icon with animated gradient border */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Rotating gradient ring */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur-xl opacity-50 animate-spin-slow" />
                  
                  {/* Icon container */}
                  <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-4 rounded-2xl shadow-lg">
                    <DeviceIcon className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>

              {/* Title with gradient text */}
              <h3 className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                Install DeMedia
              </h3>

              {/* Description */}
              <p className="text-gray-300 text-center mb-6 leading-relaxed">
                Get the full app experience with offline access, push notifications, and faster performance on your {deviceType}.
              </p>

              {/* Features with icons */}
              <div className="space-y-3 mb-6">
                {[
                  { icon: '⚡', text: 'Lightning-fast performance' },
                  { icon: '📱', text: 'Works offline' },
                  { icon: '🔔', text: 'Push notifications' },
                  { icon: '🎨', text: 'Native app experience' },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-gray-300 text-sm bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800/70 transition-colors"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="text-xl">{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* iOS Instructions */}
              {isIOS && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl backdrop-blur-sm">
                  <p className="text-sm text-blue-300 mb-2 font-semibold flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    iOS Installation:
                  </p>
                  <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                    <li>Tap the Share button <span className="inline-block text-lg">⎙</span></li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" to confirm</li>
                  </ol>
                </div>
              )}

              {/* Install Button */}
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="w-full relative group overflow-hidden rounded-xl mb-3"
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 transition-transform group-hover:scale-105" />
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  {/* Button content */}
                  <div className="relative px-6 py-4 flex items-center justify-center gap-2 text-white font-semibold">
                    <Download className="w-5 h-5" />
                    <span>Install Now</span>
                  </div>
                </button>
              )}

              {/* Later button */}
              <button
                onClick={handleDismiss}
                className="w-full px-6 py-3 text-gray-400 hover:text-gray-300 font-medium transition-colors rounded-lg hover:bg-gray-800/30"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animation-delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </>
  );
}
