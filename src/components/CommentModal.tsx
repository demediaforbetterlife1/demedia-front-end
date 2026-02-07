"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Heart, Reply, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { apiFetch } from "@/lib/api";
import { contentModerationService } from "@/services/contentModeration";
import PremiumComment from "./PremiumComment";
import PremiumUserIndicator from "./PremiumUserIndicator";

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    user: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
        subscriptionTier?: 'monthly' | 'quarterly' | 'semiannual' | null;
    };
    likes: number;
    isLiked?: boolean;
    replies?: Comment[];
}

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: number;
    postContent: string;
    postAuthor: string;
    isDeSnap?: boolean;
}

export default function CommentModal({ isOpen, onClose, postId, postContent, postAuthor, isDeSnap = false }: CommentModalProps) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { t } = useI18n();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-white/95 backdrop-blur-lg',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200',
                    input: 'bg-white/80 border-gray-300 backdrop-blur-sm',
                    button: 'bg-blue-500 hover:bg-blue-600',
                    buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
                    shadow: 'shadow-2xl'
                };
            case 'super-light':
                return {
                    bg: 'bg-white/98 backdrop-blur-lg',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-200',
                    input: 'bg-white/90 border-gray-200 backdrop-blur-sm',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
                    shadow: 'shadow-3xl'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-800/95 backdrop-blur-lg',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    input: 'bg-gray-700/80 border-gray-600 backdrop-blur-sm',
                    button: 'bg-blue-500 hover:bg-blue-600',
                    buttonSecondary: 'bg-gray-600 hover:bg-gray-500 text-gray-200',
                    shadow: 'shadow-2xl'
                };
            case 'super-dark':
                return {
                    bg: 'bg-black/90 backdrop-blur-lg',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800',
                    input: 'bg-black/40 border-gray-700 backdrop-blur-sm',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    buttonSecondary: 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300',
                    shadow: 'shadow-2xl shadow-black/50'
                };
            case 'gold':
                return {
                    bg: 'bg-yellow-900/90 backdrop-blur-lg',
                    text: 'text-yellow-100',
                    textSecondary: 'text-yellow-200',
                    border: 'border-yellow-600/50',
                    input: 'bg-yellow-800/30 border-yellow-600/30 backdrop-blur-sm',
                    button: 'bg-yellow-600 hover:bg-yellow-700',
                    buttonSecondary: 'bg-yellow-700/30 hover:bg-yellow-600/30 text-yellow-200',
                    shadow: 'shadow-2xl shadow-yellow-500/20'
                };
            default:
                return {
                    bg: 'bg-gray-800/95 backdrop-blur-lg',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    input: 'bg-gray-700/80 border-gray-600 backdrop-blur-sm',
                    button: 'bg-blue-500 hover:bg-blue-600',
                    buttonSecondary: 'bg-gray-600 hover:bg-gray-500 text-gray-200',
                    shadow: 'shadow-2xl'
                };
        }
    };

    const themeClasses = getThemeClasses();

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, postId, isDeSnap]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            setError("");
            
            const endpoint = isDeSnap 
                ? `/api/desnaps/${postId}/comments`
                : `/api/posts/${postId}/comments`;
            
            console.log('💬 Fetching comments from:', endpoint);
            
            const response = await apiFetch(endpoint, {}, user?.id);

            console.log('💬 Comments response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('💬 Comments fetched:', data.length || 0, 'comments');
                setComments(Array.isArray(data) ? data : []);
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to fetch comments:', response.status, errorText);
                setError(`Failed to load comments: ${response.status}`);
                setComments([]);
            }
        } catch (err) {
            console.error('❌ Error fetching comments:', err);
            setError('Failed to load comments. Please try again.');
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setError("");

        try {
            // Content moderation check (with error handling)
            let moderationPassed = true;
            try {
                console.log('CommentModal: Checking comment moderation...');
                const moderationResult = await contentModerationService.moderateText(newComment.trim());
                
                if (!moderationResult.isApproved) {
                    console.log('CommentModal: Comment moderation failed:', moderationResult.reason);
                    setError(`Comment not approved: ${moderationResult.reason}. ${moderationResult.suggestions?.join('. ')}`);
                    setIsSubmitting(false);
                    return;
                }
                
                console.log('CommentModal: Comment moderation passed');
            } catch (moderationError) {
                // If moderation service fails, log but continue (don't block comments)
                console.warn('CommentModal: Moderation service error, allowing comment:', moderationError);
                moderationPassed = true;
            }
            
            const endpoint = isDeSnap 
                ? `/api/desnaps/${postId}/comments`
                : `/api/posts/${postId}/comments`;
            const response = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    content: newComment.trim()
                })
            }, user?.id);

            if (response.ok) {
                const newCommentData = await response.json();
                setComments(prev => [newCommentData, ...prev]);
                setNewComment("");
                setError(""); // Clear any previous errors
            } else {
                let errorMessage = 'Failed to add comment';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, try to get text
                    try {
                        const errorText = await response.text();
                        errorMessage = errorText || `Server error: ${response.status}`;
                    } catch (textError) {
                        errorMessage = `Server error: ${response.status}`;
                    }
                }
                setError(errorMessage);
                console.error('Comment submission failed:', response.status, errorMessage);
            }
        } catch (err: any) {
            console.error('Error adding comment:', err);
            const errorMessage = err?.message || 'Failed to add comment. Please try again.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLikeComment = async (commentId: number) => {
        try {
            const response = await apiFetch(`/api/comments/${commentId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const updatedComment = await response.json();
                setComments(prev => prev.map(comment => 
                    comment.id === commentId 
                        ? { ...comment, likes: updatedComment.likes, isLiked: updatedComment.isLiked }
                        : comment
                ));
            }
        } catch (err) {
            console.error('Error liking comment:', err);
        }
    };

    const handleEditComment = async (commentId: number) => {
        if (!editContent.trim()) return;

        try {
            const response = await apiFetch(`/api/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: editContent.trim()
                })
            });

            if (response.ok) {
                const updatedComment = await response.json();
                setComments(prev => prev.map(comment => 
                    comment.id === commentId 
                        ? { ...comment, content: updatedComment.content }
                        : comment
                ));
                setEditingComment(null);
                setEditContent("");
            }
        } catch (err) {
            console.error('Error editing comment:', err);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const response = await apiFetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setComments(prev => prev.filter(comment => comment.id !== commentId));
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    const canEditOrDelete = (comment: Comment) => {
        return user && user.id === comment.user.id.toString();
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

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`${themeClasses.bg} rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border ${themeClasses.border} ${themeClasses.shadow}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-4 border-b ${themeClasses.border}`}>
                        <div>
                            <h2 className={`text-xl font-bold ${themeClasses.text}`}>{t("comments.title", "Comments")}</h2>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>@{postAuthor}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`w-8 h-8 rounded-full ${themeClasses.buttonSecondary} flex items-center justify-center transition-colors`}
                        >
                            <X className={`w-4 h-4 ${themeClasses.text}`} />
                        </button>
                    </div>

                    {/* Post Content */}
                    <div className={`p-4 border-b ${themeClasses.border} ${themeClasses.bg}`}>
                        <p className={`${themeClasses.text} text-sm`}>{postContent}</p>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto max-h-96">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center p-8 text-gray-400">
                                {t("comments.noComments", "No comments yet. Be the first to comment!")}
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                {comments.map((comment) => (
                                    <PremiumComment 
                                        key={comment.id} 
                                        subscriptionTier={comment.user.subscriptionTier}
                                        className="flex space-x-3"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {comment.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-semibold text-white text-sm">{comment.user.name}</span>
                                                <PremiumUserIndicator 
                                                    subscriptionTier={comment.user.subscriptionTier}
                                                    size="sm"
                                                />
                                                <span className="text-gray-400 text-xs">@{comment.user.username}</span>
                                                <span className="text-gray-500 text-xs">{formatTimeAgo(comment.createdAt)}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={() => handleLikeComment(comment.id)}
                                                    className={`flex items-center space-x-1 text-xs transition-colors ${
                                                        comment.isLiked 
                                                            ? 'text-pink-500' 
                                                            : 'text-gray-400 hover:text-pink-500'
                                                    }`}
                                                >
                                                    <Heart size={14} fill={comment.isLiked ? 'currentColor' : 'none'} />
                                                    <span>{comment.likes}</span>
                                                </button>
                                                <button className="flex items-center space-x-1 text-xs text-gray-400 hover:text-blue-500 transition-colors">
                                                    <Reply size={14} />
                                                    <span>{t("comments.reply", "Reply")}</span>
                                                </button>
                                                {canEditOrDelete(comment) && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditingComment(comment.id);
                                                                setEditContent(comment.content);
                                                            }}
                                                            className="text-gray-400 hover:text-blue-500 transition-colors"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                <button className="text-gray-400 hover:text-white transition-colors">
                                                    <MoreHorizontal size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </PremiumComment>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Edit Comment Form */}
                    {editingComment && (
                        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                            <div className="flex space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 flex space-x-2">
                                    <input
                                        type="text"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        placeholder={t("comments.editPlaceholder", "Edit your comment...")}
                                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm"
                                    />
                                    <button
                                        onClick={() => handleEditComment(editingComment)}
                                        className="px-4 py-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors flex items-center space-x-1"
                                    >
                                        <Send size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingComment(null);
                                            setEditContent("");
                                        }}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-500 transition-colors"
                                    >
                                        {t("action.cancel")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Comment Form */}
                    <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                        <form onSubmit={handleSubmitComment} className="flex space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 flex space-x-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={t("comments.addPlaceholder", "Add a comment...")}
                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="px-4 py-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                        {error && (
                            <div className="text-red-400 text-sm mt-2 text-center">{error}</div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
