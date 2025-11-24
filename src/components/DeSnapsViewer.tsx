"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeDeSnap } from "@/utils/desnapUtils";

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
    const { user } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLiked, setIsLiked] = useState(deSnap.isLiked || false);
    const [isBookmarked, setIsBookmarked] = useState(deSnap.isBookmarked || false);
    const [likes, setLikes] = useState(deSnap.likes);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    const mergeAndEmitUpdate = useCallback((partial: Partial<DeSnap>) => {
        const merged = { ...deSnap, ...partial };
        const normalized = normalizeDeSnap(merged) || merged;
        onDeSnapUpdated?.(normalized as DeSnap);
        window.dispatchEvent(new CustomEvent('desnap:updated', {
            detail: { deSnap: normalized }
        }));
    }, [deSnap, onDeSnapUpdated]);

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
        mergeAndEmitUpdate({ isLiked: newLiked, likes: newLikes });

        // Send API request to like/unlike
        try {
            await apiFetch(`/api/desnaps/${deSnap.id}/like`, {
                method: 'POST',
                body: JSON.stringify({ liked: newLiked })
            }, user?.id);
        } catch (error) {
            console.error('Error updating like:', error);
        }
    };

    const handleBookmark = async () => {
        const newBookmarked = !isBookmarked;
        setIsBookmarked(newBookmarked);

        // Update the DeSnap
        mergeAndEmitUpdate({ isBookmarked: newBookmarked });

        // Send API request to bookmark/unbookmark
        try {
            await apiFetch(`/api/desnaps/${deSnap.id}/bookmark`, {
                method: 'POST',
                body: JSON.stringify({ bookmarked: newBookmarked })
            }, user?.id);
        } catch (error) {
            console.error('Error updating bookmark:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Fetch comments for this DeSnap
    const fetchComments = async () => {
        if (isLoadingComments) return;
        setIsLoadingComments(true);
        try {
            const response = await apiFetch(`/api/desnaps/${deSnap.id}/comments`, {
                method: 'GET'
            }, user?.id);
            if (response.ok) {
                const data = await response.json();
                setComments(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setIsLoadingComments(false);
        }
    };

    // Submit a comment
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        try {
            const response = await apiFetch(`/api/desnaps/${deSnap.id}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content: newComment.trim() }),
            }, user?.id);

            if (response.ok) {
                const newCommentData = await response.json();
                setComments(prev => [newCommentData, ...prev]);
                setNewComment("");
                // Update comment count
                mergeAndEmitUpdate({ comments: deSnap.comments + 1 });
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // Share DeSnap
    const handleShare = async () => {
        try {
            const shareUrl = `${window.location.origin}/desnaps/${deSnap.id}`;

            if (navigator.share) {
                await navigator.share({
                    title: 'Check out this DeSnap!',
                    text: 'Watch this DeSnap',
                    url: shareUrl,
                });
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    // Load comments when comments section is opened
    useEffect(() => {
        if (showComments && comments.length === 0) {
            fetchComments();
        }
    }, [showComments]);

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
                            src={deSnap.content.startsWith('http') || deSnap.content.startsWith('/') ? deSnap.content : `https://demedia-backend.fly.dev${deSnap.content}`}
                            className="w-full h-full object-cover"
                            muted={isMuted}
                            loop
                            playsInline
                            onClick={togglePlayPause}
                            onError={(e) => {
                                console.error('Video load error:', e);
                                // Try fallback URL only if it's not already a full URL or local path
                                const video = e.currentTarget;
                                if (!deSnap.content.startsWith('http') && !deSnap.content.startsWith('/')) {
                                    video.src = `https://demedia-backend.fly.dev${deSnap.content}`;
                                }
                            }}
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
                                    className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${isLiked ? 'bg-red-500/20' : 'bg-white/10 hover:bg-white/20'
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
                                    className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${isBookmarked ? 'bg-yellow-500/20' : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    <Bookmark
                                        size={24}
                                        className={isBookmarked ? "text-yellow-400 fill-current" : "text-white"}
                                    />
                                </button>

                                <button
                                    onClick={handleShare}
                                    className="flex flex-col items-center gap-1 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
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
                                className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-4 max-h-64 flex flex-col"
                            >
                                <h4 className="font-semibold mb-2 text-white text-sm">Comments ({comments.length})</h4>

                                {/* Comments list */}
                                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                                    {isLoadingComments ? (
                                        <p className="text-gray-400 text-sm">Loading comments...</p>
                                    ) : comments.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No comments yet. Be the first to comment!</p>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="text-white text-sm">
                                                <div className="flex items-start gap-2">
                                                    {comment.user?.profilePicture ? (
                                                        <img
                                                            src={comment.user.profilePicture}
                                                            alt={comment.user.name}
                                                            className="w-6 h-6 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                                                            <span className="text-xs">{comment.user?.name?.charAt(0) || 'U'}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <span className="font-semibold">{comment.user?.name || 'Unknown'}</span>
                                                        <span className="ml-2 text-gray-300">{comment.content}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Comment input */}
                                <form onSubmit={handleSubmitComment} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="flex-1 bg-white/10 text-white placeholder-gray-400 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                                        disabled={isSubmittingComment}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || isSubmittingComment}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        {isSubmittingComment ? '...' : 'Post'}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
