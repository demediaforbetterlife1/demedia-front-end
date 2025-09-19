"use client";
import { useEffect, useState } from "react";
import { contentService } from "@/services/contentService";
import { useAuth } from "@/contexts/AuthContext";

type HashtagType = {
    id: number;
    tag: string;
};

export default function Trending() {
    const [hashtags, setHashtags] = useState<HashtagType[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

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

    if (loading) return <p className="text-gray-400 text-center">Loading trending topics...</p>;
    if (!hashtags.length) return <p className="text-gray-400 text-center">No trending topics found.</p>;

    return (
        <div className="w-full md:w-64 space-y-4">
            <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
                <h3 className="font-bold text-lg mb-2">Trending Topics</h3>
                <ul className="space-y-1">
                    {hashtags.map((hashtag) => (
                        <li
                            key={hashtag.id}
                            className="hover:text-cyan-400 cursor-pointer"
                        >
                            #{hashtag.tag}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
