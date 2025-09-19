"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Image as ImageIcon, 
    Video as VideoIcon, 
    Users, 
    UserCheck, 
    Globe, 
    Lock, 
    Settings,
    Eye,
    EyeOff,
    MessageCircle,
    MessageCircleOff,
    Clock,
    Palette,
    Type,
    Sparkles,
    Camera,
    Upload,
    Wand2
} from "lucide-react";

interface CreateStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface StoryPrivacySettings {
    visibility: 'public' | 'friends' | 'followers' | 'private';
    allowReplies: boolean;
    allowMessages: boolean;
    allowSharing: boolean;
    showViewers: boolean;
}

interface StoryCustomization {
    textColor: string;
    backgroundColor: string;
    fontFamily: string;
    fontSize: number;
    textPosition: 'top' | 'center' | 'bottom';
    effects: string[];
}

export default function CreateStoryModal({ isOpen, onClose }: CreateStoryModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [storyText, setStoryText] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPrivacySettings, setShowPrivacySettings] = useState(false);
    const [showCustomization, setShowCustomization] = useState(false);
    const [privacySettings, setPrivacySettings] = useState<StoryPrivacySettings>({
        visibility: 'public',
        allowReplies: true,
        allowMessages: true,
        allowSharing: true,
        showViewers: true,
    });
    const [customization, setCustomization] = useState<StoryCustomization>({
        textColor: '#ffffff',
        backgroundColor: 'transparent',
        fontFamily: 'Inter',
        fontSize: 24,
        textPosition: 'center',
        effects: [],
    });
    const [storyDuration, setStoryDuration] = useState(24); // hours
    const [selectedAudience, setSelectedAudience] = useState<string[]>([]);
    const [showAudienceSelector, setShowAudienceSelector] = useState(false);
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch suggested users for audience selection
    useEffect(() => {
        const fetchSuggestedUsers = async () => {
            try {
                const response = await fetch(`/api/suggestions/users`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const users = await response.json();
                    setSuggestedUsers(users);
                }
            } catch (error) {
                console.error('Failed to fetch suggested users:', error);
            }
        };
        fetchSuggestedUsers();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const getVisibilityIcon = (visibility: string) => {
        switch (visibility) {
            case 'public': return <Globe className="w-4 h-4" />;
            case 'friends': return <Users className="w-4 h-4" />;
            case 'followers': return <UserCheck className="w-4 h-4" />;
            case 'private': return <Lock className="w-4 h-4" />;
            default: return <Globe className="w-4 h-4" />;
        }
    };

    const getVisibilityText = (visibility: string) => {
        switch (visibility) {
            case 'public': return 'Public';
            case 'friends': return 'Friends Only';
            case 'followers': return 'Followers Only';
            case 'private': return 'Private';
            default: return 'Public';
        }
    };

    const handleAudienceToggle = (userId: string) => {
        setSelectedAudience(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async () => {
        if (!selectedFile && !storyText.trim()) return;

        setLoading(true);
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                alert("Please log in to create a story");
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/stories`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    userId: parseInt(userId), 
                    content: storyText, 
                    durationHours: storyDuration 
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create story");
            }

            // Reset
            setSelectedFile(null);
            setStoryText("");
            setSelectedAudience([]);
            onClose();
            alert("Story created successfully!");
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to create story");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="min-h-screen theme-bg-primary flex items-center justify-center p-4">
            <motion.div
                className="theme-bg-secondary rounded-3xl w-[900px] max-w-[95%] max-h-[90vh] overflow-y-auto theme-shadow flex flex-col border theme-border"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b theme-border">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            Create Story
                        </h2>
                    </div>

                    <div className="flex flex-1">
                        {/* Story Preview */}
                        <div className="w-1/2 p-6 border-r theme-border">
                            <div className="relative aspect-[9/16] bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 rounded-2xl overflow-hidden">
                                {selectedFile ? (
                                    selectedFile.type.startsWith('video/') ? (
                                        <video 
                                            src={URL.createObjectURL(selectedFile)} 
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            muted
                                            loop
                                        />
                                    ) : (
                                        <img 
                                            src={URL.createObjectURL(selectedFile)} 
                                            alt="Story preview" 
                                            className="w-full h-full object-cover"
                                        />
                                    )
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <Camera className="w-16 h-16 mx-auto mb-4 text-white/50" />
                                            <p className="text-white/70">No media selected</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Story Text Overlay */}
                                {storyText && (
                                    <div 
                                        className={`absolute inset-x-4 text-white font-bold text-center ${
                                            customization.textPosition === 'top' ? 'top-8' :
                                            customization.textPosition === 'bottom' ? 'bottom-8' : 'top-1/2 -translate-y-1/2'
                                        }`}
                                        style={{
                                            color: customization.textColor,
                                            fontFamily: customization.fontFamily,
                                            fontSize: `${customization.fontSize}px`,
                                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                        }}
                                    >
                                        {storyText}
                                    </div>
                                )}

                                {/* Story Duration Indicator */}
                                <div className="absolute top-4 left-4 right-4">
                                    <div className="flex space-x-1">
                                        {Array.from({ length: 3 }, (_, i) => (
                                            <div 
                                                key={i}
                                                className={`h-1 rounded-full ${
                                                    i < Math.ceil(storyDuration / 8) ? 'bg-white' : 'bg-white/30'
                                                }`}
                                                style={{ width: `${100/3}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Privacy Indicator */}
                                <div className="absolute top-4 right-4">
                                    <div className="flex items-center space-x-1 px-2 py-1 bg-black/50 rounded-full">
                                        {getVisibilityIcon(privacySettings.visibility)}
                                        <span className="text-white text-xs">
                                            {getVisibilityText(privacySettings.visibility)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Story Controls */}
                        <div className="w-1/2 p-6 space-y-6">
                            {/* Media Upload */}
                            <div className="space-y-4">
                                <h3 className="font-semibold theme-text-primary">Media</h3>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleFileUpload}
                                        className="flex items-center space-x-2 px-4 py-3 theme-bg-primary/60 rounded-xl theme-text-secondary hover:theme-bg-primary transition-colors border theme-border flex-1"
                                    >
                                        <Upload size={20} />
                                        <span>Upload Media</span>
                                    </button>
                                    <button
                                        onClick={() => setShowCustomization(!showCustomization)}
                                        className="flex items-center space-x-2 px-4 py-3 theme-bg-primary/60 rounded-xl theme-text-secondary hover:theme-bg-primary transition-colors border theme-border"
                                    >
                                        <Wand2 size={20} />
                                        <span>Customize</span>
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {/* Story Text */}
                            <div className="space-y-3">
                                <h3 className="font-semibold theme-text-primary">Text</h3>
                                <textarea
                                    placeholder="Add text to your story..."
                                    value={storyText}
                                    onChange={(e) => setStoryText(e.target.value)}
                                    className="w-full p-3 rounded-xl theme-bg-primary theme-text-primary placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none h-24 border theme-border"
                                />
                            </div>

                            {/* Customization Panel */}
                            {showCustomization && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 rounded-xl theme-bg-primary/30 border theme-border space-y-4"
                                >
                                    <h4 className="font-semibold theme-text-primary">Customization</h4>
                                    
                                    {/* Text Color */}
                                    <div>
                                        <label className="block text-sm font-medium theme-text-secondary mb-2">Text Color</label>
                                        <input
                                            type="color"
                                            value={customization.textColor}
                                            onChange={(e) => setCustomization(prev => ({ ...prev, textColor: e.target.value }))}
                                            className="w-full h-10 rounded-lg border theme-border"
                                        />
                                    </div>

                                    {/* Font Size */}
                                    <div>
                                        <label className="block text-sm font-medium theme-text-secondary mb-2">Font Size: {customization.fontSize}px</label>
                                        <input
                                            type="range"
                                            min="16"
                                            max="48"
                                            value={customization.fontSize}
                                            onChange={(e) => setCustomization(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Text Position */}
                                    <div>
                                        <label className="block text-sm font-medium theme-text-secondary mb-2">Text Position</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['top', 'center', 'bottom'].map((position) => (
                                                <button
                                                    key={position}
                                                    onClick={() => setCustomization(prev => ({ ...prev, textPosition: position as any }))}
                                                    className={`p-2 rounded-lg text-sm transition-colors ${
                                                        customization.textPosition === position
                                                            ? 'theme-bg-accent/20 text-cyan-400 border border-cyan-400/30'
                                                            : 'theme-bg-primary/50 hover:theme-bg-primary'
                                                    }`}
                                                >
                                                    {position.charAt(0).toUpperCase() + position.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Privacy Settings */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold theme-text-primary">Privacy</h3>
                                    <button
                                        onClick={() => setShowPrivacySettings(!showPrivacySettings)}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-full theme-bg-primary/50 hover:theme-bg-primary transition-colors"
                                    >
                                        <Settings size={16} />
                                        <span className="text-sm theme-text-secondary">Settings</span>
                                    </button>
                                </div>

                                {showPrivacySettings && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 rounded-xl theme-bg-primary/30 border theme-border space-y-4"
                                    >
                                        {/* Visibility */}
                                        <div>
                                            <label className="block text-sm font-medium theme-text-secondary mb-2">Who can see this story?</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['public', 'friends', 'followers', 'private'].map((visibility) => (
                                                    <button
                                                        key={visibility}
                                                        onClick={() => setPrivacySettings(prev => ({ ...prev, visibility: visibility as any }))}
                                                        className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                                                            privacySettings.visibility === visibility
                                                                ? 'theme-bg-accent/20 text-cyan-400 border border-cyan-400/30'
                                                                : 'theme-bg-primary/50 hover:theme-bg-primary'
                                                        }`}
                                                    >
                                                        {getVisibilityIcon(visibility)}
                                                        <span className="text-sm">{getVisibilityText(visibility)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Interaction Settings */}
                                        <div className="space-y-2">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={privacySettings.allowReplies}
                                                    onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowReplies: e.target.checked }))}
                                                    className="rounded"
                                                />
                                                <span className="text-sm theme-text-secondary">Allow Replies</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={privacySettings.allowMessages}
                                                    onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowMessages: e.target.checked }))}
                                                    className="rounded"
                                                />
                                                <span className="text-sm theme-text-secondary">Allow Messages</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={privacySettings.allowSharing}
                                                    onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowSharing: e.target.checked }))}
                                                    className="rounded"
                                                />
                                                <span className="text-sm theme-text-secondary">Allow Sharing</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={privacySettings.showViewers}
                                                    onChange={(e) => setPrivacySettings(prev => ({ ...prev, showViewers: e.target.checked }))}
                                                    className="rounded"
                                                />
                                                <span className="text-sm theme-text-secondary">Show Viewers</span>
                                            </label>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Story Duration */}
                            <div className="space-y-3">
                                <h3 className="font-semibold theme-text-primary">Duration</h3>
                                <div className="flex items-center space-x-3">
                                    <Clock size={20} className="theme-text-muted" />
                                    <input
                                        type="range"
                                        min="1"
                                        max="72"
                                        value={storyDuration}
                                        onChange={(e) => setStoryDuration(parseInt(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-sm theme-text-secondary">{storyDuration}h</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t theme-border">
                        <div className="flex justify-between items-center">
                            <div className="text-sm theme-text-muted">
                                Story will be visible for {storyDuration} hours
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 rounded-xl theme-bg-primary/50 theme-text-secondary hover:theme-bg-primary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || (!selectedFile && !storyText.trim())}
                                    className="px-8 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Creating..." : "Create Story"}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
        </div>
    );
}
