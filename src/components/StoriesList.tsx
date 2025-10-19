"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import StoryCard from "./StoryCard";

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

export default function StoriesList() {
    const { user } = useAuth();
    const [stories, setStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            setIsLoading(true);
            const response = await apiFetch('/api/stories');
            
            if (response.ok) {
                const data = await response.json();
                setStories(data);
            } else {
                console.error('Failed to fetch stories');
            }
        } catch (err) {
            console.error('Error fetching stories:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStoryDeleted = (storyId: number) => {
        setStories(prev => prev.filter(story => story.id !== storyId));
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
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock size={16} />
                    <span>Stories expire after 24 hours</span>
                </div>
            </div>

            {stories.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400 mb-4">
                        <Plus size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No stories yet</p>
                        <p className="text-sm">Create your first story to get started!</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {stories.map((story) => (
                            <StoryCard
                                key={story.id}
                                story={story}
                                onStoryDeleted={handleStoryDeleted}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
