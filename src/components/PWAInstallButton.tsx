'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if dismissed
    if (localStorage.getItem('pwa-install-dismissed') === 'true') {
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Handle beforeinstallprompt event (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show button if not installed
    if (iOS && !(window.navigator as any).standalone) {
      setShowInstallButton(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallButton) return null;

  if (showIOSInstructions) {
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-sm mx-4">
        <div className="bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse-glow"></div>
          
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X size={20} />
          </button>
          
          <div className="relative z-10">
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Install DeMedia
            </h3>
            <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
              <li>Tap the Share button <span className="inline-block">📤</span></li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" to install</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-slow">
      <div className="relative group">
        {/* Outer glow - largest */}
        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-60 group-hover:opacity-90 animate-pulse-glow"></div>
        
        {/* Middle glow - rotating */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 animate-spin-slow"></div>
        
        {/* Inner glow - pulsing */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 rounded-full blur-md opacity-40 group-hover:opacity-60 animate-pulse"></div>
        
        {/* Sparkle effects */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full blur-sm animate-ping"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full blur-sm animate-ping" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Button */}
        <button
          onClick={handleInstallClick}
          className="relative px-8 py-4 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 text-white font-bold rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-neon flex items-center gap-3 border-2 border-white/20 overflow-hidden group"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          <Sparkles className="w-6 h-6 animate-pulse relative z-10" />
          <span className="text-shadow-neon relative z-10">Install App</span>
          <Sparkles className="w-6 h-6 animate-pulse relative z-10" style={{ animationDelay: '0.5s' }} />
        </button>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-1.5 shadow-lg border border-gray-600 transition-all duration-200 hover:scale-110 z-10"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
