'use client';

import { motion } from "framer-motion";
import { Plus, Camera, Video, Sparkles } from "lucide-react";
import { useState } from "react";

interface ProfessionalAddStoryButtonProps {
  onClick?: () => void;
  variant?: 'default' | 'floating' | 'compact' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export default function ProfessionalAddStoryButton({
  onClick,
  variant = 'default',
  size = 'md',
  showLabel = true,
  className = '',
  theme = 'auto'
}: ProfessionalAddStoryButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: { container: 'w-12 h-12', icon: 'w-4 h-4', text: 'text-xs' },
    md: { container: 'w-16 h-16', icon: 'w-6 h-6', text: 'text-xs' },
    lg: { container: 'w-20 h-20', icon: 'w-8 h-8', text: 'text-sm' }
  };

  const themeClasses = {
    light: {
      bg: 'bg-white/95 backdrop-blur-md',
      border: 'border-gray-200/60',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      shadow: 'shadow-lg shadow-gray-200/50',
      hover: 'hover:shadow-xl hover:shadow-blue-200/30'
    },
    dark: {
      bg: 'bg-gray-800/95 backdrop-blur-md',
      border: 'border-gray-700/60',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      shadow: 'shadow-lg shadow-black/20',
      hover: 'hover:shadow-xl hover:shadow-blue-500/20'
    }
  };

  const currentTheme = theme === 'auto' 
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  const styles = themeClasses[currentTheme];
  const sizes = sizeClasses[size];

  if (variant === 'floating') {
    return (
      <motion.button
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={onClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`fixed bottom-6 right-6 ${sizes.container} rounded-2xl ${styles.bg} ${styles.border} border ${styles.shadow} ${styles.hover} flex items-center justify-center z-50 transition-all duration-300 ${className}`}
      >
        {/* Animated Background */}
        <motion.div
          animate={isHovered ? {
            background: [
              'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              'linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
              'linear-gradient(45deg, rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl"
        />

        {/* Plus Icon */}
        <motion.div
          animate={isHovered ? { rotate: 90 } : { rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="relative z-10"
        >
          <Plus className={`${sizes.icon} text-blue-500 drop-shadow-sm`} strokeWidth={2.5} />
        </motion.div>

        {/* Ripple Effect */}
        <motion.div
          animate={isHovered ? { scale: [1, 1.5], opacity: [0.3, 0] } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl bg-blue-500/20"
        />
      </motion.button>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${styles.bg} ${styles.border} border ${styles.shadow} ${styles.hover} transition-all duration-200 ${className}`}
      >
        <Plus className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
        {showLabel && (
          <span className={`${styles.text} font-medium`}>Add Story</span>
        )}
      </motion.button>
    );
  }

  if (variant === 'premium') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05, y: -3 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`flex flex-col items-center cursor-pointer group ${className}`}
        onClick={onClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="relative">
          {/* Premium Gradient Border */}
          <motion.div 
            animate={isHovered ? { 
              background: [
                'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
                'linear-gradient(45deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)',
                'linear-gradient(45deg, #ec4899, #3b82f6, #8b5cf6, #ec4899)'
              ]
            } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"
          />
          
          {/* Main Container */}
          <div className={`relative ${sizes.container} rounded-2xl ${styles.bg} ${styles.border} border ${styles.shadow} ${styles.hover} flex items-center justify-center transition-all duration-300 overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20" />
            </div>
            
            {/* Icon Container */}
            <motion.div
              animate={isHovered ? { rotate: 90, scale: 1.1 } : { rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="relative z-10 flex items-center justify-center"
            >
              <div className="relative">
                {/* Icon Glow */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md"
                />
                
                <Plus className={`relative ${sizes.icon} text-blue-500 group-hover:text-blue-400 transition-colors duration-200 drop-shadow-sm`} strokeWidth={2.5} />
              </div>
            </motion.div>
            
            {/* Corner Accent */}
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [0.8, 1, 0.8]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
            />
            
            {/* Shimmer Effect */}
            <motion.div
              animate={isHovered ? { x: ['-100%', '200%'] } : {}}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
            />
          </div>
        </div>
        
        {/* Labels */}
        {showLabel && (
          <div className="mt-2 text-center">
            <motion.span
              className={`block ${sizes.text} font-semibold ${styles.text} group-hover:text-blue-400 transition-colors duration-200`}
              whileHover={{ scale: 1.05 }}
            >
              Add Story
            </motion.span>
            <span className={`text-[10px] ${styles.textSecondary} font-medium opacity-70 group-hover:opacity-100 transition-opacity`}>
              Share moment
            </span>
          </div>
        )}
        
        {/* Hover Indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={isHovered ? { width: "60%" } : { width: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-1 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
        />
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`flex flex-col items-center cursor-pointer group ${className}`}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Subtle Border Animation */}
        <motion.div 
          animate={isHovered ? { 
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)'
          } : {}}
          transition={{ duration: 0.3 }}
          className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-50 blur-sm transition-opacity duration-300"
        />
        
        {/* Main Button */}
        <div className={`relative ${sizes.container} rounded-2xl ${styles.bg} ${styles.border} border ${styles.shadow} ${styles.hover} flex items-center justify-center transition-all duration-300 overflow-hidden`}>
          {/* Subtle Background */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
          
          {/* Icon */}
          <motion.div
            animate={isHovered ? { rotate: 90 } : { rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative z-10"
          >
            <Plus className={`${sizes.icon} text-blue-500 group-hover:text-blue-400 transition-colors duration-200`} strokeWidth={2.5} />
          </motion.div>
        </div>
      </div>
      
      {/* Label */}
      {showLabel && (
        <span className={`mt-2 ${sizes.text} font-medium ${styles.text} group-hover:text-blue-400 transition-colors duration-200`}>
          Add Story
        </span>
      )}
    </motion.div>
  );
}