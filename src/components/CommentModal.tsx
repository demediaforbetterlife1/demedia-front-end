"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Heart, Reply, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    user: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
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
}

export default function CommentModal({ isOpen, onClose, postId, postContent, postAuthor }: CommentModalProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, postId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await apiFetch(`/api/posts/${postId}/comments`);

            if (response.ok) {
                const data = await response.json();
                setComments(data);
            } else {
                console.error('Failed to fetch comments:', response.status);
                setComments([]);
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
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
            const response = await apiFetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: newComment.trim()
                })
            });

            if (response.ok) {
                const newCommentData = await response.json();
                setComments(prev => [newCommentData, ...prev]);
                setNewComment("");
            } else {
                let errorMessage = 'Failed to add comment';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `Server error: ${response.status}`;
                }
                setError(errorMessage);
            }
        } catch (err) {
            console.error('Error adding comment:', err);
            setError('Failed to add comment');
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
                    className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <div>
                            <h2 className="text-xl font-bold text-white">Comments</h2>
                            <p className="text-sm text-gray-400">@{postAuthor}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    {/* Post Content */}
                    <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                        <p className="text-white text-sm">{postContent}</p>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto max-h-96">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center p-8 text-gray-400">
                                No comments yet. Be the first to comment!
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {comment.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-semibold text-white text-sm">{comment.user.name}</span>
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
                                                    <span>Reply</span>
                                                </button>
                                                <button className="text-gray-400 hover:text-white transition-colors">
                                                    <MoreHorizontal size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

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
                                    placeholder="Add a comment..."
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
