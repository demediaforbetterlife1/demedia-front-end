'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles, Download, Smartphone, Zap } from 'lucide-react';

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
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    if (localStorage.getItem('pwa-install-dismissed') === 'true') {
      return;
    }

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

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
        <div className="relative overflow-hidden">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-75 animate-pulse-glow"></div>
          
          <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/30">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Install DeMedia</h3>
                  <p className="text-gray-400 text-xs">Get the app experience</p>
                </div>
              </div>
              
              <ol className="text-gray-300 text-sm space-y-3 list-none">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 text-xs font-bold">1</span>
                  <span>Tap the Share button <span className="inline-block text-lg">📤</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xs font-bold">2</span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 text-xs font-bold">3</span>
                  <span>Tap "Add" to install the app</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="relative group">
        <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 animate-pulse-glow"></div>
        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 animate-spin-slow"></div>
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 rounded-3xl blur-md opacity-40 group-hover:opacity-60 animate-pulse"></div>
        
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-400 rounded-full blur-sm animate-ping"></div>
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-pink-400 rounded-full blur-sm animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute -top-2 -left-2 w-2 h-2 bg-purple-400 rounded-full blur-sm animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-cyan-300 rounded-full blur-sm animate-ping" style={{ animationDelay: '1.5s' }}></div>
        
        <button
          onClick={handleInstallClick}
          className="relative px-8 py-4 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 text-white font-bold rounded-3xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-neon flex items-center gap-3 border-2 border-white/30 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0 animate-pulse"></div>
          </div>
          
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            
            <div className="text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-shadow-neon font-extrabold text-lg">Install App</span>
                <Sparkles className="w-4 h-4 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              <p className="text-xs text-white/90 font-normal">Get the full experience</p>
            </div>
            
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </button>

        <button
          onClick={handleDismiss}
          className="absolute -top-3 -right-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full p-2 shadow-xl border-2 border-gray-700 transition-all duration-200 hover:scale-110 z-10"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
