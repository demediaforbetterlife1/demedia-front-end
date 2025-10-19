"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, MoreHorizontal, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

interface Story {
    id: number;
    content: string;
    createdAt: string;
    expiresAt: string;
    views: number;
    user: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
    };
}

interface StoryCardProps {
    story: Story;
    onStoryDeleted?: (storyId: number) => void;
}

export default function StoryCard({ story, onStoryDeleted }: StoryCardProps) {
    const { user } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const handleDeleteStory = async () => {
        if (!confirm('Are you sure you want to delete this story?')) return;

        setIsDeleting(true);
        try {
            const response = await apiFetch(`/api/stories/${story.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                onStoryDeleted?.(story.id);
            } else {
                alert('Failed to delete story');
            }
        } catch (err) {
            console.error('Error deleting story:', err);
            alert('Failed to delete story');
        } finally {
            setIsDeleting(false);
        }
    };

    const canDelete = () => {
        return user && user.id === story.user.id.toString();
    };

    const isExpired = () => {
        return new Date(story.expiresAt) < new Date();
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl border border-gray-700 shadow-2xl overflow-hidden ${
                isExpired() ? 'opacity-60' : ''
            }`}
        >
            {/* Story Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {story.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">{story.user.name}</h3>
                            <p className="text-sm text-gray-400">
                                @{story.user.username} • {formatTimeAgo(story.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Story Menu */}
                    {canDelete() && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <MoreHorizontal size={16} />
                            </button>
                            
                            {showMenu && (
                                <div className="absolute right-0 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-48">
                                    <button
                                        onClick={handleDeleteStory}
                                        disabled={isDeleting}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-red-400 disabled:opacity-50"
                                    >
                                        <Trash2 size={16} />
                                        {isDeleting ? 'Deleting...' : 'Delete Story'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Story Content */}
            <div className="p-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {story.content}
                    </p>
                </div>
            </div>

            {/* Story Footer */}
            <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-gray-400">
                            <Eye size={14} />
                            <span className="text-xs">{story.views} views</span>
                        </div>
                        {isExpired() && (
                            <span className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded-full">
                                Expired
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                        Expires {formatTimeAgo(story.expiresAt)}
                    </div>
                </div>
            </div>

            {/* Expired Overlay */}
            {isExpired() && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-400 text-sm font-semibold mb-1">Story Expired</div>
                        <div className="text-gray-400 text-xs">This story has expired</div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
