"use client";
import { useEffect, useState } from "react";
import { contentService } from "@/services/contentService";
import { useAuth } from "@/contexts/AuthContext";

type SuggestionType = {
    id: number;
    user: {
        name: string;
        profilePicture?: string;
    };
};

export default function Suggestions() {
    const [suggestions, setSuggestions] = useState<SuggestionType[]>([]);
    const [loading, setLoading] = useState(true);
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

    if (loading) return <p className="text-gray-400 text-center">Loading suggestions...</p>;
    if (!suggestions.length) return <p className="text-gray-400 text-center">No suggestions found.</p>;

    return (
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
            <h3 className="font-bold text-lg mb-2">Suggestions</h3>
            <ul className="space-y-2">
                {suggestions.map((suggestion) => (
                    <li
                        key={suggestion.id}
                        className="flex items-center space-x-2 hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
                    >
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
                        <span>{suggestion.user?.name || 'User'}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
