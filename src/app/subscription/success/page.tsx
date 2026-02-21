'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/home');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700 text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <CheckCircle className="relative w-24 h-24 text-green-400" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-8 h-8 text-yellow-400" />
          Welcome to Premium!
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-300 mb-6"
        >
          Your subscription has been activated successfully. You now have access to all premium
          features!
        </motion.p>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900/50 rounded-xl p-6 mb-6 text-left"
        >
          <h3 className="text-lg font-semibold text-white mb-3">What's included:</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Unlimited posts
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> HD video uploads
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Advanced analytics
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Ad-free experience
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Verified badge
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Priority support
            </li>
          </ul>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-400 mb-6"
        >
          Redirecting to home in {countdown} seconds...
        </motion.div>

        {/* Manual Redirect Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => router.push('/home')}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          Go to Home Now
        </motion.button>

        {/* Session ID (for debugging) */}
        {sessionId && process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-gray-500 mt-4">Session: {sessionId}</p>
        )}
      </motion.div>
    </div>
  );
}
