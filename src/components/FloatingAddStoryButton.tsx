'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Camera, Video, Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface FloatingAddStoryButtonProps {
  onAddStory?: () => void;
  onAddPhoto?: () => void;
  onAddVideo?: () => void;
  className?: string;
}

export default function FloatingAddStoryButton({
  onAddStory,
  onAddPhoto,
  onAddVideo,
  className = ''
}: FloatingAddStoryButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { theme } = useTheme();

  // Auto-hide on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getThemeStyles = () => {
    switch (theme) {
      case 'light':
      case 'super-light':
        return {
          bg: 'bg-white/95 backdrop-blur-md',
          border: 'border-gray-200/60',
          text: 'text-gray-900',
          shadow: 'shadow-lg shadow-gray-200/50',
          hover: 'hover:shadow-xl hover:shadow-blue-200/30'
        };
      case 'dark':
      case 'super-dark':
        return {
          bg: 'bg-gray-800/95 backdrop-blur-md',
          border: 'border-gray-700/60',
          text: 'text-white',
          shadow: 'shadow-lg shadow-black/20',
          hover: 'hover:shadow-xl hover:shadow-blue-500/20'
        };
      case 'gold':
        return {
          bg: 'bg-gradient-to-br from-yellow-800/95 to-yellow-700/95 backdrop-blur-md',
          border: 'border-yellow-600/60',
          text: 'text-yellow-100',
          shadow: 'shadow-lg shadow-yellow-900/30',
          hover: 'hover:shadow-xl hover:shadow-yellow-500/20'
        };
      default:
        return {
          bg: 'bg-gray-800/95 backdrop-blur-md',
          border: 'border-gray-700/60',
          text: 'text-white',
          shadow: 'shadow-lg shadow-black/20',
          hover: 'hover:shadow-xl hover:shadow-blue-500/20'
        };
    }
  };

  const styles = getThemeStyles();

  const menuItems = [
    {
      icon: Camera,
      label: 'Photo Story',
      color: 'from-blue-500 to-blue-600',
      onClick: onAddPhoto || onAddStory
    },
    {
      icon: Video,
      label: 'Video Story',
      color: 'from-purple-500 to-purple-600',
      onClick: onAddVideo || onAddStory
    },
    {
      icon: Sparkles,
      label: 'Quick Story',
      color: 'from-pink-500 to-pink-600',
      onClick: onAddStory
    }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`fixed bottom-6 right-6 z-50 ${className}`}
        >
          {/* Expanded Menu */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute bottom-20 right-0 flex flex-col gap-3"
              >
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      item.onClick?.();
                      setIsExpanded(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${styles.bg} ${styles.border} border ${styles.shadow} ${styles.hover} transition-all duration-200 min-w-[160px] group`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center shadow-lg`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`${styles.text} font-medium group-hover:text-blue-400 transition-colors`}>
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-16 h-16 rounded-2xl ${styles.bg} ${styles.border} border ${styles.shadow} ${styles.hover} flex items-center justify-center transition-all duration-300 relative overflow-hidden group`}
          >
            {/* Animated Background */}
            <motion.div
              animate={isExpanded ? {
                background: [
                  'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                  'linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                  'linear-gradient(45deg, rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))'
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0"
            />

            {/* Icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="relative z-10"
            >
              {isExpanded ? (
                <X className="w-6 h-6 text-red-500" strokeWidth={2.5} />
              ) : (
                <Plus className="w-6 h-6 text-blue-500 group-hover:text-blue-400 transition-colors" strokeWidth={2.5} />
              )}
            </motion.div>

            {/* Ripple Effect */}
            <motion.div
              animate={isExpanded ? { scale: [1, 1.5], opacity: [0.3, 0] } : {}}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl bg-blue-500/20"
            />

            {/* Professional Glow */}
            <motion.div
              animate={{
                boxShadow: isExpanded 
                  ? ['0 0 20px rgba(59, 130, 246, 0.3)', '0 0 40px rgba(59, 130, 246, 0.5)', '0 0 20px rgba(59, 130, 246, 0.3)']
                  : '0 0 0px rgba(59, 130, 246, 0)'
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl"
            />

            {/* Tooltip */}
            <div className="professional-tooltip">
              {isExpanded ? 'Close menu' : 'Add Story'}
            </div>
          </motion.button>

          {/* Backdrop */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsExpanded(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}