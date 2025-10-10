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
    Play,
    Pause,
    Volume2,
    VolumeX,
    Share,
    Bookmark,
    Eye,
    Clock,
    Globe,
    Lock,
    UserCheck,
    Sparkles,
    Zap,
    Trophy,
    Target,
    TrendingUp,
    Star,
    Award,
    Crown,
    Flame,
    Diamond,
    Shield,
    Badge,
    Gift,
    Wand2,
    Wand,
    Plus,
    Settings,
    Bell,
    Palette,
    Layers,
    Grid3X3,
    List,
    Filter,
    Search,
    ChevronDown,
    ChevronUp,
    Activity,
    BarChart3,
    Calendar,
    MapPin,
    Link as LinkIcon,
    Mail,
    Phone,
    Instagram,
    Twitter,
    Github,
    Linkedin,
    Youtube,
    Twitch,
    Discord,
    Telegram,
    Snapchat,
    Tiktok,
    Facebook,
    Pinterest,
    Reddit,
    Spotify
} from "lucide-react";
import { getUserProfile } from "../../../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSearchParams } from "next/navigation";
import EditProfileModal from "@/app/layoutElementsComps/navdir/EditProfileModal";
import CreateStoryModal from "@/app/layoutElementsComps/navdir/CreateStoryModal";
import DeSnapsViewer from "@/components/DeSnapsViewer";
import DeSnapCreator from "@/components/DeSnapCreator";
import CreateDeSnapModal from "@/components/CreateDeSnapModal";
import MoodFilter from "@/components/MoodFilter";
import LiveSpaces from "@/components/LiveSpaces";
import TimeCapsules from "@/components/TimeCapsules";
import EmotionTracker from "@/components/EmotionTracker";
import AISuggestions from "@/components/AISuggestions";
import AnonymousInsights from "@/components/AnonymousInsights";
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
    
    // Unique Features State
    const [showMoodFilter, setShowMoodFilter] = useState(false);
    const [showLiveSpaces, setShowLiveSpaces] = useState(false);
    const [showTimeCapsules, setShowTimeCapsules] = useState(false);
    const [showEmotionTracker, setShowEmotionTracker] = useState(false);
    const [showAISuggestions, setShowAISuggestions] = useState(false);
    const [showAnonymousInsights, setShowAnonymousInsights] = useState(false);
    const [showDeSnapModal, setShowDeSnapModal] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);

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
            <div className="max-w-4xl mx-auto mt-6 rounded-2xl shadow-2xl bg-gradient-to-b from-gray-900 to-black overflow-hidden border border-gray-800 p-6">
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
            <div className="max-w-4xl mx-auto mt-6 rounded-2xl shadow-2xl bg-gradient-to-b from-gray-900 to-black overflow-hidden border border-gray-800 p-6">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
                    <p className="text-gray-300">{error}</p>
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
            <div className="max-w-4xl mx-auto mt-6 rounded-2xl shadow-2xl bg-gradient-to-b from-gray-900 to-black overflow-hidden border border-gray-800 p-6">
                <div className="text-center">
                    <div className="text-gray-400 text-xl mb-2">👤</div>
                    <p className="text-gray-300">Profile not found</p>
                </div>
            </div>
        );

    const { coverPicture, profilePicture, name, username, bio, followersCount, followingCount, likesCount, stories } =
        profile;

    return (
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
                                <button
                                    type="button"
                                    className="absolute bottom-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                                >
                                    <Camera size={20} />
                                </button>
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
                                    <button className="mt-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all">
                                        Add Cover Photo
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                {/* Modern Profile Section */}
                <div className="relative px-6 pb-6">
                    {/* Profile Picture */}
                    <div className="absolute -top-24 left-6">
                        <div className="relative">
                            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${themeClasses.border} shadow-2xl`}>
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
                                style={{ 
                                    width: '100%', 
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    display: 'block'
                                }}
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
                            </div>
                            {isOwnProfile && (
                                <button
                                    type="button"
                                    className="absolute -bottom-2 -right-2 p-2 bg-white/90 backdrop-blur-md rounded-full text-gray-700 hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg"
                                >
                                    <Camera size={16} />
                                </button>
                            )}
                        </div>

                <div className="flex justify-end gap-2 mt-2">
                    {isOwnProfile ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(true)}
                                className="p-2 rounded-full hover:bg-gray-800 text-white"
                                title="Edit Profile"
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                type="button"
                                className="p-2 rounded-full hover:bg-gray-800 text-white"
                                title="Settings"
                            >
                                <MoreVertical size={18} />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="p-2 rounded-full hover:bg-gray-800 text-white"
                            title="More Options"
                        >
                            <MoreVertical size={18} />
                        </button>
                    )}
                </div>

                    {/* Modern Profile Info Section */}
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

                        {/* Stats */}
                        <div className="flex items-center space-x-8 mb-6">
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${themeClasses.text}`}>{followersCount}</div>
                                <div className={`text-sm ${themeClasses.textSecondary}`}>Followers</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${themeClasses.text}`}>{followingCount}</div>
                                <div className={`text-sm ${themeClasses.textSecondary}`}>Following</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${themeClasses.text}`}>{likesCount}</div>
                                <div className={`text-sm ${themeClasses.textSecondary}`}>Likes</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 mb-6">
                            {isOwnProfile ? (
                                <>
                                    <motion.button
                                        type="button"
                                        onClick={() => setShowEditModal(true)}
                                        whileTap={{ scale: 0.95 }}
                                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${themeClasses.hover} ${themeClasses.border} border shadow-lg`}
                                    >
                                        <Edit size={18} />
                                        <span>Edit Profile</span>
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.95 }}
                                        className={`p-3 rounded-xl ${themeClasses.hover} ${themeClasses.border} border transition-all duration-300`}
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
                                        onClick={handleFollowToggle}
                                        disabled={busyFollow}
                                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                            isFollowing
                                                ? `${themeClasses.hover} ${themeClasses.border} border`
                                                : `bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 shadow-lg`
                                        } ${busyFollow ? "opacity-70 cursor-wait" : ""}`}
                                    >
                                        {busyFollow ? "..." : isFollowing ? "Following" : "Follow"}
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleStartChat}
                                        className={`p-3 rounded-xl ${themeClasses.hover} ${themeClasses.border} border transition-all duration-300`}
                                        title="Message"
                                    >
                                        <MessageCircle size={18} />
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.95 }}
                                        className={`p-3 rounded-xl ${themeClasses.hover} ${themeClasses.border} border transition-all duration-300`}
                                        title="More"
                                    >
                                        <MoreVertical size={18} />
                                    </motion.button>
                                </>
                            )}
                        </div>
                </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                            {[
                                { id: "posts", label: "Posts", icon: Grid3X3 },
                                { id: "desnaps", label: "DeSnaps", icon: Video },
                                { id: "stories", label: "Stories", icon: Sparkles },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                                        activeTab === tab.id
                                            ? `${themeClasses.accent} border-b-2 border-current`
                                            : `${themeClasses.textSecondary} hover:${themeClasses.text}`
                                    }`}
                                >
                                    <tab.icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex border-t border-gray-800">
                {["posts", "stories", "desnaps", "media", "about"].map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                            activeTab === tab
                                ? "text-indigo-400 border-b-2 border-indigo-400"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        {tab === "desnaps" ? (
                            <>
                                <Zap size={16} />
                                DeSnaps
                            </>
                        ) : (
                            tab.charAt(0).toUpperCase() + tab.slice(1)
                        )}
                    </button>
                ))}
            </div>

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

                    {activeTab === "stories" && (
                        <motion.div
                            key="stories"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Stories</h3>
                                {isOwnProfile && (
                                    <button
                                        onClick={() => setShowCreateStoryModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                    >
                                        <Camera size={16} />
                                        Add Story
                                    </button>
                                )}
                            </div>
                            {stories?.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Story Navigation */}
                                    {stories.length > 1 && (
                                        <div className="flex items-center justify-center gap-2 mb-4">
                                            <button
                                                onClick={() => setSelectedStoryIndex(Math.max(0, selectedStoryIndex - 1))}
                                                disabled={selectedStoryIndex === 0}
                                                className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ←
                                            </button>
                                            <span className="text-sm text-gray-400">
                                                {selectedStoryIndex + 1} of {stories.length}
                                            </span>
                                            <button
                                                onClick={() => setSelectedStoryIndex(Math.min(stories.length - 1, selectedStoryIndex + 1))}
                                                disabled={selectedStoryIndex === stories.length - 1}
                                                className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                →
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* Current Story Display */}
                                    <div className="relative">
                                        {stories.map((story, i) => (
                                            <div
                                                key={story.id}
                                                className={`aspect-video rounded-xl border border-gray-700 shadow-md bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden relative group ${
                                                    i === selectedStoryIndex ? 'block' : 'hidden'
                                                }`}
                                            >
                                                {story.content?.startsWith('http') ? (
                                                    <img 
                                                        src={story.content} 
                                                        alt="Story" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center p-8">
                                                        <p className="text-gray-300 text-lg text-center">
                                                            {story.content}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {/* Visibility indicator */}
                                                <div className="absolute top-4 right-4">
                                                    {story.visibility === 'public' && <Globe size={16} className="text-green-400" />}
                                                    {story.visibility === 'followers' && <Users size={16} className="text-blue-400" />}
                                                    {story.visibility === 'close_friends' && <UserCheck size={16} className="text-purple-400" />}
                                                    {story.visibility === 'premium' && <Sparkles size={16} className="text-yellow-400" />}
                                                </div>
                                                
                                                {/* Story info overlay */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                                    <div className="flex items-center justify-between text-sm text-white">
                                                        <div className="flex items-center gap-4">
                                                            <span>{story.views || 0} views</span>
                                                            <span>{story.duration || 24}h</span>
                                                        </div>
                                                        <div className="text-xs text-gray-300">
                                                            {new Date(story.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Story Thumbnails */}
                                    {stories.length > 1 && (
                                        <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                                            {stories.map((story, i) => (
                                                <button
                                                    key={story.id}
                                                    onClick={() => setSelectedStoryIndex(i)}
                                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                                        i === selectedStoryIndex 
                                                            ? 'border-indigo-500 scale-110' 
                                                            : 'border-gray-600 hover:border-gray-500'
                                                    }`}
                                                >
                                                    {story.content?.startsWith('http') ? (
                                                        <img 
                                                            src={story.content} 
                                                            alt="Story thumbnail" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                                            <span className="text-xs text-gray-300">📝</span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Camera size={48} className="text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400">No stories yet.</p>
                                    {isOwnProfile && (
                                        <button
                                            onClick={() => setShowCreateStoryModal(true)}
                                            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                        >
                                            Create your first story
                                        </button>
                                    )}
                                </div>
                            )}
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
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Zap size={20} className="text-yellow-400" />
                                    DeSnaps
                                </h3>
                                {isOwnProfile && (
                                    <button
                                        onClick={() => setShowCreateDeSnapModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                                    >
                                        <Video size={16} />
                                        Create DeSnap
                                    </button>
                                )}
                            </div>
                            {profile?.deSnaps?.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {profile.deSnaps.map((deSnap, i) => (
                                        <div
                                            key={deSnap.id}
                                            onClick={() => {
                                                setSelectedDeSnap(deSnap);
                                                setShowDeSnapsViewer(true);
                                            }}
                                            className="aspect-[9/16] rounded-xl border border-gray-700 shadow-md bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden cursor-pointer hover:scale-105 transition-transform relative group"
                                        >
                                            {deSnap.thumbnail ? (
                                                <img 
                                                    src={deSnap.thumbnail} 
                                                    alt="DeSnap" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-4">
                                                    <Video size={32} className="text-gray-400" />
                                                </div>
                                            )}
                                            
                                            {/* Play button overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play size={32} className="text-white" />
                                            </div>
                                            
                                            {/* Visibility indicator */}
                                            <div className="absolute top-2 right-2">
                                                {deSnap.visibility === 'public' && <Globe size={12} className="text-green-400" />}
                                                {deSnap.visibility === 'followers' && <Users size={12} className="text-blue-400" />}
                                                {deSnap.visibility === 'close_friends' && <UserCheck size={12} className="text-purple-400" />}
                                                {deSnap.visibility === 'premium' && <Sparkles size={12} className="text-yellow-400" />}
                                            </div>
                                            
                                            {/* DeSnap info overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                                <div className="flex items-center justify-between text-xs text-white">
                                                    <span>{deSnap.views} views</span>
                                                    <span>{Math.floor(deSnap.duration / 60)}:{(deSnap.duration % 60).toString().padStart(2, '0')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Heart size={12} className={deSnap.isLiked ? "text-red-400 fill-current" : "text-gray-400"} />
                                                        {deSnap.likes}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle size={12} className="text-gray-400" />
                                                        {deSnap.comments}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Video size={48} className="text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-400">No DeSnaps yet.</p>
                                    {isOwnProfile && (
                                        <button
                                            onClick={() => setShowCreateDeSnapModal(true)}
                                            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                                        >
                                            Create your first DeSnap
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "media" && (
                        <motion.div
                            key="media"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-3 gap-2"
                        >
                            {stories?.filter(
                                (s) =>
                                    typeof s.content === "string" &&
                                    (s.content.startsWith("http://") ||
                                        s.content.startsWith("https://"))
                            ).length > 0 ? (
                                stories
                                    .filter(
                                        (s) =>
                                            typeof s.content === "string" &&
                                            (s.content.startsWith("http://") ||
                                                s.content.startsWith("https://"))
                                    )
                                    .map((s, i) => (
                                        <img
                                            key={s.id}
                                            src={s.content}
                                            alt={`media-${i}`}
                                            className="rounded-lg object-cover w-full h-32"
                                            loading="lazy"
                                            onError={(e) =>
                                                (e.currentTarget.style.display = "none")
                                            }
                                        />
                                    ))
                            ) : (
                                <p className="text-gray-400 col-span-3">
                                    No media found.
                                </p>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "about" && (
                        <motion.div
                            key="about"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="text-gray-300 space-y-6"
                        >
                            <div>
                                <h3 className="font-semibold text-lg text-white mb-3">
                                About {name}
                            </h3>
                                <p className="leading-relaxed">{bio || "No bio available"}</p>
                            </div>

                            {/* Profile Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-cyan-400">{followersCount}</div>
                                    <div className="text-sm text-gray-400">Followers</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-400">{followingCount}</div>
                                    <div className="text-sm text-gray-400">Following</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-pink-400">{likesCount}</div>
                                    <div className="text-sm text-gray-400">Likes</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-400">{profile?.deSnaps?.length || 0}</div>
                                    <div className="text-sm text-gray-400">DeSnaps</div>
                                </div>
                            </div>

                            {/* Activity Timeline */}
                            <div>
                                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                                    <Clock size={18} />
                                    Recent Activity
                                </h4>
                                <div className="space-y-3">
                                    {profile?.stories?.slice(0, 3).map((story, index) => (
                                        <div key={story.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                <Camera size={16} className="text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-white">Created a story</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(story.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!profile?.stories || profile.stories.length === 0) && (
                                        <p className="text-gray-400 text-sm">No recent activity</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Unique Features Section - Only for own profile */}
            {isOwnProfile && (
                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Sparkles size={20} className="text-yellow-400" />
                            Unique Features
                        </h3>
                        <button
                            onClick={() => setShowMoodFilter(true)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm hover:bg-blue-500/30 transition-all"
                        >
                            All Features
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowMoodFilter(true)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm hover:bg-blue-500/30 transition-all"
                        >
                            Mood Filter
                        </button>
                        <button
                            onClick={() => setShowLiveSpaces(true)}
                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm hover:bg-green-500/30 transition-all"
                        >
                            Live Spaces
                        </button>
                        <button
                            onClick={() => setShowTimeCapsules(true)}
                            className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm hover:bg-purple-500/30 transition-all"
                        >
                            Time Capsules
                        </button>
                        <button
                            onClick={() => setShowEmotionTracker(true)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm hover:bg-red-500/30 transition-all"
                        >
                            Emotion Tracker
                        </button>
                        <button
                            onClick={() => setShowAISuggestions(true)}
                            className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm hover:bg-indigo-500/30 transition-all"
                        >
                            AI Suggestions
                        </button>
                        <button
                            onClick={() => setShowAnonymousInsights(true)}
                            className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm hover:bg-gray-500/30 transition-all"
                        >
                            Anonymous Insights
                        </button>
                        <button
                            onClick={() => setShowQuickActions(!showQuickActions)}
                            className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm hover:bg-yellow-500/30 transition-all flex items-center space-x-1"
                        >
                            <span>⚡</span>
                            <span>Quick Actions</span>
                        </button>
                    </div>
                </div>
            )}

            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onProfileUpdated={(updatedProfile) => {
                    console.log("Profile updated:", updatedProfile);
                    setProfile(prev => {
                        if (!prev) return null;
                        const newProfile = { ...prev, ...updatedProfile };
                        console.log("New profile state:", newProfile);
                        return newProfile;
                    });
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

            <CreateDeSnapModal
                isOpen={showCreateDeSnapModal}
                onClose={() => setShowCreateDeSnapModal(false)}
                onDeSnapCreated={(newDeSnap) => {
                    setProfile(prev => prev ? {
                        ...prev,
                        deSnaps: [newDeSnap, ...prev.deSnaps]
                    } : null);
                    setShowCreateDeSnapModal(false);
                }}
            />

            {showDeSnapsViewer && selectedDeSnap && (
                <DeSnapsViewer
                    isOpen={showDeSnapsViewer}
                    onClose={() => {
                        setShowDeSnapsViewer(false);
                        setSelectedDeSnap(null);
                    }}
                    deSnap={selectedDeSnap}
                    onDeSnapUpdated={(updatedDeSnap) => {
                        setProfile(prev => prev ? {
                            ...prev,
                            deSnaps: prev.deSnaps.map(ds => 
                                ds.id === updatedDeSnap.id ? updatedDeSnap : ds
                            )
                        } : null);
                    }}
                />
            )}

            {/* Unique Features Modals */}
            <MoodFilter
                isOpen={showMoodFilter}
                onClose={() => setShowMoodFilter(false)}
                onMoodChange={(mood, filters) => {
                    console.log("Mood filter applied:", { mood, filters });
                }}
            />

            <LiveSpaces
                isOpen={showLiveSpaces}
                onClose={() => setShowLiveSpaces(false)}
                onCreateSpace={(spaceData) => {
                    console.log("Live space created:", spaceData);
                }}
                onJoinSpace={(spaceId) => {
                    console.log("Joined live space:", spaceId);
                }}
            />

            <TimeCapsules
                isOpen={showTimeCapsules}
                onClose={() => setShowTimeCapsules(false)}
                onCreateCapsule={(capsuleData) => {
                    console.log("Time capsule created:", capsuleData);
                }}
                onRevealCapsule={(capsuleId) => {
                    console.log("Time capsule revealed:", capsuleId);
                }}
            />

            <EmotionTracker
                isOpen={showEmotionTracker}
                onClose={() => setShowEmotionTracker(false)}
                onEmotionRecorded={(emotionData) => {
                    console.log("Emotion recorded:", emotionData);
                }}
            />

            <AISuggestions
                isOpen={showAISuggestions}
                onClose={() => setShowAISuggestions(false)}
                onSuggestionSelected={(suggestion) => {
                    console.log("AI suggestion selected:", suggestion);
                }}
            />

            <AnonymousInsights
                isOpen={showAnonymousInsights}
                onClose={() => setShowAnonymousInsights(false)}
                onInsightReceived={(insight) => {
                    console.log("Anonymous insight received:", insight);
                }}
            />

            {/* Quick Actions Modal */}
            {showQuickActions && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">⚡ Quick Actions</h3>
                            <button
                                onClick={() => setShowQuickActions(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setShowDeSnapModal(true);
                                    setShowQuickActions(false);
                                }}
                                className="w-full p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2"
                            >
                                <span>📸</span>
                                <span>Create DeSnap</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateStoryModal(true);
                                    setShowQuickActions(false);
                                }}
                                className="w-full p-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center space-x-2"
                            >
                                <span>📖</span>
                                <span>Create Story</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowMoodFilter(true);
                                    setShowQuickActions(false);
                                }}
                                className="w-full p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2"
                            >
                                <span>😊</span>
                                <span>Mood Filter</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowEmotionTracker(true);
                                    setShowQuickActions(false);
                                }}
                                className="w-full p-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all flex items-center justify-center space-x-2"
                            >
                                <span>💭</span>
                                <span>Track Emotion</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DeSnapCreator
                isOpen={showDeSnapModal}
                onClose={() => setShowDeSnapModal(false)}
                onDeSnapCreated={(newDeSnap) => {
                    setProfile(prev => prev ? {
                        ...prev,
                        deSnaps: [newDeSnap, ...prev.deSnaps]
                    } : null);
                    setShowDeSnapModal(false);
                }}
            />
        </div>
    );
}

// UserPosts component to display user's posts
const UserPosts = ({ userId }: { userId?: string }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            } catch (err: any) {
                console.error('Error fetching user posts:', err);
                setError(err.message || 'Failed to load posts');
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
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm font-medium text-white">{post.author?.name || 'Unknown'}</p>
                                <span className="text-xs text-gray-400">•</span>
                                <p className="text-xs text-gray-400">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            
                            {post.content && (
                                <p className="text-gray-300 mb-3">{post.content}</p>
                            )}
                            
                            {post.imageUrl && (
                                <div className="mb-3">
                                    <img 
                                        src={post.imageUrl} 
                                        alt="Post image" 
                                        className="max-w-full h-auto rounded-lg"
                                    />
                                </div>
                            )}
                            
                            {post.videoUrl && (
                                <div className="mb-3">
                                    <video 
                                        src={post.videoUrl} 
                                        controls 
                                        className="max-w-full h-auto rounded-lg"
                                    />
                                </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <button className="flex items-center space-x-1 hover:text-red-400 transition-colors">
                                    <Heart className="w-4 h-4" />
                                    <span>{post.likes || 0}</span>
                                </button>
                                <button className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{post.comments || 0}</span>
                                </button>
                                <button className="flex items-center space-x-1 hover:text-green-400 transition-colors">
                                    <Share className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};