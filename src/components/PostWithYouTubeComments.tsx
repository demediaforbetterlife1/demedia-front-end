"use client";
import React, { useState } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showYouTubeComments, setShowYouTubeComments] = useState(false);
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [likesCount, setLikesCount] = useState(post.likes);
    const [commentsCount, setCommentsCount] = useState(post.comments);

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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
            {/* Post Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {post.author.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {post.author.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {post.title}
                    </h2>
                )}
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
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
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={handleLike}
                            className={`flex items-center space-x-2 transition-colors ${
                                isLiked 
                                    ? 'text-red-500' 
                                    : 'text-gray-500 hover:text-red-500'
                            }`}
                        >
                            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                            <span className="text-sm font-medium">{likesCount}</span>
                        </button>
                        
                        <button
                            onClick={() => setShowCommentModal(true)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
                        >
                            <MessageCircle size={20} />
                            <span className="text-sm font-medium">{commentsCount}</span>
                        </button>
                        
                        <button
                            onClick={() => setShowYouTubeComments(!showYouTubeComments)}
                            className={`flex items-center space-x-2 transition-colors ${
                                showYouTubeComments 
                                    ? 'text-green-500' 
                                    : 'text-gray-500 hover:text-green-500'
                            }`}
                        >
                            <MessageCircle size={20} />
                            <span className="text-sm font-medium">Live Comments</span>
                        </button>
                        
                        <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
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
