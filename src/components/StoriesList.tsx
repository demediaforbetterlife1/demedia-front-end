"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import StoryCard from "./StoryCard";

interface Story {
    id: number;
    content: string;
    createdAt: string;
    expiresAt: string;
    views: number;
    visibility: 'public' | 'followers' | 'close_friends' | 'only_me';
    durationHours: number;
    user: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
    };
}

export default function StoriesList() {
    const { user } = useAuth();
    const [stories, setStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    useEffect(() => {
        fetchStories();
        
        // Auto-refresh every minute to check for expired stories
        const interval = setInterval(() => {
            filterExpiredStories();
            setLastRefresh(Date.now());
        }, 60000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchStories = async () => {
        try {
            setIsLoading(true);
            // Fetch only stories from people the user is following
            const response = await apiFetch('/api/stories?view=following');
            
            if (response.ok) {
                const data = await response.json();
                const validStories = filterExpiredStoriesFromData(data);
                setStories(validStories);
            } else {
                console.error('Failed to fetch stories');
                setStories([]);
            }
        } catch (err) {
            console.error('Error fetching stories:', err);
            setStories([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filterExpiredStoriesFromData = (data: Story[]) => {
        const now = new Date();
        return data.filter(story => {
            if (!story.expiresAt) return true;
            const expiresAt = new Date(story.expiresAt);
            return expiresAt > now;
        });
    };

    const filterExpiredStories = () => {
        setStories(prev => filterExpiredStoriesFromData(prev));
    };

    const handleStoryDeleted = (storyId: number) => {
        setStories(prev => prev.filter(story => story.id !== storyId));
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();
        
        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m left`;
        }
        return `${minutes}m left`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Stories</h2>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={fetchStories}
                        className="flex items-center space-x-2 text-sm text-gray-500 hover:text-cyan-500 transition-colors"
                    >
                        <RefreshCw size={16} />
                        <span>Refresh</span>
                    </button>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock size={16} />
                        <span>From people you follow</span>
                    </div>
                </div>
            </div>

            {stories.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400 mb-4">
                        <Plus size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No stories yet</p>
                        <p className="text-sm">Stories from people you follow will appear here</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {stories.map((story) => (
                            <motion.div
                                key={story.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="relative"
                            >
                                <StoryCard
                                    story={story}
                                    onStoryDeleted={handleStoryDeleted}
                                />
                                {story.expiresAt && (
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white">
                                        {getTimeRemaining(story.expiresAt)}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
