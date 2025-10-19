"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Play, 
    Pause, 
    Volume2, 
    VolumeX, 
    Heart, 
    MessageCircle, 
    Share, 
    Bookmark,
    Eye,
    Clock,
    Globe,
    Users,
    UserCheck,
    Sparkles,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

interface DeSnap {
    id: number;
    content: string;
    thumbnail?: string;
    createdAt: string;
    likes: number;
    comments: number;
    views: number;
    duration: number; // in seconds
    visibility: 'public' | 'followers' | 'close_friends' | 'premium';
    isLiked?: boolean;
    isBookmarked?: boolean;
}

interface DeSnapsViewerProps {
    isOpen: boolean;
    onClose: () => void;
    deSnap: DeSnap;
    onDeSnapUpdated?: (updatedDeSnap: DeSnap) => void;
}

const visibilityIcons = {
    public: { icon: Globe, color: "text-green-400", label: "Public" },
    followers: { icon: Users, color: "text-blue-400", label: "Followers" },
    close_friends: { icon: UserCheck, color: "text-purple-400", label: "Close Friends" },
    premium: { icon: Sparkles, color: "text-yellow-400", label: "Premium" }
};

export default function DeSnapsViewer({ isOpen, onClose, deSnap, onDeSnapUpdated }: DeSnapsViewerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLiked, setIsLiked] = useState(deSnap.isLiked || false);
    const [isBookmarked, setIsBookmarked] = useState(deSnap.isBookmarked || false);
    const [likes, setLikes] = useState(deSnap.likes);
    const [showComments, setShowComments] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            const video = videoRef.current;
            
            const handleTimeUpdate = () => {
                setCurrentTime(video.currentTime);
            };
            
            const handleEnded = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };
            
            video.addEventListener('timeupdate', handleTimeUpdate);
            video.addEventListener('ended', handleEnded);
            
            return () => {
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener('ended', handleEnded);
            };
        }
    }, []);

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current && progressRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const newTime = percentage * deSnap.duration;
            
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleLike = async () => {
        const newLiked = !isLiked;
        const newLikes = newLiked ? likes + 1 : likes - 1;
        
        setIsLiked(newLiked);
        setLikes(newLikes);
        
        // Update the DeSnap
        const updatedDeSnap = { ...deSnap, isLiked: newLiked, likes: newLikes };
        onDeSnapUpdated?.(updatedDeSnap);
        
        // TODO: Send API request to like/unlike
        try {
            await fetch(`/api/desnaps/${deSnap.id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ liked: newLiked })
            });
        } catch (error) {
            console.error('Error updating like:', error);
        }
    };

    const handleBookmark = async () => {
        const newBookmarked = !isBookmarked;
        setIsBookmarked(newBookmarked);
        
        // Update the DeSnap
        const updatedDeSnap = { ...deSnap, isBookmarked: newBookmarked };
        onDeSnapUpdated?.(updatedDeSnap);
        
        // TODO: Send API request to bookmark/unbookmark
        try {
            await fetch(`/api/desnaps/${deSnap.id}/bookmark`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ bookmarked: newBookmarked })
            });
        } catch (error) {
            console.error('Error updating bookmark:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (currentTime / deSnap.duration) * 100;
    const VisibilityIcon = visibilityIcons[deSnap.visibility].icon;
    const visibilityColor = visibilityIcons[deSnap.visibility].color;
    const visibilityLabel = visibilityIcons[deSnap.visibility].label;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            >
                {/* Background overlay */}
                <div 
                    className="absolute inset-0 bg-black/90"
                    onClick={onClose}
                />

                {/* DeSnap content */}
                <div className="relative w-full h-full max-w-md mx-auto flex flex-col">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Video container */}
                    <div className="flex-1 flex items-center justify-center relative">
                        <video
                            ref={videoRef}
                            src={deSnap.content}
                            className="w-full h-full object-cover"
                            muted={isMuted}
                            loop
                            onClick={togglePlayPause}
                        />
                        
                        {/* Play/Pause overlay */}
                        <div 
                            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={togglePlayPause}
                        >
                            {isPlaying ? (
                                <Pause size={64} className="text-white" />
                            ) : (
                                <Play size={64} className="text-white" />
                            )}
                        </div>

                        {/* Video controls */}
                        <div className="absolute bottom-4 left-4 right-4 z-10">
                            {/* Progress bar */}
                            <div 
                                ref={progressRef}
                                className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-2"
                                onClick={handleProgressClick}
                            >
                                <div 
                                    className="h-full bg-white rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Time and controls */}
                            <div className="flex items-center justify-between text-white text-sm">
                                <div className="flex items-center gap-4">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>/</span>
                                    <span>{formatTime(deSnap.duration)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleMute}
                                        className="hover:bg-white/20 rounded-full p-1 transition-colors"
                                    >
                                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DeSnap info and actions */}
                    <div className="absolute bottom-20 left-4 right-4 z-10">
                        <div className="flex items-center justify-between">
                            {/* Left side - Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <VisibilityIcon size={16} className={visibilityColor} />
                                    <span className="text-white text-sm">{visibilityLabel}</span>
                                </div>
                                
                                <div className="flex items-center gap-4 text-white text-sm">
                                    <span className="flex items-center gap-1">
                                        <Eye size={14} />
                                        {deSnap.views} views
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {formatTime(deSnap.duration)}
                                    </span>
                                </div>
                            </div>

                            {/* Right side - Actions */}
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleLike}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
                                        isLiked ? 'bg-red-500/20' : 'bg-white/10 hover:bg-white/20'
                                    }`}
                                >
                                    <Heart 
                                        size={24} 
                                        className={isLiked ? "text-red-400 fill-current" : "text-white"} 
                                    />
                                    <span className="text-white text-xs">{likes}</span>
                                </button>

                                <button
                                    onClick={() => setShowComments(!showComments)}
                                    className="flex flex-col items-center gap-1 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <MessageCircle size={24} className="text-white" />
                                    <span className="text-white text-xs">{deSnap.comments}</span>
                                </button>

                                <button
                                    onClick={handleBookmark}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
                                        isBookmarked ? 'bg-yellow-500/20' : 'bg-white/10 hover:bg-white/20'
                                    }`}
                                >
                                    <Bookmark 
                                        size={24} 
                                        className={isBookmarked ? "text-yellow-400 fill-current" : "text-white"} 
                                    />
                                </button>

                                <button className="flex flex-col items-center gap-1 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                    <Share size={24} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Comments section */}
                    <AnimatePresence>
                        {showComments && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-4 max-h-64 overflow-y-auto"
                            >
                                <div className="text-white text-sm">
                                    <h4 className="font-semibold mb-2">Comments</h4>
                                    <div className="space-y-2">
                                        <p className="text-gray-400">No comments yet. Be the first to comment!</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
