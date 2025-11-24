"use client";

import { motion } from "framer-motion";

import { useTheme } from "@/contexts/ThemeContext";
import { getEnhancedThemeClasses } from "@/utils/enhancedThemeUtils";
import Stories from "@/app/(PagesComps)/homedir/stories";
import Posts from "@/app/(PagesComps)/homedir/posts";

export default function HomePage() {
    const { theme } = useTheme();
    const themeClasses = getEnhancedThemeClasses(theme);

    return (
        <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} flex flex-col pb-20 md:pb-0 overflow-x-hidden`}>
            {/* Background ambient glow - subtle and modern */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] mix-blend-screen animate-pulse-slow delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
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
            </motion.div>
        </div>
    )
};
