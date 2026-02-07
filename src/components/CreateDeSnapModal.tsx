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
        
        if (!videoFile) {
            setError("Please select a video file");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // Create FormData for direct backend upload
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('thumbnail', thumbnail);
            formData.append('duration', duration.toString());
            formData.append('visibility', settings.visibility);
            formData.append('userId', user?.id || '');

            // Get token for authentication
            const token = getToken();
            if (!token) {
                throw new Error("You must be logged in to create a DeSnap. Please log in and try again.");
            }

            console.log('📤 Uploading video directly to backend...');

            // Upload directly to backend (bypass Next.js API route to avoid Content-Type issues)
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://demedia-backend.fly.dev';
            const uploadResponse = await fetch(`${backendUrl}/api/upload/video`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'user-id': user?.id?.toString() || '',
                },
                body: formData, // Don't set Content-Type - let browser handle it
                credentials: 'include',
            });

            // Read response text ONCE
            const uploadResponseText = await uploadResponse.text();
            console.log('Upload response:', uploadResponseText.substring(0, 200));

            if (!uploadResponse.ok) {
                let errorMessage = "Failed to upload video";
                try {
                    if (uploadResponseText.trim() && uploadResponseText.trim().startsWith('{')) {
                        const errorData = JSON.parse(uploadResponseText);
                        errorMessage = errorData.details || errorData.error || errorData.message || errorMessage;
                        
                        if (uploadResponse.status === 413) {
                            errorMessage = errorData.details || "Video file is too large. Please compress your video or choose a shorter clip (max 100MB).";
                        }
                    } else {
                        if (uploadResponse.status === 413) {
                            errorMessage = "Video file is too large. Please compress your video or choose a shorter clip (max 100MB).";
                        } else {
                            errorMessage = `Upload error: ${uploadResponse.status}`;
                        }
                    }
                } catch (e) {
                    console.error('Upload error response:', uploadResponseText);
                    if (uploadResponse.status === 413) {
                        errorMessage = "Video file is too large. Please compress your video or choose a shorter clip (max 100MB).";
                    } else {
                        errorMessage = `Upload error: ${uploadResponse.status}`;
                    }
                }
                throw new Error(errorMessage);
            }

            // Parse upload response
            let uploadData;
            try {
                if (!uploadResponseText.trim()) {
                    throw new Error('Empty response from server');
                }
                
                if (uploadResponseText.trim().startsWith('<')) {
                    throw new Error('Server returned HTML error page. Please check your connection.');
                }
                
                uploadData = JSON.parse(uploadResponseText);
            } catch (jsonError) {
                console.error('Upload JSON parsing error:', jsonError);
                throw new Error('Invalid upload response from server. Please try again.');
            }
            
            let videoUrl = uploadData.videoUrl || uploadData.url || uploadData.fileUrl;
            if (!videoUrl) {
                throw new Error('Video upload succeeded but no URL was returned by the server.');
            }
            videoUrl = ensureAbsoluteMediaUrl(videoUrl) || videoUrl;
            
            let thumbnailUrl = uploadData.thumbnailUrl || uploadData.thumbnail || uploadData.previewUrl;
            thumbnailUrl = ensureAbsoluteMediaUrl(thumbnailUrl) || thumbnailUrl || videoUrl;
            
            console.log('✅ Video uploaded successfully:', videoUrl);

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
            setError(err instanceof Error ? err.message : "Failed to create DeSnap");
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
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-none sm:rounded-3xl p-0 w-full sm:max-w-4xl max-h-[100dvh] sm:max-h-[90vh] overflow-hidden border-0 sm:border border-gray-700 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 safe-area-inset">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-white">Create DeSnap</h2>
                                <p className="text-xs sm:text-sm text-gray-400 hidden xs:block">Share your moment with the world</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors touch-target"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-700 overflow-x-auto scrollbar-hide">
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
                                    className={`flex-shrink-0 flex items-center justify-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-4 transition-colors touch-target ${
                                        activeTab === tab.id
                                            ? "text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/5"
                                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-3 sm:p-6 max-h-[calc(100dvh-200px)] sm:max-h-[60vh] overflow-y-auto scrollbar-hide">
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
                                        <div className="border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center hover:border-yellow-400 transition-colors">
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
                                                    <label key={setting.key} className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings[setting.key as keyof DeSnapSettings] as boolean}
                                                            onChange={(e) => setSettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                                                            className="w-4 h-4 text-yellow-400 bg-gray-700 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2"
                                                        />
                                                        <Icon className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm text-white">{setting.label}</span>
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
                        <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20">
                            <div className="text-red-400 text-sm text-center">{error}</div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 border-t border-gray-700 bg-gray-900/50 gap-3 sm:gap-0 safe-area-inset">
                        <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-400">
                            <Zap className="w-4 h-4" />
                            <span>DeSnap</span>
                            <span>•</span>
                            <span>{visibilityOptions.find(v => v.id === settings.visibility)?.name}</span>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 sm:py-2 text-gray-400 hover:text-white transition-colors text-center touch-target"
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
