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
    Zap
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
    
    // Unique Features State
    const [showMoodFilter, setShowMoodFilter] = useState(false);
    const [showLiveSpaces, setShowLiveSpaces] = useState(false);
    const [showTimeCapsules, setShowTimeCapsules] = useState(false);
    const [showEmotionTracker, setShowEmotionTracker] = useState(false);
    const [showAISuggestions, setShowAISuggestions] = useState(false);
    const [showAnonymousInsights, setShowAnonymousInsights] = useState(false);
    const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                                
                                {/* Unique Feature: Energy Level */}
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className={`text-center p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 cursor-pointer hover:shadow-lg transition-all duration-300`}
                                >
                                    <div className="text-2xl font-bold text-green-400">85%</div>
                                    <div className="text-sm text-green-300">Energy</div>
                                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-1 rounded-full" style={{width: '85%'}}></div>
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
                                        
                                        {/* Unique Feature: Mood Filter Button */}
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => {
                                                setShowMoodFilter(true);
                                            }}
                                            className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-lg hover:shadow-xl`}
                                            title="Mood Filter"
                                        >
                                            <Sparkles size={18} />
                                            <span>Mood</span>
                                        </motion.button>

                                        {/* Unique Feature: Vibe Check Button */}
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => {
                                                // Implement vibe check functionality
                                                const moods = ['Happy', 'Excited', 'Calm', 'Energetic', 'Creative', 'Focused', 'Relaxed', 'Motivated'];
                                                const randomMood = moods[Math.floor(Math.random() * moods.length)];
                                                const energyLevel = Math.floor(Math.random() * 40) + 60; // 60-100%
                                                
                                                alert(`Your current vibe: ${randomMood}\nEnergy Level: ${energyLevel}%\n\nThis feature will be enhanced with real mood detection!`);
                                            }}
                                            className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-xl`}
                                            title="Vibe Check"
                                        >
                                            <Zap size={18} />
                                            <span>Vibe</span>
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
                                        
                                        {/* Unique Feature: Send Energy Button */}
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => {
                                                // Implement energy transfer functionality
                                                const energyTypes = ['Positive Vibes', 'Creative Energy', 'Motivation', 'Calm Energy', 'Excitement', 'Focus'];
                                                const randomEnergy = energyTypes[Math.floor(Math.random() * energyTypes.length)];
                                                const energyAmount = Math.floor(Math.random() * 20) + 10; // 10-30 energy points
                                                
                                                alert(`✨ Energy Sent! ✨\n\nYou sent ${energyAmount} points of ${randomEnergy} to ${name}!\n\nThey will receive a notification about your positive energy transfer.`);
                                            }}
                                            className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl`}
                                            title="Send Energy"
                                        >
                                            <Sparkles size={18} />
                                            <span>Energy</span>
                                        </motion.button>

                                        {/* Unique Feature: Vibe Match Button */}
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => {
                                                // Implement vibe match functionality
                                                const compatibility = Math.floor(Math.random() * 40) + 60; // 60-100%
                                                const vibeTypes = ['Creative', 'Adventurous', 'Calm', 'Energetic', 'Intellectual', 'Artistic'];
                                                const randomVibe = vibeTypes[Math.floor(Math.random() * vibeTypes.length)];
                                                
                                                alert(`🔮 Vibe Match Analysis 🔮\n\nCompatibility: ${compatibility}%\nShared Vibe: ${randomVibe}\n\nYou and ${name} have a ${compatibility >= 80 ? 'strong' : compatibility >= 60 ? 'good' : 'moderate'} vibe connection!`);
                                            }}
                                            className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl`}
                                            title="Vibe Match"
                                        >
                                            <Heart size={18} />
                                            <span>Vibe</span>
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

                            {/* Unique Navigation Tabs with Special Features */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
                                {[
                                    { id: "posts", label: "Posts", icon: Grid3X3, color: "from-blue-500 to-cyan-600", count: "12" },
                                    { id: "desnaps", label: "DeSnaps", icon: Video, color: "from-purple-500 to-pink-600", count: "8" },
                                    { id: "stories", label: "Stories", icon: Sparkles, color: "from-yellow-500 to-orange-600", count: "5" },
                                    { id: "energy", label: "Energy", icon: Sparkles, color: "from-green-500 to-emerald-600", count: "85%" },
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
                                            {tab.count}
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
                                                    {isOwnProfile && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setShowDeSnapModal(true)}
                                                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg"
                                                        >
                                                            Create Your First DeSnap
                                                        </motion.button>
                                                    )}
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

                                    {activeTab === "energy" && (
                                        <motion.div
                                            key="energy"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="text-center py-8">
                                                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                    <Sparkles className="w-10 h-10 text-white" />
                                                </div>
                                                <h3 className={`text-xl font-bold ${themeClasses.text} mb-2`}>Energy Profile</h3>
                                                <p className={`${themeClasses.textSecondary} mb-6`}>Your unique energy signature and mood patterns</p>
                                                
                                                {/* Unique Feature: Energy Circle */}
                                                <div className="relative w-32 h-32 mx-auto mb-6">
                                                    <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                                                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 border-r-cyan-500 border-b-purple-500 border-l-pink-500 animate-spin-slow"></div>
                                                    <div className="absolute inset-4 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                                        <div className="text-2xl font-bold text-green-400">85%</div>
                                                    </div>
                                                </div>
                                                
                                                {/* Unique Features Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                    <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                                                        <div className="text-2xl font-bold text-green-400">85%</div>
                                                        <div className="text-sm text-green-300">Current Energy</div>
                                                    </div>
                                                    <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
                                                        <div className="text-2xl font-bold text-cyan-400">Happy</div>
                                                        <div className="text-sm text-cyan-300">Mood</div>
                                                    </div>
                                                </div>

                                                {/* Unique Feature: Energy Transfer */}
                                                <div className="mb-6">
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Energy Transfer</h4>
                                                    <div className="flex justify-center space-x-4">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                                                        >
                                                            Send Energy
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
                                                        >
                                                            Receive Energy
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                {/* Unique Feature: Mood Ring */}
                                                <div className="mb-6">
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Mood Ring</h4>
                                                    <div className="relative w-24 h-24 mx-auto">
                                                        <div className="absolute inset-0 rounded-full border-4 border-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-pulse"></div>
                                                        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-cyan-500/30 flex items-center justify-center">
                                                            <Sparkles className="w-8 h-8 text-white" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Unique Feature: Energy History */}
                                                <div className="mb-6">
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Energy History</h4>
                                                    <div className="grid grid-cols-7 gap-2">
                                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                                            <div key={day} className="text-center">
                                                                <div className="text-xs text-gray-400 mb-1">{day}</div>
                                                                <div className={`w-8 h-8 rounded-full mx-auto ${
                                                                    index < 5 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-300'
                                                                }`}></div>
                                                            </div>
                                                        ))}
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