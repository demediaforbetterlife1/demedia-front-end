"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, Flag, MoreHorizontal, Eye, EyeOff } from "lucide-react";
import Trending from "@/app/(PagesComps)/homedir/trending";
import Suggestions from "@/app/(PagesComps)/homedir/suggestions";
import { contentService } from "@/services/contentService";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useNotifications } from "@/components/NotificationProvider";

type PostType = {
    id: number;
    content: string;
    likes: number;
    comments: number;
    liked?: boolean;
    bookmarked?: boolean;
    views?: number;
    user?: {
        name?: string;
        username?: string;
        profilePicture?: string;
    };
    createdAt?: string;
    imageUrl?: string;
    videoUrl?: string;
};

export default function Posts() {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { t } = useI18n();
    const { showSuccess, showError } = useNotifications();

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

    const handleLike = async (postId: number) => {
        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            const isCurrentlyLiked = post.liked;
            
            // Optimistic update
            setPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { 
                        ...p, 
                        likes: isCurrentlyLiked ? p.likes - 1 : p.likes + 1,
                        liked: !isCurrentlyLiked
                    }
                    : p
            ));

            // Call API to toggle like
            const response = await contentService.likePost(postId);
            
            // Update with actual response
            setPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { 
                        ...p, 
                        likes: response.likes,
                        liked: response.liked
                    }
                    : p
            ));
        } catch (error: unknown) {
            console.error('Error liking post:', error);
            // Revert optimistic update on error
            setPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { 
                        ...p, 
                        likes: p.liked ? p.likes + 1 : p.likes - 1,
                        liked: !p.liked
                    }
                    : p
            ));
        }
    };

    const handleComment = async (postId: number) => {
        // TODO: Implement comment modal
        console.log('Comment on post:', postId);
    };

    const handleBookmark = async (postId: number) => {
        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            const wasBookmarked = post.bookmarked;

            // Optimistic update
            setPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { ...p, bookmarked: !wasBookmarked }
                    : p
            ));

            // Call API to bookmark/unbookmark the post
            await contentService.bookmarkPost(postId);
            
            if (wasBookmarked) {
                showSuccess('Bookmark Removed', 'Post removed from bookmarks');
            } else {
                showSuccess('Post Bookmarked', 'Post saved to your bookmarks');
            }
        } catch (error: unknown) {
            console.error('Error bookmarking post:', error);
            // Revert optimistic update on error
            setPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { ...p, bookmarked: !p.bookmarked }
                    : p
            ));
            showError('Bookmark Failed', 'Failed to bookmark post');
        }
    };

    const handleReport = async (postId: number) => {
        try {
            // Call API to report the post
            await contentService.reportPost(postId);
            showSuccess('Post Reported', 'Post reported successfully');
        } catch (error: unknown) {
            console.error('Error reporting post:', error);
            showError('Report Failed', 'Failed to report post');
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const handleShare = async (postId: number) => {
        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            const shareData = {
                title: 'Check out this post on DeMedia',
                text: post.content,
                url: `${window.location.origin}/post/${postId}`
            };

            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                showSuccess('Link Copied!', 'Post link copied to clipboard');
            }
        } catch (error: unknown) {
            console.error('Error sharing post:', error);
        }
    };



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
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full theme-bg-tertiary flex items-center justify-center theme-text-secondary font-bold">
                                    {post.user?.name?.charAt(0) ?? "U"}
                                </div>
                                <div>
                                    <div className="font-semibold theme-text-primary">{post.user?.name ?? t('posts.unknown','Unknown')}</div>
                                    <div className="text-sm theme-text-muted">@{post.user?.username ?? 'user'}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {post.createdAt && (
                                    <span className="text-sm theme-text-muted">{formatTimeAgo(post.createdAt)}</span>
                                )}
                                <button 
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleReport(post.id)}
                                >
                                    <MoreHorizontal size={16} className="theme-text-muted" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <p className="mb-3 theme-text-secondary">{post.content}</p>

                        {/* Post Image Placeholder */}
                        <div className="rounded-xl theme-bg-tertiary h-48 flex items-center justify-center theme-text-muted">
                            {t('posts.image','Image')}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-3 theme-text-muted">
                            <div className="flex items-center gap-6">
                                <button 
                                    className={`flex items-center gap-1 cursor-pointer transition-colors ${
                                        post.liked 
                                            ? 'text-pink-500 hover:text-pink-400' 
                                            : 'hover:text-pink-500'
                                    }`}
                                    onClick={() => handleLike(post.id)}
                                >
                                    <Heart 
                                        size={18} 
                                        fill={post.liked ? 'currentColor' : 'none'}
                                    /> 
                                    <span className="text-sm">{post.likes}</span>
                                </button>
                                <button 
                                    className="flex items-center gap-1 hover:text-blue-400 cursor-pointer transition-colors"
                                    onClick={() => handleComment(post.id)}
                                >
                                    <MessageCircle size={18} /> 
                                    <span className="text-sm">{post.comments}</span>
                                </button>
                                <button 
                                    className="flex items-center gap-1 hover:text-green-400 cursor-pointer transition-colors"
                                    onClick={() => handleShare(post.id)}
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                {post.views && (
                                    <div className="flex items-center gap-1 text-sm theme-text-muted">
                                        <Eye size={16} />
                                        <span>{post.views}</span>
                                    </div>
                                )}
                                <button 
                                    className={`flex items-center gap-1 cursor-pointer transition-colors ${
                                        post.bookmarked 
                                            ? 'text-yellow-500 hover:text-yellow-400' 
                                            : 'hover:text-yellow-500'
                                    }`}
                                    onClick={() => handleBookmark(post.id)}
                                >
                                    {post.bookmarked ? (
                                        <BookmarkCheck size={18} fill="currentColor" />
                                    ) : (
                                        <Bookmark size={18} />
                                    )}
                                </button>
                                <button 
                                    className="flex items-center gap-1 hover:text-red-500 cursor-pointer transition-colors"
                                    onClick={() => handleReport(post.id)}
                                >
                                    <Flag size={18} />
                                </button>
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
