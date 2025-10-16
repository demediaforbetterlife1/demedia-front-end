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
                    bg: 'bg-gray-50',
                    text: 'text-gray-900'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-900',
                    text: 'text-white'
                };
            case 'super-dark':
                return {
                    bg: 'bg-black',
                    text: 'text-gray-100'
                };
            case 'gold':
                return {
                    bg: 'bg-gradient-to-br from-yellow-900 to-yellow-800',
                    text: 'text-yellow-100'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    text: 'text-white'
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
