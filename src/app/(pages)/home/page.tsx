"use client";

import { useTheme } from "@/contexts/ThemeContext";
import Stories from "@/app/(PagesComps)/homedir/stories";
import Posts from "@/app/(PagesComps)/homedir/posts";

export default function HomePage() {
    const { theme } = useTheme();

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
                    text: 'text-gray-900',
                    card: 'bg-white/80 backdrop-blur-sm',
                    border: 'border-gray-200',
                    shadow: 'shadow-lg'
                };
            case 'super-light':
                return {
                    bg: 'bg-gradient-to-br from-white to-gray-50',
                    text: 'text-gray-800',
                    card: 'bg-white/90 backdrop-blur-sm',
                    border: 'border-gray-300',
                    shadow: 'shadow-xl'
                };
            case 'dark':
                return {
                    bg: 'bg-gradient-to-br from-gray-900 to-gray-800',
                    text: 'text-white',
                    card: 'bg-gray-800/80 backdrop-blur-sm',
                    border: 'border-gray-700',
                    shadow: 'shadow-2xl'
                };
            case 'super-dark':
                return {
                    bg: 'bg-gradient-to-br from-black to-gray-900',
                    text: 'text-gray-100',
                    card: 'bg-black/60 backdrop-blur-sm',
                    border: 'border-gray-800',
                    shadow: 'shadow-2xl shadow-black/50'
                };
            case 'gold':
                return {
                    bg: 'bg-gradient-to-br from-yellow-900 via-yellow-800 to-amber-900',
                    text: 'text-yellow-100',
                    card: 'bg-yellow-900/40 backdrop-blur-sm',
                    border: 'border-yellow-700',
                    shadow: 'shadow-2xl shadow-yellow-500/20'
                };
            default:
                return {
                    bg: 'bg-gradient-to-br from-gray-900 to-gray-800',
                    text: 'text-white',
                    card: 'bg-gray-800/80 backdrop-blur-sm',
                    border: 'border-gray-700',
                    shadow: 'shadow-2xl'
                };
        }
    };

    const themeClasses = getThemeClasses();

    return (
        <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} flex flex-col pb-20 md:pb-0`}>
            <Stories />
            <Posts />
        </div>
    )
};
