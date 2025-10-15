"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Reply, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
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

interface YouTubeStyleCommentsProps {
    postId: number;
    postContent: string;
    postAuthor: string;
    isVisible: boolean;
}

export default function YouTubeStyleComments({ 
    postId, 
    postContent, 
    postAuthor, 
    isVisible 
}: YouTubeStyleCommentsProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [currentCommentIndex, setCurrentCommentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        if (isVisible && postId) {
            fetchComments();
        }
    }, [isVisible, postId]);

    useEffect(() => {
        if (comments.length > 1) {
            const interval = setInterval(() => {
                setCurrentCommentIndex((prev) => (prev + 1) % comments.length);
            }, 3000); // Change comment every 3 seconds

            return () => clearInterval(interval);
        }
    }, [comments.length]);

    const fetchComments = async () => {
        try {
            setIsLoading(true);
            const response = await apiFetch(`/api/comments/${postId}`);

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
            setIsLoading(false);
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
                // Adjust current index if needed
                if (currentCommentIndex >= comments.length - 1) {
                    setCurrentCommentIndex(0);
                }
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
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

    const canEditOrDelete = (comment: Comment) => {
        return user && user.id === comment.user.id.toString();
    };

    if (!isVisible || comments.length === 0) {
        return null;
    }

    const currentComment = comments[currentCommentIndex];

    return (
        <div className="fixed bottom-4 right-4 w-80 max-w-sm z-40">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl border border-gray-700 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-3 border-b border-gray-700 bg-gray-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white">Live Comments</h3>
                            <p className="text-xs text-gray-400">@{postAuthor}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-400">{comments.length} comments</span>
                        </div>
                    </div>
                </div>

                {/* Current Comment Display */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentCommentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="p-3"
                    >
                        <PremiumComment 
                            subscriptionTier={currentComment.user.subscriptionTier}
                            className="flex space-x-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {currentComment.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-white text-sm truncate">
                                        {currentComment.user.name}
                                    </span>
                                    <PremiumUserIndicator 
                                        subscriptionTier={currentComment.user.subscriptionTier}
                                        size="sm"
                                    />
                                    <span className="text-gray-400 text-xs truncate">
                                        @{currentComment.user.username}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                        {formatTimeAgo(currentComment.createdAt)}
                                    </span>
                                </div>
                                <p className="text-gray-300 text-sm mb-2 line-clamp-3">
                                    {currentComment.content}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => handleLikeComment(currentComment.id)}
                                            className={`flex items-center space-x-1 text-xs transition-colors ${
                                                currentComment.isLiked 
                                                    ? 'text-pink-500' 
                                                    : 'text-gray-400 hover:text-pink-500'
                                            }`}
                                        >
                                            <Heart size={12} fill={currentComment.isLiked ? 'currentColor' : 'none'} />
                                            <span>{currentComment.likes}</span>
                                        </button>
                                        <button className="flex items-center space-x-1 text-xs text-gray-400 hover:text-blue-500 transition-colors">
                                            <Reply size={12} />
                                        </button>
                                    </div>
                                    
                                    {/* Edit/Delete buttons for comment author */}
                                    {canEditOrDelete(currentComment) && (
                                        <div className="flex items-center space-x-1">
                                            <button
                                                onClick={() => {
                                                    setEditingComment(currentComment.id);
                                                    setEditContent(currentComment.content);
                                                }}
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                            >
                                                <Edit size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteComment(currentComment.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </PremiumComment>
                    </motion.div>
                </AnimatePresence>

                {/* Edit Comment Modal */}
                {editingComment && (
                    <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm"
                                placeholder="Edit your comment..."
                            />
                            <button
                                onClick={() => handleEditComment(editingComment)}
                                className="px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setEditingComment(null);
                                    setEditContent("");
                                }}
                                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Comment Counter */}
                {comments.length > 1 && (
                    <div className="p-2 border-t border-gray-700 bg-gray-900/50">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="flex space-x-1">
                                {comments.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                            index === currentCommentIndex 
                                                ? 'bg-cyan-400' 
                                                : 'bg-gray-600'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-gray-400">
                                {currentCommentIndex + 1} of {comments.length}
                            </span>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}