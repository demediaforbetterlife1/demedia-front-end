"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, ArrowLeft, Eye, Flag, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { useNotifications } from "@/components/NotificationProvider";
import CommentModal from "@/components/CommentModal";
import { apiFetch } from "@/lib/api";

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

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const { t } = useI18n();
    const { showSuccess, showError } = useNotifications();
    
    const [post, setPost] = useState<PostType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCommentModal, setShowCommentModal] = useState(false);

    // Theme classes based on current theme
    const getThemeClasses = () => {
        switch (theme) {
            case 'dark':
                return {
                    bg: 'bg-gray-900',
                    bgSecondary: 'bg-gray-800',
                    bgTertiary: 'bg-gray-700',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    textMuted: 'text-gray-400',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    shadow: 'shadow-2xl'
                };
            case 'super-dark':
                return {
                    bg: 'bg-black',
                    bgSecondary: 'bg-gray-900',
                    bgTertiary: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-200',
                    textMuted: 'text-gray-500',
                    border: 'border-gray-800',
                    hover: 'hover:bg-gray-800',
                    shadow: 'shadow-2xl'
                };
            case 'light':
                return {
                    bg: 'bg-white',
                    bgSecondary: 'bg-gray-50',
                    bgTertiary: 'bg-gray-100',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-700',
                    textMuted: 'text-gray-500',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-100',
                    shadow: 'shadow-lg'
                };
            case 'super-light':
                return {
                    bg: 'bg-white',
                    bgSecondary: 'bg-gray-50',
                    bgTertiary: 'bg-gray-100',
                    text: 'text-black',
                    textSecondary: 'text-gray-800',
                    textMuted: 'text-gray-600',
                    border: 'border-gray-300',
                    hover: 'hover:bg-gray-50',
                    shadow: 'shadow-md'
                };
            case 'gold':
                return {
                    bg: 'bg-gray-900',
                    bgSecondary: 'bg-yellow-900/20',
                    bgTertiary: 'bg-yellow-800/30',
                    text: 'text-yellow-400',
                    textSecondary: 'text-yellow-300',
                    textMuted: 'text-yellow-500',
                    border: 'border-yellow-700',
                    hover: 'hover:bg-yellow-800/30',
                    shadow: 'shadow-2xl shadow-yellow-500/20'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    bgSecondary: 'bg-gray-800',
                    bgTertiary: 'bg-gray-700',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    textMuted: 'text-gray-400',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    shadow: 'shadow-2xl'
                };
        }
    };

    const themeClasses = getThemeClasses();

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await apiFetch(`/api/posts/${params.id}`);
                if (response.ok) {
                    const postData = await response.json();
                    setPost(postData);
                } else {
                    setError("Post not found");
                }
            } catch (err: unknown) {
                console.error("Failed to fetch post:", err);
                setError("Failed to load post");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchPost();
        }
    }, [params.id]);

    const handleLike = async (postId: number) => {
        try {
            const response = await apiFetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const responseData = await response.json();
                setPost(prev => prev ? {
                    ...prev,
                    liked: responseData.liked,
                    likes: responseData.likes
                } : null);
            }
        } catch (error: unknown) {
            console.error("Failed to like post:", error);
            showError("Like Failed", "Failed to like post");
        }
    };

    const handleBookmark = async (postId: number) => {
        try {
            const response = await apiFetch(`/api/posts/${postId}/bookmark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const responseData = await response.json();
                setPost(prev => prev ? {
                    ...prev,
                    bookmarked: responseData.bookmarked
                } : null);
            }
        } catch (error: unknown) {
            console.error("Failed to bookmark post:", error);
            showError("Bookmark Failed", "Failed to bookmark post");
        }
    };

    const handleShare = async () => {
        try {
            if (!post) return;

            const shareData = {
                title: 'Check out this post on DeMedia',
                text: post.content,
                url: window.location.href
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

    const handleComment = (postId: number) => {
        setShowCommentModal(true);
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

    if (loading) {
        return (
            <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
                <div className={`animate-spin rounded-full h-32 w-32 border-b-2 ${theme === 'gold' ? 'border-yellow-400' : 'border-cyan-400'}`}></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
                <div className="text-center">
                    <h1 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>Post Not Found</h1>
                    <p className={`${themeClasses.textMuted} mb-6`}>{error || "The post you're looking for doesn't exist."}</p>
                    <button
                        onClick={() => router.push('/home')}
                        className={`px-6 py-3 ${theme === 'gold' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-white rounded-lg transition-colors`}
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${themeClasses.bg}`}>
            {/* Header */}
            <div className={`sticky top-0 z-10 ${themeClasses.bgSecondary} border-b ${themeClasses.border} backdrop-blur-lg`}>
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => router.back()}
                        className={`flex items-center gap-2 ${theme === 'gold' ? 'text-yellow-400 hover:text-yellow-300' : 'text-cyan-400 hover:text-cyan-300'} transition-colors`}
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    <h1 className={`text-lg font-semibold ${themeClasses.text}`}>Post</h1>
                    <div className="w-8"></div> {/* Spacer for centering */}
                </div>
            </div>

            {/* Post Content */}
            <div className="max-w-2xl mx-auto p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`${themeClasses.bgSecondary} rounded-2xl ${themeClasses.shadow} p-6`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-full ${themeClasses.bgTertiary} flex items-center justify-center ${themeClasses.textSecondary} font-bold text-lg`}>
                                    {post.user?.name?.charAt(0) ?? "U"}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className={`font-semibold ${themeClasses.text}`}>{post.user?.name ?? 'Unknown User'}</h3>
                                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                    </div>
                                </div>
                                <div className={`text-sm ${themeClasses.textMuted}`}>@{post.user?.username ?? 'user'}</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {post.createdAt && (
                                <span className={`text-sm ${themeClasses.textMuted}`}>{formatTimeAgo(post.createdAt)}</span>
                            )}
                            <button className={`p-2 rounded-full ${themeClasses.hover} transition-colors`}>
                                <MoreHorizontal size={16} className={themeClasses.textMuted} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                        <p className={`${themeClasses.textSecondary} text-lg leading-relaxed`}>{post.content}</p>
                    </div>

                    {/* Post Media - Only show if there's actual media */}
                    {post.imageUrl && (
                        <div className="mb-4">
                            <img 
                                src={post.imageUrl} 
                                alt="Post content" 
                                className="w-full rounded-xl object-cover max-h-96"
                            />
                        </div>
                    )}
                    {post.videoUrl && (
                        <div className="mb-4">
                            <video 
                                src={post.videoUrl} 
                                controls 
                                className="w-full rounded-xl max-h-96"
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className={`flex items-center justify-between mt-6 pt-4 border-t ${themeClasses.border}`}>
                        <div className="flex items-center gap-8">
                            <button 
                                className={`flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                                    post.liked 
                                        ? 'text-pink-500 hover:text-pink-400' 
                                        : 'hover:text-pink-500'
                                }`}
                                onClick={() => handleLike(post.id)}
                            >
                                <Heart 
                                    size={20} 
                                    fill={post.liked ? 'currentColor' : 'none'}
                                /> 
                                <span className="text-sm font-medium">{post.likes}</span>
                            </button>
                            <button 
                                className="flex items-center gap-2 hover:text-blue-400 cursor-pointer transition-all duration-200 hover:scale-105"
                                onClick={() => handleComment(post.id)}
                            >
                                <MessageCircle size={20} /> 
                                <span className="text-sm font-medium">{post.comments}</span>
                            </button>
                            <button 
                                className="flex items-center gap-2 hover:text-green-400 cursor-pointer transition-all duration-200 hover:scale-105"
                                onClick={handleShare}
                            >
                                <Share2 size={20} />
                                <span className="text-sm font-medium">Share</span>
                            </button>
                        </div>
                        <button 
                            className={`flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                                post.bookmarked 
                                    ? 'text-yellow-500 hover:text-yellow-400' 
                                    : 'hover:text-yellow-500'
                            }`}
                            onClick={() => handleBookmark(post.id)}
                        >
                            {post.bookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Comment Modal */}
            {showCommentModal && (
                <CommentModal
                    isOpen={showCommentModal}
                    onClose={() => setShowCommentModal(false)}
                    postId={post.id}
                    postContent={post.content}
                    postAuthor={post.user?.name || 'Unknown User'}
                />
            )}
        </div>
    );
}
