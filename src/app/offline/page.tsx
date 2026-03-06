'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="text-center px-6">
        <div className="relative inline-block mb-8">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          <WifiOff className="relative w-24 h-24 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">You're Offline</h1>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          It looks like you've lost your internet connection. Don't worry, you can still browse cached content!
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 text-white font-semibold rounded-full hover:scale-105 transition-transform shadow-lg"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
