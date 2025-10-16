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
    const { user } = useAuth();
    const { theme } = useTheme();
    const { t } = useI18n();
    const { showSuccess, showError } = useNotifications();

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gray-50',
                    card: 'bg-white',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-50',
                    input: 'bg-white border-gray-300',
                    button: 'bg-blue-500 hover:bg-blue-600',
                    buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-100',
                    card: 'bg-white',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-100',
                    hover: 'hover:bg-gray-100',
                    input: 'bg-white border-gray-200',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                };
            case 'dark':
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
            case 'super-dark':
                return {
                    bg: 'bg-black',
                    card: 'bg-gray-900',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800',
                    hover: 'hover:bg-gray-800',
                    input: 'bg-gray-800 border-gray-700',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                };
            case 'gold':
                return {
                    bg: 'bg-gradient-to-br from-yellow-900 to-yellow-800',
                    card: 'bg-gradient-to-br from-yellow-800 to-yellow-700',
                    text: 'text-yellow-100',
                    textSecondary: 'text-yellow-200',
                    border: 'border-yellow-600/50',
                    hover: 'hover:bg-yellow-800/80 gold-shimmer',
                    input: 'bg-yellow-800/50 border-yellow-600/50 focus:border-yellow-400',
                    button: 'bg-yellow-600 hover:bg-yellow-700 text-yellow-100',
                    buttonSecondary: 'bg-yellow-700/50 hover:bg-yellow-600/50 text-yellow-200'
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
            });

            if (response.ok) {
                const data = await response.json();
                setPosts(prev => prev.map(p => 
                    p.id === postId 
                        ? { ...p, liked: data.liked, likes: data.likes }
                        : p
                ));
            }
        } catch (error) {
            console.error('Error liking post:', error);
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
            const response = await apiFetch(`/api/posts/${postId}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(prev => ({ ...prev, [postId]: data }));
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
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

    if (loading) return <p className={`text-center ${themeClasses.textSecondary} mt-10`}>{t('posts.loading','Loading posts...')}</p>;
    if (error) return <p className="text-center text-red-400 mt-10">{t('posts.error','Error')}: {error}</p>;
    if (!posts.length) return <p className={`text-center ${themeClasses.textSecondary} mt-10`}>{t('posts.none','No posts yet.')}</p>;

    return (
        <div className={`flex flex-col md:flex-row p-4 gap-6 ${themeClasses.bg}`}>
            {/* Feed Section */}
            <div className="flex-1 md:w-2/3 max-w-2xl mx-auto space-y-4">
                {posts.map((post) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${themeClasses.card} rounded-2xl shadow-lg border ${themeClasses.border} overflow-hidden`}
                    >
                        {/* Post Header */}
                        <div className={`p-4 border-b ${themeClasses.border}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => handleProfileClick(post.author.id)}
                                        className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold hover:scale-105 transition-transform cursor-pointer"
                                    >
                                        {post.author.name.charAt(0).toUpperCase()}
                                    </button>
                                    <div>
                                        <button
                                            onClick={() => handleProfileClick(post.author.id)}
                                            className={`font-semibold ${themeClasses.text} hover:underline cursor-pointer`}
                                        >
                                            {post.author.name}
                                        </button>
                                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                                            @{post.author.username} • {formatTimeAgo(post.createdAt)}
                                        </p>
                                    </div>
                                    {post.user?.subscriptionTier && (
                                        <PremiumUserIndicator subscriptionTier={post.user.subscriptionTier} />
                                    )}
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
                                        <div className="absolute right-4 top-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                                            <button
                                                onClick={() => handleReport(post)}
                                                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                                            >
                                                <Flag className="w-4 h-4" />
                                                <span>Report</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div className="p-4">
                            {post.title && (
                                <h2 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                                    {post.title}
                                </h2>
                            )}
                            <p className={`${themeClasses.text} whitespace-pre-wrap`}>
                                {post.content}
                            </p>
                            
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
                        <div className={`px-4 py-3 border-t ${themeClasses.border}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        className={`flex items-center space-x-2 transition-colors ${
                                            post.liked 
                                                ? 'text-red-500' 
                                                : `${themeClasses.textSecondary} hover:text-red-500`
                                        }`}
                                    >
                                        <Heart size={20} fill={post.liked ? 'currentColor' : 'none'} />
                                        <span className="text-sm font-medium">{post.likes}</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => toggleComments(post.id)}
                                        className={`flex items-center space-x-2 ${themeClasses.textSecondary} hover:text-blue-500 transition-colors`}
                                    >
                                        <MessageCircle size={20} />
                                        <span className="text-sm font-medium">{post.comments}</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => handleBookmark(post.id)}
                                        className={`flex items-center space-x-2 transition-colors ${
                                            post.bookmarked 
                                                ? 'text-yellow-500' 
                                                : `${themeClasses.textSecondary} hover:text-yellow-500`
                                        }`}
                                    >
                                        <Bookmark size={20} fill={post.bookmarked ? 'currentColor' : 'none'} />
                                        <span className="text-sm font-medium">Save</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => handleShare(post.id)}
                                        className={`flex items-center space-x-2 ${themeClasses.textSecondary} hover:text-green-500 transition-colors`}
                                    >
                                        <Share size={20} />
                                        <span className="text-sm font-medium">Share</span>
                                    </button>
                                </div>
                                
                                {post.views && (
                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                        <Eye size={16} />
                                        <span>{post.views} views</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments Section */}
                        {showComments[post.id] && (
                            <div className={`border-t ${themeClasses.border} p-4`}>
                                <div className="space-y-3">
                                    {comments[post.id]?.map((comment: any) => (
                                        <div key={comment.id} className="flex space-x-3">
                                            <button
                                                onClick={() => handleProfileClick(comment.author.id)}
                                                className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform cursor-pointer"
                                            >
                                                {comment.author.name.charAt(0).toUpperCase()}
                                            </button>
                                            <div className="flex-1">
                                                <div className={`${themeClasses.card} rounded-lg p-3`}>
                                                    <div className="flex items-center space-x-2 mb-1">
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
                                                    <p className={`text-sm ${themeClasses.text}`}>{comment.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Add Comment */}
                                    <div className="flex space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 flex space-x-2">
                                            <input
                                                type="text"
                                                placeholder="Write a comment..."
                                                value={newComment[post.id] || ''}
                                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                className={`flex-1 px-3 py-2 ${themeClasses.input} border rounded-lg ${themeClasses.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                            />
                                            <button
                                                onClick={() => handleAddComment(post.id)}
                                                className={`px-4 py-2 ${themeClasses.button} text-white rounded-lg hover:opacity-90 transition-opacity`}
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
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