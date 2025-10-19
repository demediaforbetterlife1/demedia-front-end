"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Eye, Clock, Users, Globe, Lock } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

interface Story {
    id: number;
    content: string;
    author: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
    };
    createdAt: string;
    expiresAt: string;
    views: number;
    type: 'image' | 'video';
    visibility?: 'public' | 'followers' | 'close_friends';
}

interface StoryViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    stories: Story[];
    currentStoryIndex: number;
    onStoryChange?: (index: number) => void;
}

const visibilityIcons = {
    public: { icon: Globe, color: "text-green-500", label: "Public" },
    followers: { icon: Users, color: "text-blue-500", label: "Followers" },
    close_friends: { icon: Lock, color: "text-purple-500", label: "Close Friends" }
};

export default function StoryViewerModal({ 
    isOpen, 
    onClose, 
    stories, 
    currentStoryIndex, 
    onStoryChange 
}: StoryViewerModalProps) {
    const { t } = useI18n();
    const [currentIndex, setCurrentIndex] = useState(currentStoryIndex);
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    const currentStory = stories[currentIndex];

    useEffect(() => {
        setCurrentIndex(currentStoryIndex);
    }, [currentStoryIndex]);

    useEffect(() => {
        if (!isOpen || !currentStory) return;

        const duration = 5000; // 5 seconds per story
        const interval = 100; // Update progress every 100ms
        const increment = (interval / duration) * 100;

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + increment;
            });
        }, interval);

        return () => clearInterval(progressInterval);
    }, [isOpen, currentStory, isPlaying]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            setProgress(0);
            onStoryChange?.(newIndex);
        } else {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            setProgress(0);
            onStoryChange?.(newIndex);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrevious();
        if (e.key === 'Escape') onClose();
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    if (!isOpen || !currentStory) return null;

    const VisibilityIcon = visibilityIcons[currentStory.visibility || 'public'].icon;
    const visibilityColor = visibilityIcons[currentStory.visibility || 'public'].color;
    const visibilityLabel = visibilityIcons[currentStory.visibility || 'public'].label;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-50 flex items-center justify-center"
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                {/* Background overlay */}
                <div 
                    className="absolute inset-0 bg-black/80"
                    onClick={onClose}
                />

                {/* Story content */}
                <div className="relative w-full h-full max-w-md mx-auto flex flex-col">
                    {/* Progress bars */}
                    <div className="absolute top-4 left-4 right-4 z-10 flex space-x-1">
                        {stories.map((_, index) => (
                            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full bg-white transition-all duration-100 ${
                                        index < currentIndex ? 'w-full' : 
                                        index === currentIndex ? 'w-full' : 'w-0'
                                    }`}
                                    style={{
                                        width: index === currentIndex ? `${progress}%` : 
                                               index < currentIndex ? '100%' : '0%'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600">
                                {currentStory.author.profilePicture ? (
                                    <img 
                                        src={currentStory.author.profilePicture} 
                                        alt={currentStory.author.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                        {currentStory.author.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">
                                    {currentStory.author.name}
                                </p>
                                <div className="flex items-center space-x-2 text-white/70 text-xs">
                                    <Clock size={12} />
                                    <span>{formatTimeAgo(currentStory.createdAt)}</span>
                                    <VisibilityIcon size={12} className={visibilityColor} />
                                    <span>{visibilityLabel}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Story content */}
                    <div className="flex-1 flex items-center justify-center p-4">
                        {currentStory.content.startsWith('http') ? (
                            <img 
                                src={currentStory.content} 
                                alt="Story"
                                className="max-w-full max-h-full object-contain rounded-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                                <p className="text-white text-lg leading-relaxed">
                                    {currentStory.content}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="absolute inset-y-0 left-0 right-0 flex">
                        {/* Previous area */}
                        <div 
                            className="flex-1 cursor-pointer"
                            onClick={handlePrevious}
                        />
                        {/* Next area */}
                        <div 
                            className="flex-1 cursor-pointer"
                            onClick={handleNext}
                        />
                    </div>

                    {/* Navigation buttons */}
                    {currentIndex > 0 && (
                        <button
                            onClick={handlePrevious}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    
                    {currentIndex < stories.length - 1 && (
                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}

                    {/* Story info */}
                    <div className="absolute bottom-4 left-4 right-4 z-10">
                        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center justify-between text-white text-sm">
                                <div className="flex items-center space-x-2">
                                    <Eye size={16} />
                                    <span>{currentStory.views} views</span>
                                </div>
                                <div className="text-white/70">
                                    {currentIndex + 1} of {stories.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
