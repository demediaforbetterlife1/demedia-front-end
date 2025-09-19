"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import Trending from "@/app/(PagesComps)/homedir/trending";
import Suggestions from "@/app/(PagesComps)/homedir/suggestions";
import { contentService } from "@/services/contentService";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

type PostType = {
    id: number;
    content: string;
    likes: number;
    comments: number;
    user?: {
        name?: string;
    };
};

export default function Posts() {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { t } = useI18n();

    useEffect(() => {
        const abort = new AbortController();

        async function fetchPosts() {
            try {
                setLoading(true);
                setError(null);

                // Use personalized content if user has interests, otherwise fallback to regular posts
                const userInterests = user?.interests || [];
                const data = userInterests.length > 0 
                    ? await contentService.getPersonalizedPosts(userInterests)
                    : await contentService.getPosts();

                setPosts(data);
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                console.error("Failed to fetch posts:", err);
                const message = err instanceof Error ? err.message : 'Failed to fetch posts';
                setError(message);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();

        return () => {
            abort.abort();
        };
    }, [user?.interests]);

    if (loading) return <p className="text-center theme-text-muted mt-10">{t('posts.loading','Loading posts...')}</p>;
    if (error) return <p className="text-center text-red-400 mt-10">{t('posts.error','Error')}: {error}</p>;
    if (!posts.length) return <p className="text-center theme-text-muted mt-10">{t('posts.none','No posts yet.')}</p>;

    return (
        <div className="flex flex-col md:flex-row p-4 gap-6">
            {/* Feed Section */}
            <div className="flex-1 md:w-2/3 max-w-2xl mx-auto space-y-4">
                {posts.map((post) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="theme-bg-secondary rounded-2xl theme-shadow p-4"
                    >
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 rounded-full theme-bg-tertiary flex items-center justify-center theme-text-secondary font-bold">
                                {post.user?.name?.charAt(0) ?? "U"}
                            </div>
                            <div className="font-semibold theme-text-primary">{post.user?.name ?? t('posts.unknown','Unknown')}</div>
                        </div>

                        {/* Content */}
                        <p className="mb-3 theme-text-secondary">{post.content}</p>

                        {/* Post Image Placeholder */}
                        <div className="rounded-xl theme-bg-tertiary h-48 flex items-center justify-center theme-text-muted">
                            {t('posts.image','Image')}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-6 mt-3 theme-text-muted">
                            <div className="flex items-center gap-1 hover:text-pink-500 cursor-pointer">
                                <Heart size={18} /> <span className="text-sm">{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1 hover:text-blue-400 cursor-pointer">
                                <MessageCircle size={18} /> <span className="text-sm">{post.comments}</span>
                            </div>
                            <div className="flex items-center gap-1 hover:text-green-400 cursor-pointer">
                                <Share2 size={18} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Sidebar for Large Screens */}
            <div className="hidden md:block md:w-1/3 space-y-4">
                <Trending />
                <div className="theme-bg-secondary rounded-2xl theme-shadow p-4">
                    <Suggestions />
                </div>
            </div>
        </div>
    );
}
