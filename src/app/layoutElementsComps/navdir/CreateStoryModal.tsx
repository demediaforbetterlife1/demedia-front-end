"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Camera, Globe, Users, Lock, Clock, Settings, 
    Palette, Sparkles, Timer, Eye, Heart, MessageCircle,
    Zap, Shield, Star, Music, Video, Image as ImageIcon,
    Mic, Type, Smile, Hash, AtSign, Link, Brush
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { getModalThemeClasses } from "@/utils/enhancedThemeUtils";

interface CreateStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStoryCreated?: (story: any) => void;
}

interface StorySettings {
    visibility: string;
    duration: number;
    allowReactions: boolean;
    allowComments: boolean;
    showViewCount: boolean;
    autoDelete: boolean;
    scheduledPost: boolean;
    scheduledTime?: string;
    mood: string;
    location?: string;
    tags: string[];
    music?: string;
    effects: string[];
}

const visibilityOptions = [
    {
        id: "public",
        name: "Public",
        description: "Anyone can see your story",
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
        icon: Lock,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10"
    },
    {
        id: "exclusive",
        name: "Exclusive",
        description: "Premium followers only",
        icon: Star,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10"
    }
];

const durationOptions = [
    { value: 1, label: "1 hour", icon: Timer },
    { value: 3, label: "3 hours", icon: Timer },
    { value: 6, label: "6 hours", icon: Timer },
    { value: 12, label: "12 hours", icon: Timer },
    { value: 24, label: "24 hours", icon: Timer },
    { value: 48, label: "48 hours", icon: Timer },
    { value: 72, label: "72 hours", icon: Timer }
];

const moodOptions = [
    { value: "happy", label: "Happy", emoji: "😊", color: "text-yellow-500" },
    { value: "excited", label: "Excited", emoji: "🤩", color: "text-orange-500" },
    { value: "chill", label: "Chill", emoji: "😌", color: "text-blue-500" },
    { value: "mysterious", label: "Mysterious", emoji: "😏", color: "text-purple-500" },
    { value: "adventurous", label: "Adventurous", emoji: "🏔️", color: "text-green-500" },
    { value: "creative", label: "Creative", emoji: "🎨", color: "text-pink-500" }
];

const effectOptions = [
    { id: "glow", name: "Glow", icon: Sparkles },
    { id: "blur", name: "Blur", icon: Eye },
    { id: "vintage", name: "Vintage", icon: Palette },
    { id: "neon", name: "Neon", icon: Zap },
    { id: "rainbow", name: "Rainbow", icon: Brush }
];

export default function CreateStoryModal({ isOpen, onClose, onStoryCreated }: CreateStoryModalProps) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { t } = useI18n();
    const themeClasses = getModalThemeClasses(theme);
    const [content, setContent] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"content" | "settings" | "effects">("content");
    
    const [settings, setSettings] = useState<StorySettings>({
        visibility: "followers",
        duration: 24,
        allowReactions: true,
        allowComments: true,
        showViewCount: true,
        autoDelete: false,
        scheduledPost: false,
        mood: "happy",
        tags: [],
        effects: []
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // Reset form when modal opens
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setContent("");
            setSettings({
                visibility: "followers",
                duration: 24,
                allowReactions: true,
                allowComments: true,
                showViewCount: true,
                autoDelete: false,
                scheduledPost: false,
                mood: "happy",
                tags: [],
                effects: []
            });
            setError("");
            setActiveTab("content");
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            setError("Please enter some content for your story");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch("/api/stories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "user-id": user?.id?.toString() || "",
                },
                credentials: 'include', // Automatically sends httpOnly cookies
                body: JSON.stringify({
                    userId: user?.id,
                    content: content.trim(),
                    visibility: settings.visibility,
                    durationHours: settings.duration,
                    settings: {
                        allowReactions: settings.allowReactions,
                        allowComments: settings.allowComments,
                        showViewCount: settings.showViewCount,
                        mood: settings.mood,
                        tags: settings.tags,
                        effects: settings.effects
                    }
                })
            });

            if (!response.ok) {
                let errorMessage = "Failed to create story";
                try {
                    const errorText = await response.text();
                    console.log('Story creation error response:', errorText);
                    
                    if (errorText.trim().startsWith('{')) {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    } else {
                        errorMessage = `Server error: ${response.status} - ${errorText}`;
                    }
                } catch (parseError) {
                    errorMessage = `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            // Safe JSON parsing for success response
            let newStory;
            try {
                const responseText = await response.text();
                console.log('Story creation response text:', responseText);
                
                if (!responseText.trim()) {
                    throw new Error('Empty response from server');
                }
                
                if (responseText.trim().startsWith('<')) {
                    throw new Error('Server returned HTML error page. Please check your connection.');
                }
                
                newStory = JSON.parse(responseText);
                console.log('Story created successfully:', newStory);
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                throw new Error('Invalid response from server. Please try again.');
            }
            
            if (onStoryCreated) {
                onStoryCreated(newStory);
            }

            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create story");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Create a preview URL for the file
            const fileUrl = URL.createObjectURL(file);
            
            // For images and videos, we'll store the URL and display the media
            if (file.type.startsWith('image/')) {
                setContent(`[IMAGE:${fileUrl}]`);
            } else if (file.type.startsWith('video/')) {
                setContent(`[VIDEO:${fileUrl}]`);
            } else if (file.type.startsWith('audio/')) {
                setContent(`[AUDIO:${fileUrl}]`);
            } else {
                // For other file types, show the filename
                setContent(file.name);
            }
        } catch (error) {
            console.error('Error handling file upload:', error);
            setContent(file.name);
        }
    };

    const addTag = (tag: string) => {
        if (tag && !settings.tags.includes(tag)) {
            setSettings(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setSettings(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const toggleEffect = (effectId: string) => {
        setSettings(prev => ({
            ...prev,
            effects: prev.effects.includes(effectId)
                ? prev.effects.filter(e => e !== effectId)
                : [...prev.effects, effectId]
        }));
    };

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 ${themeClasses.modalOverlay} flex items-start justify-center z-[9999] p-4 pt-20`}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`${themeClasses.modal} rounded-3xl p-0 max-w-xl w-full max-h-[85vh] overflow-hidden border ${themeClasses.border} ${themeClasses.shadow}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Create Story</h2>
                                <p className="text-sm text-gray-400">Share your moment with the world</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-700">
                        {[
                            { id: "content", label: "Content", icon: Type },
                            { id: "settings", label: "Settings", icon: Settings },
                            { id: "effects", label: "Effects", icon: Sparkles }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                                        activeTab === tab.id
                                            ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5"
                                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {/* Content Tab */}
                            {activeTab === "content" && (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Content Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            What's on your mind?
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                placeholder="Share your story..."
                                                className="w-full px-4 py-4 rounded-2xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 resize-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all"
                                                rows={6}
                                                maxLength={1000}
                                            />
                                            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                                {content.length}/1000
                                            </div>
                                        </div>
                                    </div>

                                    {/* Media Preview */}
                                    {content && (content.includes('[IMAGE:') || content.includes('[VIDEO:') || content.includes('[AUDIO:')) && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-white mb-3">
                                                Media Preview
                                            </label>
                                            <div className="relative rounded-xl overflow-hidden bg-gray-800/50 border border-gray-600">
                                                {content.includes('[IMAGE:') && (
                                                    <img 
                                                        src={content.match(/\[IMAGE:(.*?)\]/)?.[1]} 
                                                        alt="Story preview" 
                                                        className="w-full h-48 object-cover"
                                                    />
                                                )}
                                                {content.includes('[VIDEO:') && (
                                                    <video 
                                                        src={content.match(/\[VIDEO:(.*?)\]/)?.[1]} 
                                                        controls 
                                                        className="w-full h-48 object-cover"
                                                    />
                                                )}
                                                {content.includes('[AUDIO:') && (
                                                    <div className="p-4 flex items-center space-x-3">
                                                        <Music className="w-8 h-8 text-cyan-400" />
                                                        <audio 
                                                            src={content.match(/\[AUDIO:(.*?)\]/)?.[1]} 
                                                            controls 
                                                            className="flex-1"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Media Upload Options */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={() => imageInputRef.current?.click()}
                                            className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-cyan-400 transition-all group"
                                        >
                                            <ImageIcon className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm text-gray-300">Photo</span>
                                        </button>
                                        <button
                                            onClick={() => videoInputRef.current?.click()}
                                            className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-cyan-400 transition-all group"
                                        >
                                            <Video className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm text-gray-300">Video</span>
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-cyan-400 transition-all group"
                                        >
                                            <Mic className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm text-gray-300">Audio</span>
                                        </button>
                                    </div>

                                    {/* Hidden file inputs */}
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <input
                                        ref={videoInputRef}
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="audio/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />

                                    {/* Mood Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            How are you feeling?
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {moodOptions.map((mood) => (
                                                <button
                                                    key={mood.value}
                                                    onClick={() => setSettings(prev => ({ ...prev, mood: mood.value }))}
                                                    className={`flex items-center space-x-2 p-3 rounded-xl border transition-all ${
                                                        settings.mood === mood.value
                                                            ? "border-cyan-400 bg-cyan-400/10"
                                                            : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                                                    }`}
                                                >
                                                    <span className="text-lg">{mood.emoji}</span>
                                                    <span className="text-sm text-white">{mood.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
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
                                            Who can see this story?
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {visibilityOptions.map((option) => {
                                                const Icon = option.icon;
                                                return (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => setSettings(prev => ({ ...prev, visibility: option.id }))}
                                                        className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                                                            settings.visibility === option.id
                                                                ? "border-cyan-400 bg-cyan-400/10"
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

                                    {/* Duration Settings */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            How long should your story last?
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {durationOptions.map((option) => {
                                                const Icon = option.icon;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => setSettings(prev => ({ ...prev, duration: option.value }))}
                                                        className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                                                            settings.duration === option.value
                                                                ? "border-cyan-400 bg-cyan-400/10"
                                                                : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4 text-cyan-400" />
                                                        <span className="text-sm text-white">{option.label}</span>
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
                                                { key: "allowReactions", label: "Allow reactions", icon: Heart },
                                                { key: "allowComments", label: "Allow comments", icon: MessageCircle },
                                                { key: "showViewCount", label: "Show view count", icon: Eye },
                                                { key: "autoDelete", label: "Auto-delete after expiry", icon: Shield }
                                            ].map((setting) => {
                                                const Icon = setting.icon;
                                                return (
                                                    <label key={setting.key} className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings[setting.key as keyof StorySettings] as boolean}
                                                            onChange={(e) => setSettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                                                            className="w-4 h-4 text-cyan-400 bg-gray-700 border-gray-600 rounded focus:ring-cyan-400 focus:ring-2"
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

                            {/* Effects Tab */}
                            {activeTab === "effects" && (
                                <motion.div
                                    key="effects"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Visual Effects */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Add some magic to your story
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {effectOptions.map((effect) => {
                                                const Icon = effect.icon;
                                                const isSelected = settings.effects.includes(effect.id);
                                                return (
                                                    <button
                                                        key={effect.id}
                                                        onClick={() => toggleEffect(effect.id)}
                                                        className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                                                            isSelected
                                                                ? "border-cyan-400 bg-cyan-400/10"
                                                                : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                                                        }`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${isSelected ? "text-cyan-400" : "text-gray-400"}`} />
                                                        <span className="text-sm text-white">{effect.name}</span>
                                                        {isSelected && (
                                                            <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center ml-auto">
                                                                <span className="text-white text-xs">✓</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Add tags to make your story discoverable
                                        </label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {settings.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="flex items-center space-x-1 px-3 py-1 bg-cyan-400/20 text-cyan-400 rounded-full text-sm"
                                                >
                                                    <Hash className="w-3 h-3" />
                                                    <span>{tag}</span>
                                                    <button
                                                        onClick={() => removeTag(tag)}
                                                        className="ml-1 hover:text-red-400 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Type a tag and press Enter..."
                                            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const input = e.target as HTMLInputElement;
                                                    addTag(input.value.trim());
                                                    input.value = '';
                                                }
                                            }}
                                        />
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
                    <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-900/50">
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>{durationOptions.find(d => d.value === settings.duration)?.label}</span>
                            <span>•</span>
                            <span>{visibilityOptions.find(v => v.id === settings.visibility)?.name}</span>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !content.trim()}
                                className="px-8 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl hover:from-cyan-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isSubmitting ? "Creating..." : "Share Story"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
