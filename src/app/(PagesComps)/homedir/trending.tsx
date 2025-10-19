"use client";
import { useEffect, useState } from "react";
import { contentService } from "@/services/contentService";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

type HashtagType = {
    id: number;
    tag: string;
};

export default function Trending() {
    const [hashtags, setHashtags] = useState<HashtagType[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { theme } = useTheme();

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-white',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    hover: 'hover:text-blue-500'
                };
            case 'super-light':
                return {
                    bg: 'bg-white',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    hover: 'hover:text-blue-600'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    hover: 'hover:text-cyan-400'
                };
            case 'super-dark':
                return {
                    bg: 'bg-gray-900',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    hover: 'hover:text-cyan-300'
                };
            case 'gold':
                return {
                    bg: 'bg-gradient-to-br from-yellow-800 to-yellow-700',
                    text: 'text-yellow-100',
                    textSecondary: 'text-yellow-200',
                    hover: 'hover:text-yellow-300'
                };
            default:
                return {
                    bg: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    hover: 'hover:text-cyan-400'
                };
        }
    };

    const themeClasses = getThemeClasses();

    useEffect(() => {
        async function fetchHashtags() {
            try {
                // Use personalized trending if user has interests, otherwise fallback to regular trending
                const userInterests = user?.interests || [];
                const data = userInterests.length > 0 
                    ? await contentService.getPersonalizedTrending(userInterests)
                    : await contentService.getTrending();
                
                setHashtags(data);
            } catch (err) {
                console.error("Failed to fetch hashtags:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchHashtags();
    }, [user?.interests]);

    if (loading) return <p className={`${themeClasses.textSecondary} text-center`}>Loading trending topics...</p>;
    if (!hashtags.length) return <p className={`${themeClasses.textSecondary} text-center`}>No trending topics found.</p>;

    return (
        <div className="w-full md:w-64 space-y-4">
            <div className={`${themeClasses.bg} rounded-2xl p-4 shadow-lg`}>
                <h3 className={`font-bold text-lg mb-2 ${themeClasses.text}`}>Trending Topics</h3>
                <ul className="space-y-1">
                    {hashtags.map((hashtag) => (
                        <li
                            key={hashtag.id}
                            className={`${themeClasses.textSecondary} ${themeClasses.hover} cursor-pointer`}
                        >
                            #{hashtag.tag}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
