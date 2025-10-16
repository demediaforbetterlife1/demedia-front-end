"use client";
import { useEffect, useState } from "react";
import { contentService } from "@/services/contentService";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

type SuggestionType = {
    id: number;
    user: {
        name: string;
        username?: string;
        profilePicture?: string;
    };
};

export default function Suggestions() {
    const [suggestions, setSuggestions] = useState<SuggestionType[]>([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState<Set<number>>(new Set());
    const { user } = useAuth();
    const { theme } = useTheme();

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-white',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    hover: 'hover:bg-gray-50',
                    button: 'bg-blue-500 hover:bg-blue-600'
                };
            case 'super-light':
                return {
                    bg: 'bg-white',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    hover: 'hover:bg-gray-100',
                    button: 'bg-blue-600 hover:bg-blue-700'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    hover: 'hover:bg-gray-700',
                    button: 'bg-blue-500 hover:bg-blue-600'
                };
            case 'super-dark':
                return {
                    bg: 'bg-gray-900',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    hover: 'hover:bg-gray-800',
                    button: 'bg-blue-600 hover:bg-blue-700'
                };
            case 'gold':
                return {
                    bg: 'bg-gradient-to-br from-yellow-800 to-yellow-700',
                    text: 'text-yellow-100',
                    textSecondary: 'text-yellow-200',
                    hover: 'hover:bg-yellow-800/80 gold-shimmer',
                    button: 'bg-yellow-600 hover:bg-yellow-700 text-yellow-100'
                };
            default:
                return {
                    bg: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    hover: 'hover:bg-gray-700',
                    button: 'bg-blue-500 hover:bg-blue-600'
                };
        }
    };

    const themeClasses = getThemeClasses();

    useEffect(() => {
        async function fetchSuggestions() {
            try {
                // Use personalized suggestions if user has interests, otherwise fallback to regular suggestions
                const userInterests = user?.interests || [];
                const data = userInterests.length > 0 
                    ? await contentService.getPersonalizedSuggestions(userInterests)
                    : await contentService.getSuggestions();
                
                setSuggestions(data);
            } catch (err) {
                console.error("Failed to fetch suggestions:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchSuggestions();
    }, [user?.interests]);

    const handleFollow = async (userId: number) => {
        try {
            const response = await fetch(`/api/user/${userId}/follow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ followerId: Number(user?.id) })
            });

            if (response.ok) {
                setFollowing(prev => new Set([...prev, userId]));
                // Remove from suggestions after following
                setSuggestions(prev => prev.filter(s => s.id !== userId));

                // Send follow notification
                try {
                    await fetch('/api/notifications', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        },
                        body: JSON.stringify({
                            userId: userId,
                            type: 'follow',
                            message: `${user?.name || 'Someone'} started following you`,
                            data: {
                                followerId: user?.id,
                                followerName: user?.name
                            }
                        })
                    });
                } catch (notificationError) {
                    console.warn('Failed to send follow notification:', notificationError);
                }
            }
        } catch (error) {
            console.error('Failed to follow user:', error);
        }
    };

    if (loading) return <p className={`${themeClasses.textSecondary} text-center`}>Loading suggestions...</p>;
    if (!suggestions.length) return <p className={`${themeClasses.textSecondary} text-center`}>No suggestions found.</p>;

    return (
        <div className={`${themeClasses.bg} rounded-2xl p-4 shadow-lg`}>
            <h3 className={`font-bold text-lg mb-2 ${themeClasses.text}`}>Suggestions</h3>
            <ul className="space-y-2">
                {suggestions.map((suggestion) => (
                    <li
                        key={suggestion.id}
                        className={`flex items-center justify-between ${themeClasses.hover} p-2 rounded-lg`}
                    >
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => window.location.href = `/profile?userId=${suggestion.id}`}
                                className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform cursor-pointer overflow-hidden"
                            >
                                {suggestion.user?.profilePicture ? (
                                    <img
                                        src={suggestion.user.profilePicture}
                                        alt={suggestion.user.name || 'User'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <span className={suggestion.user?.profilePicture ? 'hidden' : ''}>
                                    {suggestion.user?.name?.charAt(0) || 'U'}
                                </span>
                            </button>
                            <div>
                                <button
                                    onClick={() => window.location.href = `/profile?userId=${suggestion.id}`}
                                    className={`${themeClasses.text} font-medium hover:underline cursor-pointer`}
                                >
                                    {suggestion.user?.name || 'User'}
                                </button>
                                <p className={`text-xs ${themeClasses.textSecondary}`}>@{suggestion.user?.username || 'user'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleFollow(suggestion.id)}
                            className={`px-3 py-1 ${themeClasses.button} text-white text-xs rounded-full transition-colors`}
                        >
                            Follow
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
