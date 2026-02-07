"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { getEnhancedThemeClasses } from "@/utils/enhancedThemeUtils";
import Stories from "@/app/(PagesComps)/homedir/stories";
import Posts from "@/app/(PagesComps)/homedir/posts";
import { useState, useEffect } from "react";

const FloatingParticle = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 100, x: Math.random() * 100 }}
    animate={{
      opacity: [0, 1, 0],
      y: -100,
      x: Math.random() * 200 - 100,
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 5,
    }}
    className="absolute w-1 h-1 bg-current opacity-20 rounded-full"
  />
);

const BackgroundEffects = ({ theme }: { theme: string }) => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    // Listen for visibility changes to pause animations when tab is hidden
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Don't render animations if user prefers reduced motion or tab is hidden
  if (!mounted || reducedMotion || !isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {theme === "gold" && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-radial from-yellow-400/30 via-amber-500/20 to-transparent blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-gradient-radial from-orange-400/25 via-yellow-500/15 to-transparent blur-[120px]"
          />
          <div className="absolute inset-0 text-yellow-400/30">
            {Array.from({ length: 8 }).map((_, i) => (
              <FloatingParticle key={i} delay={i * 1.2} />
            ))}
          </div>
          <motion.div
            animate={{
              background: [
                "linear-gradient(45deg, transparent 30%, rgba(255,215,0,0.1) 50%, transparent 70%)",
                "linear-gradient(45deg, transparent 30%, rgba(255,215,0,0.2) 50%, transparent 70%)",
                "linear-gradient(45deg, transparent 30%, rgba(255,215,0,0.1) 50%, transparent 70%)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0"
          />
        </>
      )}

      {theme === "super-dark" && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-radial from-purple-600/20 via-blue-800/10 to-transparent blur-[150px]"
          />
          <motion.div
            animate={{
              scale: [1.3, 1, 1.3],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
            className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-gradient-radial from-indigo-600/15 via-purple-800/10 to-transparent blur-[130px]"
          />
          <svg className="absolute inset-0 w-full h-full opacity-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.line
                key={i}
                x1={Math.random() * 100 + "%"}
                y1={Math.random() * 100 + "%"}
                x2={Math.random() * 100 + "%"}
                y2={Math.random() * 100 + "%"}
                stroke="currentColor"
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
                className="text-purple-400"
              />
            ))}
          </svg>
          <div className="absolute inset-0 text-purple-400/20">
            {Array.from({ length: 10 }).map((_, i) => (
              <FloatingParticle key={i} delay={i * 0.8} />
            ))}
          </div>
        </>
      )}

      {theme === "super-light" && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] rounded-full bg-gradient-radial from-blue-200/30 via-sky-100/20 to-transparent blur-[80px]"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] rounded-full bg-gradient-radial from-purple-200/25 via-indigo-100/15 to-transparent blur-[70px]"
          />
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  rotate: i * 60,
                  opacity: 0,
                }}
                animate={{
                  rotate: i * 60 + 360,
                  opacity: [0, 0.1, 0],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  delay: i * 2,
                }}
                className="absolute top-1/2 left-1/2 w-1 h-[200%] bg-gradient-to-t from-transparent via-blue-200/20 to-transparent origin-bottom"
                style={{ transformOrigin: "0 0" }}
              />
            ))}
          </div>
          <div className="absolute inset-0 text-blue-300/30">
            {Array.from({ length: 6 }).map((_, i) => (
              <FloatingParticle key={i} delay={i * 1.0} />
            ))}
          </div>
        </>
      )}

      {!["gold", "super-dark", "super-light"].includes(theme) && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/8 blur-[120px]"
          />
        </>
      )}
    </div>
  );
};

export default function HomePage() {
  const { theme } = useTheme();
  const themeClasses = getEnhancedThemeClasses(theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddStory = () => {
    // Handle add story functionality
    console.log("Add story clicked");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} flex flex-col pb-20 md:pb-0 overflow-x-hidden relative`}
    >
      <BackgroundEffects theme={theme} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full max-w-2xl mx-auto"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="pt-4 md:pt-8"
        >
          <Stories />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="mt-6"
        >
          <Posts />
        </motion.div>

        <div className="h-20" />
      </motion.div>


      <motion.div
        className="fixed top-0 left-0 right-0 h-1 z-50 origin-left"
        style={{
          background:
            theme === "gold"
              ? "linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)"
              : theme === "super-dark"
                ? "linear-gradient(90deg, #8b5cf6, #7c3aed, #6d28d9)"
                : theme === "super-light"
                  ? "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)"
                  : "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      />
    </div>
  );
}