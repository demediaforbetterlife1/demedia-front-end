"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Smartphone, X } from "lucide-react";

interface VerificationMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'whatsapp' | 'sms') => void;
  phoneNumber: string;
}

export default function VerificationMethodModal({ 
  isOpen, 
  onClose, 
  onSelectMethod, 
  phoneNumber 
}: VerificationMethodModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleMethodSelect = async (method: 'whatsapp' | 'sms') => {
    setIsLoading(true);
    try {
      await onSelectMethod(method);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-md mx-4 rounded-2xl p-[4px] bg-transparent"
          >
            <motion.div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 blur-md animate-spin-slow" style={{ zIndex: 0 }} />
            <div className="relative bg-gradient-to-br from-[#0d1b2a]/90 via-[#1b263b]/80 to-[#0d1b2a]/90 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl z-10">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-cyan-200 mb-2">
                  Choose Verification Method 📱
                </h2>
                <p className="text-cyan-100 text-sm">
                  How would you like to receive your verification code?
                </p>
                <p className="text-cyan-300 text-xs mt-1">
                  {phoneNumber}
                </p>
              </div>

              <div className="space-y-4">
                {/* WhatsApp Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMethodSelect('whatsapp')}
                  disabled={isLoading}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-3">
                    <MessageSquare className="text-green-400" size={24} />
                    <div className="text-left">
                      <div className="text-green-400 font-semibold">WhatsApp</div>
                      <div className="text-green-300 text-sm">Send code via WhatsApp</div>
                    </div>
                  </div>
                </motion.button>

                {/* SMS Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMethodSelect('sms')}
                  disabled={isLoading}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Smartphone className="text-blue-400" size={24} />
                    <div className="text-left">
                      <div className="text-blue-400 font-semibold">SMS</div>
                      <div className="text-blue-300 text-sm">Send code via SMS</div>
                    </div>
                  </div>
                </motion.button>
              </div>

              {isLoading && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-cyan-400">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Sending verification code...</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
