"use client";
import { useEffect, useState } from "react";
import { contentService } from "@/services/contentService";
import { useAuth } from "@/contexts/AuthContext";

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

    if (loading) return <p className="text-gray-400 text-center">Loading suggestions...</p>;
    if (!suggestions.length) return <p className="text-gray-400 text-center">No suggestions found.</p>;

    return (
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
            <h3 className="font-bold text-lg mb-2">Suggestions</h3>
            <ul className="space-y-2">
                {suggestions.map((suggestion) => (
                    <li
                        key={suggestion.id}
                        className="flex items-center justify-between hover:bg-gray-700 p-2 rounded-lg"
                    >
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
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
                            </div>
                            <div>
                                <span className="text-white font-medium">{suggestion.user?.name || 'User'}</span>
                                <p className="text-xs text-gray-400">@{suggestion.user?.username || 'user'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleFollow(suggestion.id)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
                        >
                            Follow
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
