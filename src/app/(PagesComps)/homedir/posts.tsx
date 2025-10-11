"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, Flag, MoreHorizontal, Eye, EyeOff, Zap, Star, TrendingUp, Award, Crown, Flame, Diamond, Target, Sparkles, Gift } from "lucide-react";
import Trending from "@/app/(PagesComps)/homedir/trending";
import Suggestions from "@/app/(PagesComps)/homedir/suggestions";
import { contentService } from "@/services/contentService";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useNotifications } from "@/components/NotificationProvider";
import CommentModal from "@/components/CommentModal";
import ReportModal from "@/components/ReportModal";
import { apiFetch } from "@/lib/api";

type PostType = {
    id: number;
    title?: string;
    content: string;
    likes: number;
    comments: number;
    liked?: boolean;
    bookmarked?: boolean;
    views?: number;
    user?: {
        id?: number;
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
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
    const { user } = useAuth();
    const { t } = useI18n();
    const { showSuccess, showError } = useNotifications();

    useEffect(() => {
        const abort = new AbortController();
        let retryCount = 0;
        const maxRetries = 3;

        async function fetchPosts() {
            try {
                setLoading(true);
                setError(null);

                // Use personalized content if user has interests, otherwise fallback to regular posts
                const userInterests = user?.interests || [];
                let data;
                
                if (userInterests.length > 0) {
                    try {
                        const response = await apiFetch('/api/posts/personalized', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ interests: userInterests })
                        });
                        data = await response.json();
                    } catch (error) {
                        console.log('Personalized posts failed, falling back to regular posts');
                        const response = await apiFetch('/api/posts');
                        data = await response.json();
                    }
                } else {
                    const response = await apiFetch('/api/posts');
                    data = await response.json();
                }

                setPosts(data);
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                console.error("Failed to fetch posts:", err);
                console.error("Error details:", {
                    message: err instanceof Error ? err.message : 'Unknown error',
                    stack: err instanceof Error ? err.stack : undefined
                });
                
                // Retry logic for network errors
                if (retryCount < maxRetries && err instanceof Error && 
                    (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
                    retryCount++;
                    console.log(`Retrying fetch posts, attempt ${retryCount}/${maxRetries}`);
                    setTimeout(() => {
                        if (!abort.signal.aborted) {
                            fetchPosts();
                        }
                    }, 1000 * retryCount);
                    return;
                }
                
                let message = 'Failed to fetch posts';
                if (err instanceof Error) {
                    if (err.message.includes('Failed to fetch')) {
                        message = 'Network error. Please check your connection and try again.';
                    } else if (err.message.includes('401')) {
                        message = 'Authentication error. Please log in again.';
                    } else if (err.message.includes('500')) {
                        message = 'Server error. Please try again later.';
                    } else {
                        message = err.message;
                    }
                }
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
            const response = await apiFetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            // Update with actual response
            const responseData = await response.json();
            setPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { 
                        ...p, 
                        likes: responseData.likes,
                        liked: responseData.liked
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
        const post = posts.find(p => p.id === postId);
        if (post) {
            setSelectedPost(post);
            setShowCommentModal(true);
        }
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
            await apiFetch(`/api/posts/${postId}/bookmark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
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

    const handleReport = (post: PostType) => {
        setSelectedPost(post);
        setShowReportModal(true);
    };

    const handleReportSubmitted = async (reason: string, details: string) => {
        if (!selectedPost) return;

        try {
            // Call API to report the post with reason and details
            await apiFetch(`/api/posts/${selectedPost.id}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason,
                    details,
                    postId: selectedPost.id
                })
            });
            showSuccess('Post Reported', 'Thank you for your report. We will review it shortly.');
        } catch (error: unknown) {
            console.error('Error reporting post:', error);
            showError('Report Failed', 'Failed to submit report. Please try again.');
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
                                <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.location.href = `/profile?userId=${post.user?.id || post.id}`}
                                    className="w-10 h-10 rounded-full theme-bg-tertiary flex items-center justify-center theme-text-secondary font-bold hover:shadow-lg transition-all duration-300 cursor-pointer"
                                >
                                    {post.user?.name?.charAt(0) ?? "U"}
                                </motion.button>
                                    {/* Online Status Indicator */}
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold theme-text-primary">{post.user?.name ?? t('posts.unknown','Unknown')}</span>
                                        {/* Special Badges */}
                                        <div className="flex gap-1">
                                            <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                                <Crown size={12} className="text-white" />
                                            </div>
                                            <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                <Diamond size={12} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm theme-text-muted">@{post.user?.username ?? 'user'}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {post.createdAt && (
                                    <span className="text-sm theme-text-muted">{formatTimeAgo(post.createdAt)}</span>
                                )}
                                <button 
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleReport(post)}
                                >
                                    <MoreHorizontal size={16} className="theme-text-muted" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="mb-3">
                            {post.title && (
                                <h3 className="text-lg font-semibold theme-text-primary mb-2">{post.title}</h3>
                            )}
                            <p className="theme-text-secondary">{post.content}</p>
                            {/* Engagement Indicators */}
                            <div className="flex items-center gap-2 mt-2">
                                {post.likes > 50 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-full">
                                        <TrendingUp size={12} className="text-pink-400" />
                                        <span className="text-xs text-pink-400 font-medium">Trending</span>
                                    </div>
                                )}
                                {post.comments > 20 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full">
                                        <MessageCircle size={12} className="text-blue-400" />
                                        <span className="text-xs text-blue-400 font-medium">Hot Discussion</span>
                                    </div>
                                )}
                                {post.views && post.views > 1000 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full">
                                        <Eye size={12} className="text-green-400" />
                                        <span className="text-xs text-green-400 font-medium">Viral</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Post Media - Only show if there's actual media */}
                        {post.imageUrl && (
                            <div className="mb-3">
                                <img 
                                    src={post.imageUrl} 
                                    alt="Post content" 
                                    className="w-full rounded-xl object-cover max-h-96"
                                />
                            </div>
                        )}
                        {post.videoUrl && (
                            <div className="mb-3">
                                <video 
                                    src={post.videoUrl} 
                                    controls 
                                    className="w-full rounded-xl max-h-96"
                                />
                            </div>
                        )}

                        {/* Enhanced Actions */}
                        <div className="flex items-center justify-between mt-3 theme-text-muted">
                            <div className="flex items-center gap-6">
                                <button 
                                    className={`flex items-center gap-1 cursor-pointer transition-all duration-200 hover:scale-105 ${
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
                                    {post.likes > 100 && (
                                        <div className="w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                                            <Flame size={10} className="text-white" />
                                        </div>
                                    )}
                                </button>
                                <button 
                                    className="flex items-center gap-1 hover:text-blue-400 cursor-pointer transition-all duration-200 hover:scale-105"
                                    onClick={() => handleComment(post.id)}
                                >
                                    <MessageCircle size={18} /> 
                                    <span className="text-sm">{post.comments}</span>
                                    {post.comments > 50 && (
                                        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                            <Zap size={10} className="text-white" />
                                        </div>
                                    )}
                                </button>
                                <button 
                                    className="flex items-center gap-1 hover:text-green-400 cursor-pointer transition-all duration-200 hover:scale-105"
                                    onClick={() => handleShare(post.id)}
                                >
                                    <Share2 size={18} />
                                </button>
                                {/* New Special Actions */}
                                <button className="flex items-center gap-1 hover:text-purple-400 cursor-pointer transition-all duration-200 hover:scale-105">
                                    <Sparkles size={18} />
                                </button>
                                <button className="flex items-center gap-1 hover:text-yellow-400 cursor-pointer transition-all duration-200 hover:scale-105">
                                    <Star size={18} />
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
                                    onClick={() => handleReport(post)}
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

            {/* Comment Modal */}
            {selectedPost && (
                <CommentModal
                    isOpen={showCommentModal}
                    onClose={() => {
                        setShowCommentModal(false);
                        setSelectedPost(null);
                    }}
                    postId={selectedPost.id}
                    postContent={selectedPost.content}
                    postAuthor={selectedPost.user?.name || 'Unknown'}
                />
            )}

            {/* Report Modal */}
            {selectedPost && (
                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => {
                        setShowReportModal(false);
                        setSelectedPost(null);
                    }}
                    postId={selectedPost.id}
                    postAuthor={selectedPost.user?.name || 'Unknown'}
                    onReportSubmitted={handleReportSubmitted}
                />
            )}
        </div>
    );
}
