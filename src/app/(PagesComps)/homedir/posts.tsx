"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
    Heart, 
    MessageCircle, 
    Share, 
    Bookmark, 
    MoreHorizontal,
    Trash2,
    Edit,
    Flag,
    Eye,
    ThumbsUp,
    ThumbsDown,
    Reply,
    Send
} from "lucide-react";
import Trending from "@/app/(PagesComps)/homedir/trending";
import Suggestions from "@/app/(PagesComps)/homedir/suggestions";
import { contentService } from "@/services/contentService";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { useNotifications } from "@/components/NotificationProvider";
import CommentModal from "@/components/CommentModal";
import ReportModal from "@/components/ReportModal";
import EditPostModal from "@/components/EditPostModal";
import { apiFetch } from "@/lib/api";
import PremiumUserIndicator from "@/components/PremiumUserIndicator";

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
        subscriptionTier?: 'monthly' | 'quarterly' | 'semiannual' | null;
    };
    author: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
    };
    createdAt: string;
    imageUrl?: string;
    videoUrl?: string;
    images?: string[];
    videos?: string[];
    media?: {
        type: 'image' | 'video';
        url: string;
        thumbnail?: string;
    }[];
};

export default function Posts() {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
    const [showDropdown, setShowDropdown] = useState<number | null>(null);
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
    const [comments, setComments] = useState<{[key: number]: any[]}>({});
    const [newComment, setNewComment] = useState<{[key: number]: string}>({});
    const [showComments, setShowComments] = useState<{[key: number]: boolean}>({});
    const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
    const { user } = useAuth();
    const { theme } = useTheme();
    const { t } = useI18n();
    const { showSuccess, showError } = useNotifications();

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
                    card: 'bg-white/90 backdrop-blur-sm',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-50',
                    input: 'bg-white/80 border-gray-300 backdrop-blur-sm',
                    button: 'bg-blue-500 hover:bg-blue-600',
                    buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
                    shadow: 'shadow-lg'
                };
            case 'super-light':
                return {
                    bg: 'bg-gradient-to-br from-white to-gray-50',
                    card: 'bg-white/95 backdrop-blur-sm',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-50',
                    input: 'bg-white/90 border-gray-200 backdrop-blur-sm',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
                    shadow: 'shadow-xl'
                };
            case 'dark':
                return {
                    bg: 'bg-gradient-to-br from-gray-900 to-gray-800',
                    card: 'bg-gray-800/90 backdrop-blur-sm',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700/50',
                    input: 'bg-gray-700/80 border-gray-600 backdrop-blur-sm',
                    button: 'bg-blue-500 hover:bg-blue-600',
                    buttonSecondary: 'bg-gray-600 hover:bg-gray-500 text-gray-200',
                    shadow: 'shadow-2xl'
                };
            case 'super-dark':
                return {
                    bg: 'bg-gradient-to-br from-black to-gray-900',
                    card: 'bg-black/60 backdrop-blur-sm',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800/50',
                    hover: 'hover:bg-gray-800/30',
                    input: 'bg-black/40 border-gray-700/50 backdrop-blur-sm',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    buttonSecondary: 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300',
                    shadow: 'shadow-2xl shadow-black/50'
                };
            case 'gold':
                return {
                    bg: 'bg-gradient-to-br from-yellow-900 via-yellow-800 to-amber-900',
                    card: 'bg-gray-600/30 backdrop-blur-sm',
                    text: 'text-yellow-100',
                    textSecondary: 'text-yellow-200',
                    border: 'border-yellow-600/30',
                    hover: 'hover:bg-yellow-800/20',
                    input: 'bg-yellow-800/30 border-yellow-600/30 backdrop-blur-sm',
                    button: 'bg-yellow-600 hover:bg-yellow-700 text-yellow-100',
                    buttonSecondary: 'bg-yellow-700/30 hover:bg-yellow-600/30 text-yellow-200',
                    shadow: 'shadow-2xl shadow-yellow-500/20'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    input: 'bg-gray-700 border-gray-600',
                    button: 'bg-blue-500 hover:bg-blue-600',
                    buttonSecondary: 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                };
        }
    };

    const themeClasses = getThemeClasses();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showDropdown && !(event.target as Element).closest('.dropdown')) {
                setShowDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

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

                console.log('📊 Posts data received:', data);
                console.log('📊 Data type:', typeof data);
                console.log('📊 Is array:', Array.isArray(data));
                
                // Ensure data is an array
                let postsArray: any[] = data;
                if (!Array.isArray(data)) {
                    console.log('📊 Data is not array, checking for posts property...');
                    if (data && Array.isArray(data.posts)) {
                        postsArray = data.posts;
                    } else if (data && Array.isArray(data.data)) {
                        postsArray = data.data;
                    } else {
                        console.log('📊 No posts array found, using empty array');
                        postsArray = [];
                    }
                }

                console.log('📊 Final posts array:', postsArray);
                console.log('📊 Posts count:', postsArray.length);
                
                // Ensure all posts have required fields
                const processedPosts = postsArray.map((post: any) => ({
                    ...post,
                    createdAt: post.createdAt || new Date().toISOString(),
                    author: {
                        id: post.author?.id || post.user?.id || 0,
                        name: post.author?.name || post.user?.name || 'Unknown User',
                        username: post.author?.username || post.user?.username || 'unknown',
                        profilePicture: post.author?.profilePicture || post.user?.profilePicture
                    }
                }));
                
                setPosts(processedPosts);
            } catch (err) {
                console.error('Error fetching posts:', err);
                setError('Failed to load posts');
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
            const response = await apiFetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Like response:', data);
                setPosts(prev => prev.map(p => 
                    p.id === postId 
                        ? { ...p, liked: data.liked, likes: data.likes }
                        : p
                ));
                showSuccess('Like Updated', data.liked ? 'Post liked!' : 'Post unliked!');
            } else {
                console.error('Failed to like post:', response.status);
                showError('Error', 'Failed to like post');
            }
        } catch (error) {
            console.error('Error liking post:', error);
            showError('Error', 'Failed to like post');
        }
    };

    const handleBookmark = async (postId: number) => {
        try {
            const response = await apiFetch(`/api/posts/${postId}/bookmark`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                setPosts(prev => prev.map(p => 
                    p.id === postId 
                        ? { ...p, bookmarked: data.bookmarked }
                        : p
                ));
            }
        } catch (error) {
            console.error('Error bookmarking post:', error);
        }
    };

    const handleComment = (post: PostType) => {
        setSelectedPost(post);
        setShowCommentModal(true);
    };

    const handleReport = (post: PostType) => {
        setSelectedPost(post);
        setShowReportModal(true);
    };

    const handleDelete = async (postId: number) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await apiFetch(`/api/posts/${postId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setPosts(prev => prev.filter(p => p.id !== postId));
                showSuccess('Post Deleted', 'Your post has been deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            showError('Error', 'Failed to delete post');
        }
    };

    const handleEdit = (post: PostType) => {
        setSelectedPost(post);
        setShowEditModal(true);
    };

    const handlePostUpdated = (updatedPost: PostType) => {
        setPosts(prev => prev.map(p => 
            p.id === updatedPost.id ? updatedPost : p
        ));
        setShowEditModal(false);
        setSelectedPost(null);
        showSuccess('Post Updated', 'Your post has been updated successfully');
    };

    const handleReportSubmitted = () => {
        setShowReportModal(false);
        setSelectedPost(null);
        showSuccess('Report Submitted', 'Thank you for your report');
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

    const fetchComments = async (postId: number) => {
        try {
            console.log('Fetching comments for post:', postId);
            const response = await apiFetch(`/api/posts/${postId}/comments`);
            console.log('Comments response:', response.status, response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Comments data received:', data);
                setComments(prev => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
            } else {
                console.warn('Failed to fetch comments, response not ok');
                setComments(prev => ({ ...prev, [postId]: [] }));
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            setComments(prev => ({ ...prev, [postId]: [] }));
        }
    };

    const handleAddComment = async (postId: number) => {
        const commentText = newComment[postId];
        if (!commentText?.trim()) return;

        try {
            const response = await apiFetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentText.trim() })
            });

            if (response.ok) {
                const newCommentData = await response.json();
                setComments(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), newCommentData]
                }));
                setNewComment(prev => ({ ...prev, [postId]: '' }));
                setPosts(prev => prev.map(p => 
                    p.id === postId ? { ...p, comments: p.comments + 1 } : p
                ));
                showSuccess('Comment Added', 'Your comment has been posted');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showError('Error', 'Failed to add comment');
        }
    };

    const handleProfileClick = (userId: number) => {
        window.location.href = `/profile?userId=${userId}`;
    };

    const toggleComments = (postId: number) => {
        setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
        if (!showComments[postId] && !comments[postId]) {
            fetchComments(postId);
        }
    };

    const togglePostExpansion = (postId: number) => {
        setExpandedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    const shouldTruncateText = (text: string) => {
        return text.length > 200; // Show first 200 characters
    };

    const getTruncatedText = (text: string, maxLength: number = 200) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (loading) return <p className={`text-center ${themeClasses.textSecondary} mt-10`}>{t('posts.loading','Loading posts...')}</p>;
    if (error) return <p className="text-center text-red-400 mt-10">{t('posts.error','Error')}: {error}</p>;
    if (!posts.length) return <p className={`text-center ${themeClasses.textSecondary} mt-10`}>{t('posts.none','No posts yet.')}</p>;

    return (
        <div className={`flex flex-col md:flex-row p-4 gap-6 ${themeClasses.bg}`}>
            {/* Feed Section */}
            <div className="flex-1 md:w-2/3 max-w-2xl mx-auto space-y-4">
                    {posts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                                duration: 0.6, 
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 100,
                                damping: 15
                            }}
                            whileHover={{ 
                                scale: 1.02, 
                                y: -5,
                                transition: { duration: 0.3 }
                            }}
                            className={`${themeClasses.card} rounded-3xl shadow-2xl border ${themeClasses.border} overflow-hidden relative group backdrop-blur-sm bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90`}
                        >
                        {/* Post Header */}
                        <div className={`p-6 border-b ${themeClasses.border} bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-600/50 relative overflow-hidden`}>
                            {/* Animated background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5 animate-pulse"></div>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center space-x-4">
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleProfileClick(post.author.id)}
                                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold hover:shadow-2xl transition-all duration-300 cursor-pointer shadow-lg relative overflow-hidden group"
                                    >
                                        {/* Animated background */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <span className="relative z-10 text-lg font-extrabold">
                                            {post.author.name.charAt(0).toUpperCase()}
                                        </span>
                                        {/* Shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                    </motion.button>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleProfileClick(post.author.id)}
                                                className={`font-semibold ${themeClasses.text} hover:underline cursor-pointer`}
                                            >
                                                {post.author.name}
                                            </button>
                                            {post.user?.subscriptionTier && (
                                                <PremiumUserIndicator subscriptionTier={post.user.subscriptionTier} />
                                            )}
                                        </div>
                                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                                            @{post.author.username} • {formatTimeAgo(post.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    {user?.id === post.author.id.toString() && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className={`p-2 rounded-full ${themeClasses.hover} transition-colors`}
                                                title="Edit post"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                title="Delete post"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowDropdown(showDropdown === post.id ? null : post.id)}
                                        className={`p-2 rounded-full ${themeClasses.hover} transition-colors`}
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    
                                    {showDropdown === post.id && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute right-4 top-16 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-[120px]"
                                        >
                                            <button
                                                onClick={() => {
                                                    handleReport(post);
                                                    setShowDropdown(null);
                                                }}
                                                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full transition-colors"
                                            >
                                                <Flag className="w-4 h-4" />
                                                <span>Report</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div className="p-6 relative">
                            {/* Content background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-white/20 to-blue-50/20 dark:from-gray-800/30 dark:via-gray-700/20 dark:to-blue-900/20"></div>
                            
                            <div className="relative z-10">
                                {post.title && (
                                    <motion.h2 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className={`text-xl font-bold ${themeClasses.text} mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent`}
                                    >
                                        {post.title}
                                    </motion.h2>
                                )}
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className={`${themeClasses.text} whitespace-pre-wrap leading-relaxed text-base`}
                                >
                                {shouldTruncateText(post.content) && !expandedPosts.has(post.id) ? (
                                    <div>
                                        <p>{getTruncatedText(post.content)}</p>
                                        <motion.button
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => togglePostExpansion(post.id)}
                                            className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl relative overflow-hidden group"
                                        >
                                            <span className="relative z-10">VIEW DETAILS</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </motion.button>
                                    </div>
                                ) : (
                                    <div>
                                        <p>{post.content}</p>
                                        {shouldTruncateText(post.content) && expandedPosts.has(post.id) && (
                                            <motion.button
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => togglePostExpansion(post.id)}
                                                className="mt-4 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-semibold rounded-full hover:from-gray-600 hover:to-gray-700 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl relative overflow-hidden group"
                                            >
                                                <span className="relative z-10">SHOW LESS</span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </motion.button>
                                        )}
                                    </div>
                                )}
                                </motion.div>
                            </div>
                            
                            {post.imageUrl && (
                                <img 
                                    src={post.imageUrl} 
                                    alt="Post image" 
                                    className="mt-4 w-full rounded-lg"
                                />
                            )}
                            
                            {post.videoUrl && (
                                <video 
                                    src={post.videoUrl} 
                                    controls 
                                    className="mt-4 w-full rounded-lg"
                                />
                            )}
                        </div>

                        {/* Post Actions */}
                        <div className={`px-6 py-6 border-t ${themeClasses.border} bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-600/50 relative overflow-hidden`}>
                            {/* Animated background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-400/5 to-pink-400/5 dark:from-blue-500/3 dark:via-purple-500/3 dark:to-pink-500/3"></div>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center space-x-6 sm:space-x-8">
                                    <motion.button
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleLike(post.id)}
                                        className={`flex items-center space-x-2 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
                                            post.liked
                                                ? 'text-white bg-gradient-to-r from-red-500 to-pink-500 shadow-lg'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:shadow-lg'
                                        }`}
                                    >
                                        <Heart size={20} fill={post.liked ? 'currentColor' : 'none'} className="relative z-10" />
                                        <span className="text-sm font-semibold relative z-10">{post.likes}</span>
                                        {!post.liked && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        )}
                                    </motion.button>
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => toggleComments(post.id)}
                                        className="flex items-center space-x-2 px-4 py-3 rounded-2xl transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:shadow-lg relative overflow-hidden group"
                                    >
                                        <MessageCircle size={20} className="relative z-10" />
                                        <span className="text-sm font-semibold relative z-10">{post.comments}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </motion.button>
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleBookmark(post.id)}
                                        className={`flex items-center space-x-2 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
                                            post.bookmarked
                                                ? 'text-white bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-yellow-500 hover:to-orange-500 hover:shadow-lg'
                                        }`}
                                    >
                                        <Bookmark size={20} fill={post.bookmarked ? 'currentColor' : 'none'} className="relative z-10" />
                                        <span className="text-sm font-semibold relative z-10 hidden sm:inline">Save</span>
                                        {!post.bookmarked && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        )}
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleShare(post.id)}
                                        className="flex items-center space-x-2 px-4 py-3 rounded-2xl transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-500 hover:shadow-lg relative overflow-hidden group"
                                    >
                                        <Share size={20} className="relative z-10" />
                                        <span className="text-sm font-semibold relative z-10 hidden sm:inline">Share</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </motion.button>
                                </div>
                                
                                {post.views && (
                                    <div className="flex items-center space-x-1 text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                        <Eye size={14} />
                                        <span className="text-xs">{post.views}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments Section */}
                        {showComments[post.id] && (
                            <div className={`border-t ${themeClasses.border} p-4 bg-gradient-to-r from-transparent to-gray-50/50 dark:to-gray-800/50`}>
                                <div className="space-y-4">
                                    {/* Comments List */}
                                    {comments[post.id] && comments[post.id].length > 0 ? (
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {comments[post.id].map((comment: any) => (
                                                <motion.div 
                                                    key={comment.id} 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex space-x-3"
                                                >
                                                    <button
                                                        onClick={() => handleProfileClick(comment.author.id)}
                                                        className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform cursor-pointer shadow-md"
                                                    >
                                                        {comment.author.name.charAt(0).toUpperCase()}
                                                    </button>
                                                    <div className="flex-1">
                                                        <div className={`${themeClasses.card} rounded-xl p-3 shadow-sm border ${themeClasses.border}`}>
                                                            <div className="flex items-center space-x-2 mb-2">
                                                                <button
                                                                    onClick={() => handleProfileClick(comment.author.id)}
                                                                    className={`font-semibold text-sm ${themeClasses.text} hover:underline cursor-pointer`}
                                                                >
                                                                    {comment.author.name}
                                                                </button>
                                                                <span className={`text-xs ${themeClasses.textSecondary}`}>
                                                                    {formatTimeAgo(comment.createdAt)}
                                                                </span>
                                                            </div>
                                                            <p className={`text-sm ${themeClasses.text} leading-relaxed`}>{comment.content}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className={`${themeClasses.textSecondary} text-sm`}>No comments yet. Be the first to comment!</p>
                                        </div>
                                    )}
                                    
                                    {/* Add Comment */}
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex space-x-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 flex space-x-2">
                                            <input
                                                type="text"
                                                placeholder="Write a comment..."
                                                value={newComment[post.id] || ''}
                                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                className={`flex-1 px-4 py-2 ${themeClasses.input} border rounded-xl ${themeClasses.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm`}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleAddComment(post.id)}
                                                disabled={!newComment[post.id]?.trim()}
                                                className={`px-4 py-2 ${themeClasses.button} text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
                                            >
                                                <Send className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Sidebar for Large Screens */}
            <div className="hidden md:block md:w-1/3 space-y-4">
                <Trending />
                <div className={`${themeClasses.card} rounded-2xl shadow-lg p-4 border ${themeClasses.border}`}>
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

            {/* Edit Post Modal */}
            {selectedPost && (
                <EditPostModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedPost(null);
                    }}
                    post={selectedPost}
                    onPostUpdated={handlePostUpdated}
                />
            )}
        </div>
    );
}