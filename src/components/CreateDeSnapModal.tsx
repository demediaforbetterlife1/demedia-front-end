"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Video, 
    Upload, 
    Play, 
    Pause, 
    Volume2, 
    VolumeX, 
    Globe, 
    Users, 
    UserCheck, 
    Sparkles,
    Clock,
    Eye,
    Settings,
    Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, getAuthHeaders, getToken } from "@/lib/api";
import { contentModerationService } from "@/services/contentModeration";
import AIFeatures from "./AIFeatures";
import CollaborativeFeatures from "./CollaborativeFeatures";
import GamificationSystem from "./GamificationSystem";
import AdvancedVisibilityControls from "./AdvancedVisibilityControls";
import { ensureAbsoluteMediaUrl } from "@/utils/mediaUtils";
import { normalizeDeSnap } from "@/utils/desnapUtils";

interface CreateDeSnapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeSnapCreated?: (deSnap: any) => void;
}

interface DeSnapSettings {
    visibility: 'public' | 'followers' | 'close_friends' | 'premium';
    allowComments: boolean;
    allowLikes: boolean;
    showViewCount: boolean;
    autoPlay: boolean;
}

const visibilityOptions = [
    {
        id: "public",
        name: "Public",
        description: "Anyone can see your DeSnap",
        icon: Globe,
        color: "text-green-500",
        bgColor: "bg-green-500/10"
    },
    {
        id: "followers",
        name: "Followers",
        description: "Only your followers can see",
        icon: Users,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10"
    },
    {
        id: "close_friends",
        name: "Close Friends",
        description: "Only close friends can see",
        icon: UserCheck,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10"
    },
    {
        id: "premium",
        name: "Premium",
        description: "Premium followers only",
        icon: Sparkles,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10"
    }
];

export default function CreateDeSnapModal({ isOpen, onClose, onDeSnapCreated }: CreateDeSnapModalProps) {
    const { user } = useAuth();
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>("");
    const [thumbnail, setThumbnail] = useState<string>("");
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"upload" | "settings" | "ai" | "collaborate" | "gamify" | "visibility">("upload");
    
    const [settings, setSettings] = useState<DeSnapSettings>({
        visibility: "public",
        allowComments: true,
        allowLikes: true,
        showViewCount: true,
        autoPlay: true
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setVideoFile(null);
            setVideoUrl("");
            setThumbnail("");
            setDuration(0);
            setIsPlaying(false);
            setError("");
            setActiveTab("upload");
            setSettings({
                visibility: "public",
                allowComments: true,
                allowLikes: true,
                showViewCount: true,
                autoPlay: true
            });
        }
    }, [isOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            setError("Please select a video file");
            return;
        }

        // Check file size (100MB limit)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            setError(`Video file too large (${fileSizeMB}MB). Maximum size is 100MB. Please compress your video or choose a shorter clip.`);
            return;
        }

        // Warn if file is large (over 50MB)
        if (file.size > 50 * 1024 * 1024) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            console.warn(`Large video file detected: ${fileSizeMB}MB. Upload may take longer.`);
        }

        // Content moderation check
        console.log('CreateDeSnapModal: Checking video content moderation...');
        const moderationResult = await contentModerationService.moderateVideo(file);
        
        if (!moderationResult.isApproved) {
            console.log('CreateDeSnapModal: Video moderation failed:', moderationResult.reason);
            setError(`Video not approved: ${moderationResult.reason}. ${moderationResult.suggestions?.join('. ')}`);
            return;
        }
        
        console.log('CreateDeSnapModal: Video moderation passed');

        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        setError("");

        // Generate thumbnail
        const video = document.createElement('video');
        video.src = url;
        video.currentTime = 1; // Capture frame at 1 second
        video.onloadedmetadata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const thumbnailUrl = canvas.toDataURL('image/jpeg');
                setThumbnail(thumbnailUrl);
            }
            setDuration(video.duration);
        };
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('🎬 ========== DESNAP UPLOAD STARTED ==========');
        console.log('📋 Video file check:', {
            hasFile: !!videoFile,
            fileName: videoFile?.name,
            fileSize: videoFile?.size,
            fileSizeMB: videoFile ? (videoFile.size / (1024 * 1024)).toFixed(2) : 0,
            fileType: videoFile?.type
        });
        
        if (!videoFile) {
            setError("Please select a video file");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('thumbnail', thumbnail);
            formData.append('duration', duration.toString());
            formData.append('visibility', settings.visibility);

            let token = getToken();
            if (!token) {
                token = localStorage.getItem('token') || 
                        document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null;
            }
            
            if (!token) {
                throw new Error("You must be logged in to create a DeSnap. Please log in and try again.");
            }

            // Add only userId to FormData; send token in Authorization header
            formData.append('userId', user?.id?.toString() || '');

            let videoUrl, thumbnailUrl;
            
            try {
                // POST directly to backend to avoid the API route altering request
                const uploadResponse = await fetch('https://demedia-backend.fly.dev/api/upload/video', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'user-id': user?.id?.toString() || '',
                    },
                    body: formData,
                    mode: 'cors',
                    credentials: 'include',
                });
                
                const uploadResponseText = await uploadResponse.text();

                if (!uploadResponse.ok) {
                    let errorMessage = "Failed to upload video";
                    
                    try {
                        if (uploadResponseText.trim() && uploadResponseText.trim().startsWith('{')) {
                            const errorData = JSON.parse(uploadResponseText);
                            errorMessage = errorData.details || errorData.error || errorData.message || errorMessage;
                        }
                    } catch (e) {
                        if (uploadResponse.status === 413) {
                            errorMessage = "Video file is too large. Please compress your video or choose a shorter clip (max 100MB).";
                        } else if (uploadResponse.status === 401) {
                            errorMessage = "Authentication failed. Please log in again.";
                        } else if (uploadResponse.status === 400) {
                            errorMessage = "Invalid upload request. Please check your video file.";
                        }
                    }
                    
                    throw new Error(errorMessage);
                }

                const uploadData = JSON.parse(uploadResponseText);
                videoUrl = uploadData.videoUrl || uploadData.url || uploadData.fileUrl;
                
                if (!videoUrl) {
                    throw new Error('Video upload succeeded but no URL was returned.');
                }
                
                videoUrl = ensureAbsoluteMediaUrl(videoUrl) || videoUrl;
                thumbnailUrl = uploadData.thumbnailUrl || uploadData.thumbnail || uploadData.previewUrl || videoUrl;
                thumbnailUrl = ensureAbsoluteMediaUrl(thumbnailUrl) || thumbnailUrl || videoUrl;
                
            } catch (uploadError: any) {
                if (uploadError.name === 'AbortError') {
                    throw new Error("Upload timed out. Your video might be too large or your connection is slow.");
                }
                throw uploadError;
            }

            // Now create the DeSnap with the uploaded video URL
            const deSnapData = {
                content: videoUrl,
                thumbnail: thumbnailUrl || videoUrl,
                duration: duration,
                visibility: settings.visibility,
                userId: user?.id
            };

            console.log('📝 Creating DeSnap with data:', {
                hasContent: !!deSnapData.content,
                hasThumbnail: !!deSnapData.thumbnail,
                duration: deSnapData.duration,
                visibility: deSnapData.visibility,
                userId: deSnapData.userId
            });
            
            // Use apiFetch which automatically includes proper authentication headers
            // Don't manually add headers - apiFetch handles them
            const response = await apiFetch("/api/desnaps", {
                method: "POST",
                body: JSON.stringify(deSnapData)
            }, user?.id);

            console.log('DeSnap creation response status:', response.status);

            // Read response text ONCE
            const responseText = await response.text();
            console.log('DeSnap creation response text:', responseText.substring(0, 200));

            if (!response.ok) {
                let errorMessage = "Failed to create DeSnap";
                console.error('DeSnap creation error response:', responseText);
                
                try {
                    if (responseText.trim().startsWith('{')) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
                    } else {
                        errorMessage = `Server error: ${response.status} - ${responseText}`;
                    }
                } catch (e) {
                    errorMessage = `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            // Parse DeSnap response
            let newDeSnap;
            
            if (!responseText.trim()) {
                throw new Error('Empty response from server');
            }
            
            if (responseText.trim().startsWith('<')) {
                throw new Error('Server returned HTML error page. Please check your connection.');
            }
            
            if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
                throw new Error('Server returned non-JSON response. Please try again.');
            }
            
            try {
                newDeSnap = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                throw new Error('Server returned invalid JSON. Please try again.');
            }
            
            const normalizedDeSnap = normalizeDeSnap({
                ...newDeSnap,
                content: videoUrl,
                thumbnail: thumbnailUrl || videoUrl,
            }) || {
                ...newDeSnap,
                content: videoUrl,
                thumbnail: thumbnailUrl || videoUrl,
            };

            console.log('✅ DeSnap created successfully!');

            if (onDeSnapCreated) {
                onDeSnapCreated(normalizedDeSnap);
            }
            window.dispatchEvent(new CustomEvent('desnap:created', {
                detail: { deSnap: normalizedDeSnap }
            }));

            onClose();
        } catch (err: unknown) {
            console.error('❌ DeSnap creation error:', err);
            
            // Handle specific error types
            let errorMessage = "Failed to create DeSnap";
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    errorMessage = "Upload timed out. Your video might be too large or your connection is slow. Try a smaller video or check your internet connection.";
                } else {
                    errorMessage = err.message;
                }
            }
            
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gradient-to-b from-black via-purple-950 to-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-gradient-to-br from-slate-950 via-purple-950 to-black rounded-none sm:rounded-3xl p-0 w-full sm:max-w-4xl max-h-[100dvh] sm:max-h-[90vh] overflow-hidden border sm:border-2 border-cyan-500/30 shadow-2xl"
                    style={{
                      boxShadow: '0 0 60px rgba(34,211,238,0.15), 0 0 120px rgba(168,85,247,0.1), inset 0 0 60px rgba(59,130,246,0.05)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 via-transparent to-cyan-900/10 pointer-events-none" />
                    
                    {/* Header */}
                    <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 border-b border-cyan-500/20 bg-gradient-to-r from-slate-950 via-purple-950/50 to-slate-950 safe-area-inset">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full flex items-center justify-center animate-pulse"
                              style={{
                                boxShadow: '0 0 20px rgba(34,211,238,0.6), 0 0 40px rgba(59,130,246,0.3)'
                              }}>
                                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">Create DeSnap</h2>
                                <p className="text-xs sm:text-sm text-cyan-400/60 hidden xs:block">Share your cosmic moment</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 hover:from-purple-500/50 hover:to-cyan-500/50 flex items-center justify-center transition-all duration-300 touch-target border border-cyan-500/30"
                            style={{
                              boxShadow: 'inset 0 0 15px rgba(34,211,238,0.2)'
                            }}
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-cyan-500/20 overflow-x-auto scrollbar-hide bg-gradient-to-r from-slate-950/50 via-purple-950/30 to-slate-950/50">
                        {[
                            { id: "upload", label: "Upload", icon: Upload },
                            { id: "ai", label: "AI", icon: Zap },
                            { id: "collaborate", label: "Collab", icon: Users },
                            { id: "gamify", label: "Gamify", icon: Sparkles },
                            { id: "visibility", label: "Visibility", icon: Eye },
                            { id: "settings", label: "Settings", icon: Settings }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-shrink-0 flex items-center justify-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-4 transition-all duration-300 touch-target relative ${
                                        activeTab === tab.id
                                            ? "text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10"
                                            : "text-purple-400/70 hover:text-cyan-300 hover:bg-purple-500/10"
                                    }`}
                                    style={activeTab === tab.id ? {
                                      boxShadow: 'inset 0 -2px 0 rgba(34,211,238,0.5), 0 0 10px rgba(34,211,238,0.2)'
                                    } : {}}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative p-3 sm:p-6 max-h-[calc(100dvh-200px)] sm:max-h-[60vh] overflow-y-auto scrollbar-hide bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/50">
                        <AnimatePresence mode="wait">
                            {/* Upload Tab */}
                            {activeTab === "upload" && (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {!videoFile ? (
                                        <div className="border-2 border-dashed border-cyan-500/40 rounded-2xl p-8 text-center hover:border-cyan-400 hover:bg-cyan-500/5 transition-all duration-300 bg-gradient-to-br from-purple-900/10 to-cyan-900/10"
                                          style={{
                                            boxShadow: 'inset 0 0 30px rgba(34,211,238,0.05), 0 0 20px rgba(34,211,238,0.1)'
                                          }}>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="video/*"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex flex-col items-center space-y-4 w-full"
                                            >
                                                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                                    <Video className="w-8 h-8 text-yellow-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white mb-2">Upload Video</h3>
                                                    <p className="text-gray-400">Click to select a video file or drag and drop</p>
                                                    <p className="text-sm text-gray-500 mt-2">Max size: 100MB • Recommended: Under 50MB for faster upload</p>
                                                    <p className="text-xs text-gray-600 mt-1">Tip: Compress large videos before uploading</p>
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Video Preview */}
                                            <div className="relative aspect-[9/16] max-w-sm mx-auto bg-black rounded-2xl overflow-hidden">
                                                <video
                                                    ref={videoRef}
                                                    src={videoUrl}
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
                                                        <Pause size={48} className="text-white" />
                                                    ) : (
                                                        <Play size={48} className="text-white" />
                                                    )}
                                                </div>

                                                {/* Video controls */}
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <div className="flex items-center justify-between text-white text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span>{Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span>
                                                        </div>
                                                        <button
                                                            onClick={toggleMute}
                                                            className="hover:bg-white/20 rounded-full p-1 transition-colors"
                                                        >
                                                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Video Info */}
                                            <div className="text-center">
                                                <p className="text-white font-medium">{videoFile.name}</p>
                                                <p className="text-gray-400 text-sm">
                                                    {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • {Math.floor(duration)}s
                                                </p>
                                            </div>

                                            {/* Thumbnail Preview */}
                                            {thumbnail && (
                                                <div className="text-center">
                                                    <p className="text-gray-400 text-sm mb-2">Thumbnail Preview:</p>
                                                    <img 
                                                        src={thumbnail} 
                                                        alt="Thumbnail" 
                                                        className="w-24 h-32 object-cover rounded-lg mx-auto"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* AI Features Tab */}
                            {activeTab === "ai" && (
                                <motion.div
                                    key="ai"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <AIFeatures
                                        videoUrl={videoUrl}
                                        onAnalysisComplete={(analysis) => {
                                            console.log("AI Analysis:", analysis);
                                        }}
                                        isAnalyzing={false}
                                        onAnalyzingChange={() => {}}
                                    />
                                </motion.div>
                            )}

                            {/* Collaborative Features Tab */}
                            {activeTab === "collaborate" && (
                                <motion.div
                                    key="collaborate"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <CollaborativeFeatures
                                        deSnapId="new"
                                        onCollaborationUpdate={(collaborators) => {
                                            console.log("Collaborators:", collaborators);
                                        }}
                                    />
                                </motion.div>
                            )}

                            {/* Gamification Tab */}
                            {activeTab === "gamify" && (
                                <motion.div
                                    key="gamify"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <GamificationSystem />
                                </motion.div>
                            )}

                            {/* Advanced Visibility Tab */}
                            {activeTab === "visibility" && (
                                <motion.div
                                    key="visibility"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <AdvancedVisibilityControls
                                        onVisibilityChange={(rules) => {
                                            console.log("Visibility Rules:", rules);
                                        }}
                                    />
                                </motion.div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === "settings" && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Visibility Settings */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Who can see this DeSnap?
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {visibilityOptions.map((option) => {
                                                const Icon = option.icon;
                                                return (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => setSettings(prev => ({ ...prev, visibility: option.id as any }))}
                                                        className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                                                            settings.visibility === option.id
                                                                ? "border-yellow-400 bg-yellow-400/10"
                                                                : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                                                        }`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${option.color}`} />
                                                        <div className="text-left">
                                                            <p className="font-medium text-white text-sm">{option.name}</p>
                                                            <p className="text-xs text-gray-400">{option.description}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Advanced Settings */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Advanced Settings
                                        </label>
                                        <div className="space-y-3">
                                            {[
                                                { key: "allowComments", label: "Allow comments", icon: Eye },
                                                { key: "allowLikes", label: "Allow likes", icon: Eye },
                                                { key: "showViewCount", label: "Show view count", icon: Eye },
                                                { key: "autoPlay", label: "Auto-play in feed", icon: Play }
                                            ].map((setting) => {
                                                const Icon = setting.icon;
                                                return (
                                                    <label key={setting.key} className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 cursor-pointer transition-all duration-300 border border-purple-500/20">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings[setting.key as keyof DeSnapSettings] as boolean}
                                                            onChange={(e) => setSettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                                                            className="w-4 h-4 text-cyan-400 bg-purple-900/50 border-cyan-500/50 rounded focus:ring-cyan-400 focus:ring-2"
                                                        />
                                                        <Icon className="w-4 h-4 text-cyan-400" />
                                                        <span className="text-sm text-cyan-100">{setting.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="relative px-6 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border-t border-red-500/30 backdrop-blur-sm"
                          style={{
                            boxShadow: 'inset 0 0 20px rgba(239,68,68,0.1)'
                          }}>
                            <div className="text-red-300 text-sm text-center">{error}</div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 border-t border-cyan-500/20 bg-gradient-to-r from-slate-950 via-purple-950/50 to-slate-950 gap-3 sm:gap-0 safe-area-inset"
                      style={{
                        boxShadow: 'inset 0 1px 20px rgba(34,211,238,0.1)'
                      }}>
                        <div className="hidden sm:flex items-center space-x-2 text-sm text-cyan-400/70">
                            <Zap className="w-4 h-4" />
                            <span>DeSnap</span>
                            <span>•</span>
                            <span className="text-cyan-300">{visibilityOptions.find(v => v.id === settings.visibility)?.name}</span>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 sm:py-2 text-cyan-400/70 hover:text-cyan-300 transition-all duration-300 text-center touch-target border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !videoFile}
                                className="px-8 py-3 sm:py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium touch-target"
                            >
                                {isSubmitting ? "Creating..." : "Create DeSnap"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
