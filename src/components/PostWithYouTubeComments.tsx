"use client";
import React, { useState } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiFetch } from "@/lib/api";
import YouTubeStyleComments from "./YouTubeStyleComments";
import CommentModal from "./CommentModal";

interface Post {
    id: number;
    content: string;
    title?: string;
    createdAt: string;
    author: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
    };
    likes: number;
    comments: number;
    isLiked?: boolean;
    imageUrl?: string;
    videoUrl?: string;
}

interface PostWithYouTubeCommentsProps {
    post: Post;
    onPostUpdated?: (updatedPost: Post) => void;
    onPostDeleted?: (postId: number) => void;
}

export default function PostWithYouTubeComments({ post, onPostUpdated, onPostDeleted }: PostWithYouTubeCommentsProps) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showYouTubeComments, setShowYouTubeComments] = useState(false);
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [likesCount, setLikesCount] = useState(post.likes);
    const [commentsCount, setCommentsCount] = useState(post.comments);

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-white',
                    card: 'bg-white',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-50',
                    input: 'bg-white border-gray-300'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-50',
                    card: 'bg-white',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-100',
                    hover: 'hover:bg-gray-100',
                    input: 'bg-white border-gray-200'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    input: 'bg-gray-700 border-gray-600'
                };
            case 'super-dark':
                return {
                    bg: 'bg-black',
                    card: 'bg-gray-900',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800',
                    hover: 'hover:bg-gray-800',
                    input: 'bg-gray-800 border-gray-700'
                };
            case 'gold':
                return {
                    bg: 'bg-gradient-to-br from-yellow-900 to-yellow-800',
                    card: 'bg-gradient-to-br from-yellow-800 to-yellow-700',
                    text: 'text-yellow-100',
                    textSecondary: 'text-yellow-200',
                    border: 'border-yellow-600/50',
                    hover: 'hover:bg-yellow-800/80 gold-shimmer',
                    input: 'bg-yellow-800/50 border-yellow-600/50 focus:border-yellow-400'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    input: 'bg-gray-700 border-gray-600'
                };
        }
    };

    const themeClasses = getThemeClasses();

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const handleLike = async () => {
        try {
            const response = await apiFetch(`/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setIsLiked(data.isLiked);
                setLikesCount(data.likes);
            }
        } catch (err) {
            console.error('Error liking post:', err);
        }
    };

    const handleDeletePost = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await apiFetch(`/api/posts/${post.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                onPostDeleted?.(post.id);
            }
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    };

    const canEditOrDelete = () => {
        return user && user.id === post.author.id.toString();
    };

    const handleProfileClick = () => {
        window.location.href = `/profile?userId=${post.author.id}`;
    };

    return (
        <div className={`${themeClasses.card} rounded-lg shadow-md border ${themeClasses.border} overflow-hidden mb-4`}>
            {/* Post Header */}
            <div className={`p-4 border-b ${themeClasses.border}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleProfileClick}
                            className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold hover:scale-105 transition-transform cursor-pointer"
                        >
                            {post.author.name.charAt(0).toUpperCase()}
                        </button>
                        <div>
                            <button
                                onClick={handleProfileClick}
                                className={`font-semibold ${themeClasses.text} hover:underline cursor-pointer`}
                            >
                                {post.author.name}
                            </button>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>
                                @{post.author.username} • {formatTimeAgo(post.createdAt)}
                            </p>
                        </div>
                    </div>
                    
                    {canEditOrDelete() && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleDeletePost}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                title="Delete post"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button className="p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>
                    )}
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
                            onClick={handleLike}
                            className={`flex items-center space-x-2 transition-colors ${
                                isLiked 
                                    ? 'text-red-500' 
                                    : `${themeClasses.textSecondary} hover:text-red-500`
                            }`}
                        >
                            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                            <span className="text-sm font-medium">{likesCount}</span>
                        </button>
                        
                        <button
                            onClick={() => setShowCommentModal(true)}
                            className={`flex items-center space-x-2 ${themeClasses.textSecondary} hover:text-blue-500 transition-colors`}
                        >
                            <MessageCircle size={20} />
                            <span className="text-sm font-medium">{commentsCount}</span>
                        </button>
                        
                        <button
                            onClick={() => setShowYouTubeComments(!showYouTubeComments)}
                            className={`flex items-center space-x-2 transition-colors ${
                                showYouTubeComments 
                                    ? 'text-green-500' 
                                    : `${themeClasses.textSecondary} hover:text-green-500`
                            }`}
                        >
                            <MessageCircle size={20} />
                            <span className="text-sm font-medium">Live Comments</span>
                        </button>
                        
                        <button className={`flex items-center space-x-2 ${themeClasses.textSecondary} hover:text-green-500 transition-colors`}>
                            <Share size={20} />
                            <span className="text-sm font-medium">Share</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* YouTube Style Comments */}
            {showYouTubeComments && (
                <YouTubeStyleComments
                    postId={post.id}
                    postContent={post.content}
                    postAuthor={post.author.username}
                    isVisible={showYouTubeComments}
                />
            )}

            {/* Comment Modal */}
            <CommentModal
                isOpen={showCommentModal}
                onClose={() => setShowCommentModal(false)}
                postId={post.id}
                postContent={post.content}
                postAuthor={post.author.username}
            />
        </div>
    );
}
