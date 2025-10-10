// src/components/ProfilePage.tsx
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera,
    Edit,
    MoreVertical,
    Users,
    User as UserIcon,
    Heart,
    MessageCircle,
    Video,
    Share,
    Sparkles,
    Grid3X3,
    Settings,
    Star,
    Award,
    Trophy,
    Crown,
    Zap,
    Target,
    TrendingUp,
    Activity,
    BarChart3,
    PieChart,
    LineChart,
    Gauge,
    Clock,
    Calendar,
    MapPin,
    Globe,
    Shield,
    Lock,
    Eye,
    EyeOff,
    Bell,
    BellOff,
    Volume2,
    VolumeX,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Repeat,
    Shuffle,
    Download,
    Upload,
    Trash2,
    Archive,
    Copy,
    Move,
    RotateCcw,
    RotateCw,
    FlipHorizontal,
    FlipVertical,
    Crop,
    Scissors,
    Paintbrush,
    Eraser,
    Droplets,
    Sun,
    Moon,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudLightning,
    Wind,
    Thermometer,
    Target as TargetIcon,
    Award as AwardIcon,
    Trophy as TrophyIcon,
    Medal,
    Badge,
    Crown as CrownIcon
} from "lucide-react";
import { getUserProfile } from "../../../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSearchParams } from "next/navigation";
import EditProfileModal from "@/app/layoutElementsComps/navdir/EditProfileModal";
import CreateStoryModal from "@/app/layoutElementsComps/navdir/CreateStoryModal";
import DeSnapsViewer from "@/components/DeSnapsViewer";
import CreateDeSnapModal from "@/components/CreateDeSnapModal";
import MoodFilter from "@/components/MoodFilter";
import LiveSpaces from "@/components/LiveSpaces";
import TimeCapsules from "@/components/TimeCapsules";
import EmotionTracker from "@/components/EmotionTracker";
import AISuggestions from "@/components/AISuggestions";
import AnonymousInsights from "@/components/AnonymousInsights";
import CommentModal from "@/components/CommentModal";
import { apiFetch } from "@/lib/api";

interface Story {
    id: number;
    content: string;
    createdAt: string;
    expiresAt?: string;
    likes?: number;
    comments?: number;
    views?: number;
    visibility?: 'public' | 'followers' | 'close_friends' | 'premium';
    type?: 'image' | 'video' | 'text';
    duration?: number; // in hours
}

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

interface Profile {
    id: number;
    name: string;
    username: string;
    bio: string;
    profilePicture: string | null;
    coverPicture?: string | null;
    coverPhoto?: string | null;
    stories: Story[];
    deSnaps: DeSnap[];
    followersCount: number;
    followingCount: number;
    likesCount: number;
    isFollowing?: boolean;
    privacy?: 'public' | 'followers' | 'private';
}

export default function ProfilePage() {
    const { user, isLoading: authLoading } = useAuth();
    const { theme } = useTheme();
    const searchParams = useSearchParams();
    const userIdFromUrl = searchParams.get('userId');
    const userId = userIdFromUrl || user?.id;
    const isOwnProfile = !userIdFromUrl || userIdFromUrl === user?.id?.toString();

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gray-50',
                    card: 'bg-white',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-100',
                    gradient: 'from-blue-500/10 to-purple-500/10',
                    accent: 'text-blue-600',
                    accentBg: 'bg-blue-50'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-100',
                    card: 'bg-white',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-100',
                    hover: 'hover:bg-gray-50',
                    gradient: 'from-blue-400/10 to-purple-400/10',
                    accent: 'text-blue-500',
                    accentBg: 'bg-blue-50'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    gradient: 'from-cyan-500/20 to-purple-500/20',
                    accent: 'text-cyan-400',
                    accentBg: 'bg-cyan-900/20'
                };
            case 'super-dark':
                return {
                    bg: 'bg-black',
                    card: 'bg-gray-900',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800',
                    hover: 'hover:bg-gray-800',
                    gradient: 'from-cyan-400/20 to-purple-400/20',
                    accent: 'text-cyan-300',
                    accentBg: 'bg-cyan-900/30'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    gradient: 'from-cyan-500/20 to-purple-500/20',
                    accent: 'text-cyan-400',
                    accentBg: 'bg-cyan-900/20'
                };
        }
    };

    const themeClasses = getThemeClasses();
    const [activeTab, setActiveTab] = useState<string>("posts");
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [busyFollow, setBusyFollow] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
    const [showCreateDeSnapModal, setShowCreateDeSnapModal] = useState(false);
    const [showDeSnapsViewer, setShowDeSnapsViewer] = useState(false);
    const [selectedDeSnap, setSelectedDeSnap] = useState<DeSnap | null>(null);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // State for modals and features
    const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
    const [showQuickActions, setShowQuickActions] = useState(false);
    
    // Unique Features State
    const [showAchievements, setShowAchievements] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showMoodTracker, setShowMoodTracker] = useState(false);
    const [showTimeCapsule, setShowTimeCapsule] = useState(false);
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [showPrivacySettings, setShowPrivacySettings] = useState(false);
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    const [showContentPreferences, setShowContentPreferences] = useState(false);
    const [showSocialInsights, setShowSocialInsights] = useState(false);
    const [showPersonalization, setShowPersonalization] = useState(false);
    const [showWellnessTracker, setShowWellnessTracker] = useState(false);
    const [showGoalTracker, setShowGoalTracker] = useState(false);
    const [showMemoryLane, setShowMemoryLane] = useState(false);
    const [showCollaborationHub, setShowCollaborationHub] = useState(false);
    const [showInnovationLab, setShowInnovationLab] = useState(false);
    
    // Advanced UI State
    const [activeView, setActiveView] = useState('overview');
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [isProfileOptimized, setIsProfileOptimized] = useState(false);
    const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            // Wait for auth to load
            if (authLoading) {
                return;
            }

            // Add a small delay to prevent rapid loading states
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!userId) {
                setError("Missing userId - Please make sure you're logged in");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const data = await getUserProfile(userId);
                
                // Fetch stories for this user
                const storiesResponse = await fetch(`/api/stories/user/${userId}?viewerId=${user?.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'user-id': user?.id?.toString() || '',
                        'Content-Type': 'application/json',
                    }
                });
                
                let userStories = [];
                if (storiesResponse.ok) {
                    userStories = await storiesResponse.json();
                }

                // Fetch DeSnaps for this user
                const deSnapsResponse = await fetch(`/api/desnaps/user/${userId}?viewerId=${user?.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'user-id': user?.id?.toString() || '',
                        'Content-Type': 'application/json',
                    }
                });
                
                let userDeSnaps = [];
                if (deSnapsResponse.ok) {
                    userDeSnaps = await deSnapsResponse.json();
                }

                if (!mounted) return;

                if (!data) {
                    setError("Profile not found");
                    return;
                }

                // Normalize data
                const normalized: Profile = {
                    id: data.id,
                    name: data.name,
                    username: data.username,
                    bio: data.bio ?? "",
                    profilePicture: data.profilePicture,
                    coverPicture: data.coverPhoto,
                    stories: userStories.map((story: any) => ({
                        id: story.id,
                        content: story.content,
                        createdAt: story.createdAt,
                        expiresAt: story.expiresAt,
                        likes: story.likes || 0,
                        comments: story.comments || 0,
                        views: story.views || 0,
                        visibility: story.visibility || 'public',
                        type: story.type || 'text',
                        duration: story.duration || 24
                    })),
                    deSnaps: userDeSnaps.map((deSnap: any) => ({
                        id: deSnap.id,
                        content: deSnap.content,
                        thumbnail: deSnap.thumbnail,
                        createdAt: deSnap.createdAt,
                        likes: deSnap.likes || 0,
                        comments: deSnap.comments || 0,
                        views: deSnap.views || 0,
                        duration: deSnap.duration || 0,
                        visibility: deSnap.visibility || 'public',
                        isLiked: deSnap.isLiked || false,
                        isBookmarked: deSnap.isBookmarked || false
                    })),
                    followersCount: data.followersCount,
                    followingCount: data.followingCount,
                    likesCount: data.likesCount,
                    isFollowing: false, // This will be determined by follow status
                    privacy: (data.privacy as 'public' | 'followers' | 'private') || 'public'
                };

                setProfile(normalized);
                setIsFollowing(Boolean(normalized.isFollowing));
            } catch (err) {
                if (!mounted) return;
                console.error("Profile fetch error:", err);
                setError("Failed to load profile");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadProfile();
        return () => {
            mounted = false;
        };
    }, [userId, authLoading]);

    // Real-time refresh function
    const refreshProfile = useCallback(async () => {
        if (!userId) return;
        
        setIsRefreshing(true);
        try {
            // Refresh stories
            const storiesResponse = await fetch(`/api/stories/user/${userId}?viewerId=${user?.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-id': user?.id?.toString() || '',
                    'Content-Type': 'application/json',
                }
            });
            
            let userStories = [];
            if (storiesResponse.ok) {
                userStories = await storiesResponse.json();
            }

            // Refresh DeSnaps
            const deSnapsResponse = await fetch(`/api/desnaps/user/${userId}?viewerId=${user?.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-id': user?.id?.toString() || '',
                    'Content-Type': 'application/json',
                }
            });
            
            let userDeSnaps = [];
            if (deSnapsResponse.ok) {
                userDeSnaps = await deSnapsResponse.json();
            }

            // Update profile with new data
            setProfile(prev => prev ? {
                ...prev,
                stories: userStories.map((story: any) => ({
                    id: story.id,
                    content: story.content,
                    createdAt: story.createdAt,
                    expiresAt: story.expiresAt,
                    likes: story.likes || 0,
                    comments: story.comments || 0,
                    views: story.views || 0,
                    visibility: story.visibility || 'public',
                    type: story.type || 'text',
                    duration: story.duration || 24
                })),
                deSnaps: userDeSnaps.map((deSnap: any) => ({
                    id: deSnap.id,
                    content: deSnap.content,
                    thumbnail: deSnap.thumbnail,
                    createdAt: deSnap.createdAt,
                    likes: deSnap.likes || 0,
                    comments: deSnap.comments || 0,
                    views: deSnap.views || 0,
                    duration: deSnap.duration || 0,
                    visibility: deSnap.visibility || 'public',
                    isLiked: deSnap.isLiked || false,
                    isBookmarked: deSnap.isBookmarked || false
                }))
            } : null);
        } catch (err) {
            console.error('Error refreshing profile:', err);
        } finally {
            setIsRefreshing(false);
        }
    }, [userId, user?.id]);

    // Auto-refresh every 30 seconds for stories
    useEffect(() => {
        if (!isOwnProfile) return;
        
        const interval = setInterval(() => {
            refreshProfile();
        }, 30000);

        return () => clearInterval(interval);
    }, [refreshProfile, isOwnProfile]);

    async function handleFollowToggle() {
        if (!profile || busyFollow) return;
        setBusyFollow(true);

        const prevIsFollowing = isFollowing;
        const prevFollowers = profile.followersCount;

        // Optimistic update
        setIsFollowing(!prevIsFollowing);
        setProfile((p) => p ? ({
            ...p,
            followersCount: prevIsFollowing
                ? prevFollowers - 1
                : prevFollowers + 1,
        }) : null);

        try {
            const endpoint = prevIsFollowing
                ? `/api/user/${profile.id}/unfollow`
                : `/api/user/${profile.id}/follow`;

            const res = await fetch(endpoint, { 
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-id': user?.id?.toString() || '',
                },
                body: JSON.stringify({
                    followerId: user?.id
                })
            });
            if (!res.ok) throw new Error("Follow request failed");

            const payload = await res.json().catch(() => null);
            if (payload) {
                setProfile((p) => p ? ({
                    ...p,
                    followersCount:
                        payload.followersCount ??
                        p.followersCount,
                }) : null);
                if (typeof payload.isFollowing !== "undefined") {
                    setIsFollowing(Boolean(payload.isFollowing));
                }
            }
        } catch (err) {
            console.error("Follow toggle error:", err);
            setIsFollowing(prevIsFollowing);
            setProfile((p) => p ? ({
                ...p,
                followersCount: prevFollowers,
            }) : null);
        } finally {
            setBusyFollow(false);
        }
    }

    async function handleStartChat() {
        if (!profile || !user?.id) return;
        
        try {
            // Create or find existing chat with this user
            const res = await fetch('/api/chat/create-or-find', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-id': user.id.toString(),
                },
                body: JSON.stringify({
                    participantId: profile.id
                })
            });

            if (res.ok) {
                const chatData = await res.json();
                // Navigate to the chat
                window.location.href = `/messeging/chat/${chatData.id}`;
            } else {
                console.error('Failed to create/find chat');
                // Fallback: try to navigate to messaging page
                window.location.href = '/messeging';
            }
        } catch (err) {
            console.error('Error starting chat:', err);
            // Fallback: try to navigate to messaging page
            window.location.href = '/messeging';
        }
    }

    if (authLoading || loading)
        return (
            <div className={`min-h-screen ${themeClasses.bg} pb-20 md:pb-0 flex items-center justify-center`}>
                <div className="animate-pulse">
                    <div className="h-56 bg-gray-700 rounded mb-6"></div>
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-36 h-36 bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-8 bg-gray-700 rounded w-1/3 mb-2"></div>
                            <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    
    if (error)
        return (
            <div className={`min-h-screen ${themeClasses.bg} pb-20 md:pb-0 flex items-center justify-center`}>
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
                    <p className={themeClasses.textSecondary}>{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    
    if (!profile)
        return (
            <div className={`min-h-screen ${themeClasses.bg} pb-20 md:pb-0 flex items-center justify-center`}>
                <div className="text-center">
                    <div className="text-gray-400 text-xl mb-2">👤</div>
                    <p className={themeClasses.textSecondary}>Profile not found</p>
                </div>
            </div>
        );

    const { coverPicture, profilePicture, name, username, bio, followersCount, followingCount, likesCount, stories } =
        profile;

    return (
        <>
            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
            `}</style>
            <div className={`min-h-screen ${themeClasses.bg} pb-20 md:pb-0`}>
            <div className={`max-w-6xl mx-auto p-4 ${themeClasses.card} rounded-3xl shadow-2xl border ${themeClasses.border} overflow-hidden`}>
                {/* Modern Cover Section */}
                <div className="relative">
                    {coverPicture ? (
                        <div className="relative h-64 md:h-80 overflow-hidden rounded-t-3xl">
                    <img
                        src={coverPicture}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            {isOwnProfile && (
                                <motion.button
                        type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        // TODO: Implement cover photo upload
                                        console.log('Cover photo upload clicked');
                                        alert('Cover photo upload feature coming soon!');
                                    }}
                                    className="absolute bottom-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                                >
                                    <Camera size={20} />
                                </motion.button>
                            )}
                        </div>
                    ) : (
                        <div className={`h-64 md:h-80 bg-gradient-to-br ${themeClasses.gradient} rounded-t-3xl flex items-center justify-center`}>
                            <div className="text-center">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserIcon className="w-10 h-10 text-white" />
                                </div>
                                <p className={`text-lg font-medium ${themeClasses.text}`}>No cover photo</p>
                                {isOwnProfile && (
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            // Implement cover photo upload functionality
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.onchange = (e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (e) => {
                                                        const result = e.target?.result as string;
                                                        setCoverPhoto(result);
                                                        alert('Cover photo updated successfully! 🎉');
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            };
                                            input.click();
                                        }}
                                        className="mt-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
                                    >
                                        Add Cover Photo
                                    </motion.button>
                                )}
                            </div>
                </div>
            )}

                    {/* Modern Profile Section */}
            <div className="relative px-6 pb-6">
                        {/* Circular Profile Picture with Unique Features */}
                        <div className="absolute -top-24 left-6">
                            <div className="relative group">
                                {/* Main Profile Circle */}
                                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${themeClasses.border} shadow-2xl relative`}>
                    {profilePicture ? (
                        <motion.img
                                            key={profilePicture}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 120 }}
                            src={profilePicture}
                            alt={name}
                                className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                                    console.log("Profile picture failed to load:", profilePicture);
                                e.currentTarget.style.display = "none";
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) {
                                        fallback.classList.remove("hidden");
                                    }
                                }}
                                onLoad={() => {
                                    console.log("Profile picture loaded successfully:", profilePicture);
                            }}
                        />
                    ) : null}
                                    <div className={`absolute inset-0 w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold ${profilePicture ? "hidden" : ""}`}>
                        {name.charAt(0).toUpperCase()}
                        </div>
                                    
                                    {/* Unique Feature: Mood Ring */}
                                    <div className="absolute inset-0 rounded-full border-2 border-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-60 animate-pulse"></div>
                                    
                                    {/* Unique Feature: Online Status */}
                                    <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    </div>
                                
                                {/* Unique Feature: Floating Action Buttons */}
                                {isOwnProfile && (
                                    <div className="absolute -bottom-2 -right-2 flex space-x-2">
                                        <motion.button
                        type="button"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                // TODO: Implement profile photo upload
                                                console.log('Profile photo upload clicked');
                                                alert('Profile photo upload feature coming soon!');
                                            }}
                                            className="p-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                            title="Change Photo"
                    >
                        <Camera size={16} />
                                        </motion.button>
                                        <motion.button
                                type="button"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="p-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                            title="Mood Filter"
                                        >
                                            <Sparkles size={16} />
                                        </motion.button>
                                    </div>
                                )}
                                
                                {/* Unique Feature: Energy Ring */}
                                <div className="absolute -inset-2 rounded-full border-2 border-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-20 animate-spin-slow"></div>
                            </div>
                </div>

                        {/* Profile Info Section */}
                        <div className="pt-20 px-6">
                            {/* Name and Username */}
                            <div className="mb-4">
                                <h1 className={`text-3xl font-bold ${themeClasses.text} mb-1`}>{name}</h1>
                                <p className={`text-lg ${themeClasses.textSecondary}`}>@{username}</p>
                            </div>

                            {/* Bio */}
                        {bio && (
                                <div className="mb-6">
                                    <p className={`text-sm leading-relaxed ${themeClasses.textSecondary} max-w-2xl`}>{bio}</p>
                                </div>
                            )}

                            {/* Unique Stats with Special Features */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className={`text-center p-4 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} cursor-pointer hover:shadow-lg transition-all duration-300`}
                                >
                                    <div className={`text-2xl font-bold ${themeClasses.text}`}>{followersCount}</div>
                                    <div className={`text-sm ${themeClasses.textSecondary}`}>Followers</div>
                                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                        <div className="bg-gradient-to-r from-cyan-500 to-purple-600 h-1 rounded-full" style={{width: `${Math.min(100, (followersCount / 1000) * 100)}%`}}></div>
                    </div>
                                </motion.div>
                                
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className={`text-center p-4 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} cursor-pointer hover:shadow-lg transition-all duration-300`}
                                >
                                    <div className={`text-2xl font-bold ${themeClasses.text}`}>{followingCount}</div>
                                    <div className={`text-sm ${themeClasses.textSecondary}`}>Following</div>
                                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                        <div className="bg-gradient-to-r from-pink-500 to-rose-600 h-1 rounded-full" style={{width: `${Math.min(100, (followingCount / 500) * 100)}%`}}></div>
                                    </div>
                                </motion.div>
                                
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className={`text-center p-4 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} cursor-pointer hover:shadow-lg transition-all duration-300`}
                                >
                                    <div className={`text-2xl font-bold ${themeClasses.text}`}>{likesCount}</div>
                                    <div className={`text-sm ${themeClasses.textSecondary}`}>Likes</div>
                                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-1 rounded-full" style={{width: `${Math.min(100, (likesCount / 10000) * 100)}%`}}></div>
                                    </div>
                                </motion.div>
                                
                            </div>

                            {/* Unique Action Buttons with Special Features */}
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                    {isOwnProfile ? (
                                    <>
                        <motion.button
                            type="button"
                            onClick={() => setShowEditModal(true)}
                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 shadow-lg hover:shadow-xl`}
                        >
                                            <Edit size={18} />
                                            <span>Edit Profile</span>
                        </motion.button>
                                        
                                        
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            className={`p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl transition-all duration-300`}
                                            title="Settings"
                                        >
                                            <Settings size={18} />
                                        </motion.button>
                                    </>
                                ) : (
                                    <>
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                onClick={handleFollowToggle}
                                disabled={busyFollow}
                                            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                    isFollowing
                                                    ? `bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800`
                                                    : `bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 shadow-lg hover:shadow-xl`
                                } ${busyFollow ? "opacity-70 cursor-wait" : ""}`}
                            >
                                            {busyFollow ? "..." : isFollowing ? "Following" : "Follow"}
                            </motion.button>
                                        
                            
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={handleStartChat}
                                            className={`p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300`}
                                            title="Message"
                                        >
                                            <MessageCircle size={18} />
                            </motion.button>
                                        
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            className={`p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl transition-all duration-300`}
                                            title="More"
                                        >
                                            <MoreVertical size={18} />
                                        </motion.button>
                                    </>
                    )}
                </div>

                            {/* Advanced Navigation Tabs with Unique Features */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
                                {[
                                    { id: "posts", label: "Posts", icon: Grid3X3, color: "from-blue-500 to-cyan-600", badge: "12" },
                                    { id: "desnaps", label: "DeSnaps", icon: Video, color: "from-purple-500 to-pink-600", badge: "8" },
                                    { id: "stories", label: "Stories", icon: Sparkles, color: "from-yellow-500 to-orange-600", badge: "5" },
                                    { id: "achievements", label: "Achievements", icon: Trophy, color: "from-yellow-500 to-amber-600", badge: "15" },
                                    { id: "analytics", label: "Analytics", icon: BarChart3, color: "from-green-500 to-emerald-600", badge: "Live" },
                                    { id: "wellness", label: "Wellness", icon: Heart, color: "from-red-500 to-rose-600", badge: "85%" },
                                    { id: "goals", label: "Goals", icon: Target, color: "from-indigo-500 to-purple-600", badge: "3/5" },
                                    { id: "memories", label: "Memories", icon: Clock, color: "from-pink-500 to-rose-600", badge: "24" },
                                ].map((tab) => (
                                    <motion.button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 relative ${
                                            activeTab === tab.id
                                                ? `text-white bg-gradient-to-r ${tab.color} shadow-lg`
                                                : `${themeClasses.textSecondary} hover:${themeClasses.text} hover:bg-gray-100/10`
                                        }`}
                                    >
                                        <tab.icon size={18} />
                                        <span>{tab.label}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            activeTab === tab.id 
                                                ? 'bg-white/20 text-white' 
                                                : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {tab.badge}
                                        </span>
                                        {activeTab === tab.id && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </motion.button>
                ))}
            </div>

                            {/* Unique Content Sections with Special Features */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {activeTab === "posts" && (
                        <motion.div
                            key="posts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <UserPosts userId={user?.id} />
                        </motion.div>
                    )}

                                    {activeTab === "desnaps" && (
                        <motion.div
                                            key="desnaps"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                                            <div className="text-center py-8">
                                                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                    <Video className="w-10 h-10 text-white" />
                            </div>
                                                <h3 className={`text-xl font-bold ${themeClasses.text} mb-2`}>DeSnaps</h3>
                                                <p className={`${themeClasses.textSecondary} mb-4`}>Short-form video content with unique features</p>
                                                <div className="text-center">
                                                    <p className={`${themeClasses.textSecondary} mb-4`}>No DeSnaps yet</p>
                                                    <p className={`${themeClasses.textSecondary} mb-4`}>DeSnaps will appear here when created</p>
                                        </div>
                                                    </div>
                        </motion.div>
                    )}

                                    {activeTab === "stories" && (
                                        <motion.div
                                            key="stories"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="text-center py-8">
                                                <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                    <Sparkles className="w-10 h-10 text-white" />
                                                </div>
                                                <h3 className={`text-xl font-bold ${themeClasses.text} mb-2`}>Stories</h3>
                                                <p className={`${themeClasses.textSecondary} mb-4`}>Temporary content that disappears after 24 hours</p>
                                                <div className="text-center">
                                                    <p className={`${themeClasses.textSecondary} mb-4`}>No stories yet</p>
                                                    {isOwnProfile && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setShowCreateStoryModal(true)}
                                                            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 shadow-lg"
                                                        >
                                                            Create Your First Story
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "achievements" && (
                                        <motion.div
                                            key="achievements"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="py-8">
                                                <div className="text-center mb-8">
                                                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                        <Trophy className="w-10 h-10 text-white" />
                                                    </div>
                                                    <h3 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Achievements</h3>
                                                    <p className={`${themeClasses.textSecondary} mb-6`}>Your journey of accomplishments and milestones</p>
                                                </div>

                                                {/* Achievement Categories */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                    {/* Social Achievements */}
                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center mb-4">
                                                            <Users className="w-8 h-8 text-blue-500 mr-3" />
                                                            <h4 className={`text-lg font-semibold ${themeClasses.text}`}>Social</h4>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>First Post</span>
                                                                <Star className="w-5 h-5 text-yellow-500" />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>100 Followers</span>
                                                                <Star className="w-5 h-5 text-yellow-500" />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>Viral Content</span>
                                                                <Star className="w-5 h-5 text-yellow-500" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Creative Achievements */}
                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center mb-4">
                                                            <Sparkles className="w-8 h-8 text-purple-500 mr-3" />
                                                            <h4 className={`text-lg font-semibold ${themeClasses.text}`}>Creative</h4>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>First DeSnap</span>
                                                                <Star className="w-5 h-5 text-yellow-500" />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>Story Master</span>
                                                                <Star className="w-5 h-5 text-yellow-500" />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>Content Creator</span>
                                                                <Star className="w-5 h-5 text-yellow-500" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Wellness Achievements */}
                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center mb-4">
                                                            <Heart className="w-8 h-8 text-red-500 mr-3" />
                                                            <h4 className={`text-lg font-semibold ${themeClasses.text}`}>Wellness</h4>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>Mood Tracker</span>
                                                                <Star className="w-5 h-5 text-yellow-500" />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>Wellness Week</span>
                                                                <Star className="w-5 h-5 text-yellow-500" />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>Mindful User</span>
                                                                <Star className="w-5 h-5 text-yellow-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Achievement Progress */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border}`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Achievement Progress</h4>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>Social Butterfly</span>
                                                                <span className={`text-sm font-medium ${themeClasses.text}`}>75%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full" style={{width: '75%'}}></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>Content Creator</span>
                                                                <span className={`text-sm font-medium ${themeClasses.text}`}>60%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" style={{width: '60%'}}></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className={`text-sm ${themeClasses.textSecondary}`}>Wellness Champion</span>
                                                                <span className={`text-sm font-medium ${themeClasses.text}`}>90%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div className="bg-gradient-to-r from-red-500 to-rose-600 h-2 rounded-full" style={{width: '90%'}}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "analytics" && (
                                        <motion.div
                                            key="analytics"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="py-8">
                                                <div className="text-center mb-8">
                                                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                        <BarChart3 className="w-10 h-10 text-white" />
                                                    </div>
                                                    <h3 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Analytics Dashboard</h3>
                                                    <p className={`${themeClasses.textSecondary} mb-6`}>Real-time insights into your social media performance</p>
                                                </div>

                                                {/* Key Metrics */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Eye className="w-8 h-8 text-blue-500" />
                                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                                        </div>
                                                        <div className={`text-3xl font-bold ${themeClasses.text} mb-2`}>12.5K</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Total Views</div>
                                                        <div className="text-xs text-green-500 mt-2">+15% this week</div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Heart className="w-8 h-8 text-red-500" />
                                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                                        </div>
                                                        <div className={`text-3xl font-bold ${themeClasses.text} mb-2`}>2.3K</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Total Likes</div>
                                                        <div className="text-xs text-green-500 mt-2">+8% this week</div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <MessageCircle className="w-8 h-8 text-purple-500" />
                                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                                        </div>
                                                        <div className={`text-3xl font-bold ${themeClasses.text} mb-2`}>456</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Total Comments</div>
                                                        <div className="text-xs text-green-500 mt-2">+12% this week</div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Share className="w-8 h-8 text-cyan-500" />
                                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                                        </div>
                                                        <div className={`text-3xl font-bold ${themeClasses.text} mb-2`}>89</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Total Shares</div>
                                                        <div className="text-xs text-green-500 mt-2">+5% this week</div>
                                                    </div>
                                                </div>

                                                {/* Engagement Chart */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} mb-8`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Engagement Over Time</h4>
                                                    <div className="h-64 flex items-end justify-between space-x-2">
                                                        {[65, 78, 82, 75, 88, 92, 85, 90, 87, 95, 88, 92].map((height, index) => (
                                                            <div key={index} className="flex-1 flex flex-col items-center">
                                                                <div 
                                                                    className="w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t"
                                                                    style={{ height: `${height}%` }}
                                                                ></div>
                                                                <span className={`text-xs ${themeClasses.textSecondary} mt-2`}>
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between mt-4">
                                                        <span className={`text-sm ${themeClasses.textSecondary}`}>Last 12 days</span>
                                                        <span className={`text-sm ${themeClasses.textSecondary}`}>Engagement Rate: 4.2%</span>
                                                    </div>
                                                </div>

                                                {/* Top Performing Content */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border}`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Top Performing Content</h4>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                                                    <Grid3X3 className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <div className={`font-medium ${themeClasses.text}`}>My Latest Post</div>
                                                                    <div className={`text-sm ${themeClasses.textSecondary}`}>2 hours ago</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`font-bold ${themeClasses.text}`}>1.2K views</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary}`}>95% engagement</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                                                    <Video className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <div className={`font-medium ${themeClasses.text}`}>DeSnap Video</div>
                                                                    <div className={`text-sm ${themeClasses.textSecondary}`}>1 day ago</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`font-bold ${themeClasses.text}`}>856 views</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary}`}>87% engagement</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "wellness" && (
                                        <motion.div
                                            key="wellness"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="py-8">
                                                <div className="text-center mb-8">
                                                    <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                        <Heart className="w-10 h-10 text-white" />
                                                    </div>
                                                    <h3 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Wellness Dashboard</h3>
                                                    <p className={`${themeClasses.textSecondary} mb-6`}>Track your mental health and social media wellness</p>
                                                </div>

                                                {/* Wellness Metrics */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Heart className="w-8 h-8 text-red-500" />
                                                            <div className="text-2xl font-bold text-red-500">85%</div>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Mental Health</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Current mood and wellness level</div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                                            <div className="bg-gradient-to-r from-red-500 to-rose-600 h-2 rounded-full" style={{width: '85%'}}></div>
                                                        </div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Activity className="w-8 h-8 text-green-500" />
                                                            <div className="text-2xl font-bold text-green-500">92%</div>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Social Balance</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Healthy social media usage</div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{width: '92%'}}></div>
                                                        </div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Sun className="w-8 h-8 text-yellow-500" />
                                                            <div className="text-2xl font-bold text-yellow-500">78%</div>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Energy Level</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Daily energy and motivation</div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                                            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full" style={{width: '78%'}}></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mood Tracker */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} mb-8`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Mood Tracker</h4>
                                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                                            <div key={day} className="text-center">
                                                                <div className="text-xs text-gray-400 mb-2">{day}</div>
                                                                <div className={`w-8 h-8 rounded-full mx-auto ${
                                                                    index < 5 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-300'
                                                                }`}></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className={`${themeClasses.textSecondary}`}>Weekly mood average: Happy</span>
                                                        <span className={`${themeClasses.textSecondary}`}>7-day streak</span>
                                                    </div>
                                                </div>

                                                {/* Wellness Tips */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border}`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Wellness Tips</h4>
                                                    <div className="space-y-4">
                                                        <div className="flex items-start space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <Sun className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <div className={`font-medium ${themeClasses.text} mb-1`}>Take Regular Breaks</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary}`}>Step away from social media every 2 hours for better mental health</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start space-x-3 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                                                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <Heart className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <div className={`font-medium ${themeClasses.text} mb-1`}>Practice Mindfulness</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary}`}>Take 5 minutes daily to reflect on your social media usage</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start space-x-3 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                                                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <Sparkles className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <div className={`font-medium ${themeClasses.text} mb-1`}>Positive Content</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary}`}>Focus on creating and consuming uplifting content</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "goals" && (
                                        <motion.div
                                            key="goals"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="py-8">
                                                <div className="text-center mb-8">
                                                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                        <Target className="w-10 h-10 text-white" />
                                                    </div>
                                                    <h3 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Goal Tracker</h3>
                                                    <p className={`${themeClasses.textSecondary} mb-6`}>Set and track your personal and social media goals</p>
                                                </div>

                                                {/* Active Goals */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Users className="w-8 h-8 text-blue-500" />
                                                            <div className="text-2xl font-bold text-blue-500">75%</div>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Reach 1000 Followers</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary} mb-3`}>Currently at 750 followers</div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full" style={{width: '75%'}}></div>
                                                        </div>
                                                        <div className="text-xs text-blue-500 mt-2">250 more to go!</div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Heart className="w-8 h-8 text-red-500" />
                                                            <div className="text-2xl font-bold text-red-500">60%</div>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Post Daily for a Month</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary} mb-3`}>18 days completed</div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div className="bg-gradient-to-r from-red-500 to-rose-600 h-2 rounded-full" style={{width: '60%'}}></div>
                                                        </div>
                                                        <div className="text-xs text-red-500 mt-2">12 days remaining</div>
                                                    </div>
                                                </div>

                                                {/* Goal Categories */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} mb-8`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Goal Categories</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                                                            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                                            <div className={`text-sm font-medium ${themeClasses.text}`}>Social</div>
                                                            <div className={`text-xs ${themeClasses.textSecondary}`}>3 goals</div>
                                                        </div>
                                                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                                                            <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                                                            <div className={`text-sm font-medium ${themeClasses.text}`}>Creative</div>
                                                            <div className={`text-xs ${themeClasses.textSecondary}`}>2 goals</div>
                                                        </div>
                                                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                                                            <Heart className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                                            <div className={`text-sm font-medium ${themeClasses.text}`}>Wellness</div>
                                                            <div className={`text-xs ${themeClasses.textSecondary}`}>1 goal</div>
                                                        </div>
                                                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                                                            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                                            <div className={`text-sm font-medium ${themeClasses.text}`}>Achievement</div>
                                                            <div className={`text-xs ${themeClasses.textSecondary}`}>2 goals</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Goal Progress Chart */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border}`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Monthly Progress</h4>
                                                    <div className="h-32 flex items-end justify-between space-x-2">
                                                        {[45, 52, 48, 61, 58, 67, 72, 68, 75, 78, 82, 85].map((height, index) => (
                                                            <div key={index} className="flex-1 flex flex-col items-center">
                                                                <div 
                                                                    className="w-full bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t"
                                                                    style={{ height: `${height}%` }}
                                                                ></div>
                                                                <span className={`text-xs ${themeClasses.textSecondary} mt-2`}>
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between mt-4">
                                                        <span className={`text-sm ${themeClasses.textSecondary}`}>Goal completion rate</span>
                                                        <span className={`text-sm font-medium ${themeClasses.text}`}>85% this month</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "memories" && (
                                        <motion.div
                                            key="memories"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="py-8">
                                                <div className="text-center mb-8">
                                                    <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                        <Clock className="w-10 h-10 text-white" />
                                                    </div>
                                                    <h3 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Memory Lane</h3>
                                                    <p className={`${themeClasses.textSecondary} mb-6`}>Relive your favorite moments and milestones</p>
                                                </div>

                                                {/* Memory Timeline */}
                                                <div className="space-y-6">
                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-start space-x-4">
                                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <Calendar className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className={`text-lg font-semibold ${themeClasses.text} mb-1`}>First Post Anniversary</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary} mb-2`}>1 year ago today</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary}`}>You shared your first post and started your journey on the platform</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-2xl font-bold ${themeClasses.text}`}>365</div>
                                                                <div className={`text-xs ${themeClasses.textSecondary}`}>days ago</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-start space-x-4">
                                                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <Trophy className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className={`text-lg font-semibold ${themeClasses.text} mb-1`}>Viral Content Milestone</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary} mb-2`}>6 months ago</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary}`}>Your DeSnap reached 10K views and became your most popular content</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-2xl font-bold ${themeClasses.text}`}>10K</div>
                                                                <div className={`text-xs ${themeClasses.textSecondary}`}>views</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-start space-x-4">
                                                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <Users className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className={`text-lg font-semibold ${themeClasses.text} mb-1`}>500 Followers Celebration</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary} mb-2`}>3 months ago</div>
                                                                <div className={`text-sm ${themeClasses.textSecondary}`}>You reached your first major follower milestone</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-2xl font-bold ${themeClasses.text}`}>500</div>
                                                                <div className={`text-xs ${themeClasses.textSecondary}`}>followers</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Memory Stats */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} mt-8`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Memory Statistics</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="text-center">
                                                            <div className={`text-2xl font-bold ${themeClasses.text}`}>24</div>
                                                            <div className={`text-sm ${themeClasses.textSecondary}`}>Memories</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className={`text-2xl font-bold ${themeClasses.text}`}>365</div>
                                                            <div className={`text-sm ${themeClasses.textSecondary}`}>Days Active</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className={`text-2xl font-bold ${themeClasses.text}`}>12</div>
                                                            <div className={`text-sm ${themeClasses.textSecondary}`}>Milestones</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className={`text-2xl font-bold ${themeClasses.text}`}>5</div>
                                                            <div className={`text-sm ${themeClasses.textSecondary}`}>Viral Posts</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                </AnimatePresence>
                            </div>
                                </div>
                                </div>
                                </div>
                            </div>

            {/* Modals */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onProfileUpdated={(updatedProfile) => {
                    setProfile(updatedProfile);
                    setShowEditModal(false);
                }}
            />

            <CreateStoryModal
                isOpen={showCreateStoryModal}
                onClose={() => setShowCreateStoryModal(false)}
                onStoryCreated={(newStory) => {
                    setProfile(prev => prev ? {
                        ...prev,
                        stories: [newStory, ...prev.stories]
                    } : null);
                    setShowCreateStoryModal(false);
                }}
            />

                        </div>
        </>
    );
}

// UserPosts component to display user's posts
const UserPosts = ({ userId }: { userId?: string }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);

    useEffect(() => {
        if (!userId) return;
        
        const fetchUserPosts = async () => {
            try {
                setLoading(true);
                const response = await apiFetch(`/api/posts/user/${userId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }
                
                const data = await response.json();
                setPosts(data.posts || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load posts');
            } finally {
                setLoading(false);
            }
        };

        fetchUserPosts();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-400">No posts yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <div key={post.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.location.href = `/profile?userId=${post.author?.id}`}
                                className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold hover:shadow-lg transition-all duration-300 cursor-pointer"
                            >
                                {post.author?.name?.charAt(0) || 'U'}
                            </motion.button>
                            </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => window.location.href = `/profile?userId=${post.author?.id}`}
                                    className="font-semibold text-white hover:text-cyan-400 transition-colors cursor-pointer"
                                >
                                    {post.author?.name || 'Unknown'}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => window.location.href = `/profile?userId=${post.author?.id}`}
                                    className="text-gray-400 text-sm hover:text-cyan-400 transition-colors cursor-pointer"
                                >
                                    @{post.author?.username || 'unknown'}
                                </motion.button>
                                <span className="text-gray-500 text-sm">•</span>
                                <span className="text-gray-500 text-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                                <p className="text-gray-300 mb-3">{post.content}</p>
                            <div className="flex items-center space-x-4 text-gray-400">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                                >
                                    <Heart size={16} />
                                    <span>{post.likes || 0}</span>
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setSelectedPost(post);
                                        setShowCommentModal(true);
                                    }}
                                    className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
                                >
                                    <MessageCircle size={16} />
                                    <span>{post.comments || 0}</span>
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center space-x-1 hover:text-green-400 transition-colors"
                                >
                                    <Share size={16} />
                                    <span>Share</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Comment Modal */}
            {showCommentModal && selectedPost && (
                <CommentModal
                    isOpen={showCommentModal}
                    onClose={() => {
                        setShowCommentModal(false);
                        setSelectedPost(null);
                    }}
                    postId={selectedPost.id}
                    postContent={selectedPost.content}
                    postAuthor={selectedPost.author?.name || 'Unknown'}
                />
            )}
        </div>
    );
};