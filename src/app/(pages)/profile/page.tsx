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
    Zap
} from "lucide-react";
import { getUserProfile } from "../../../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import EditProfileModal from "@/app/layoutElementsComps/navdir/EditProfileModal";
import CreateStoryModal from "@/app/layoutElementsComps/navdir/CreateStoryModal";
import DeSnapsViewer from "@/components/DeSnapsViewer";
import CreateDeSnapModal from "@/components/CreateDeSnapModal";

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
    const searchParams = useSearchParams();
    const userIdFromUrl = searchParams.get('userId');
    const userId = userIdFromUrl || user?.id;
    const isOwnProfile = !userIdFromUrl || userIdFromUrl === user?.id?.toString();
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
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            // Wait for auth to load
            if (authLoading) {
                return;
            }

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
                    'user-id': user?.id || '',
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
        <div className="max-w-4xl mx-auto mt-6 rounded-2xl shadow-2xl bg-gradient-to-b from-gray-900 to-black overflow-hidden border border-gray-800">
            {/* Cover photo */}
            {coverPicture && (
                <div className="relative h-56">
                    <img
                        src={coverPicture}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <button
                        type="button"
                        className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full text-white hover:scale-110 transition"
                    >
                        <Camera size={18} />
                    </button>
                </div>
            )}

            <div className="relative px-6 pb-6">
                {/* Profile pic */}
                <div className="absolute -top-20 left-6">
                    <div className="relative w-36 h-36">
                    {profilePicture ? (
                        <motion.img
                                key={profilePicture} // Force re-render when profile picture changes
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 120 }}
                            src={profilePicture}
                            alt={name}
                                className="w-full h-full rounded-full border-4 border-gray-900 shadow-lg"
                            loading="lazy"
                                style={{ 
                                    width: '144px', 
                                    height: '144px',
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
                        <div className={`absolute inset-0 w-full h-full rounded-full border-4 border-gray-900 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold ${profilePicture ? "hidden" : ""}`}>
                        {name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="absolute bottom-2 right-2 p-2 bg-black/60 rounded-full text-white hover:scale-110 transition"
                    >
                        <Camera size={16} />
                    </button>
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

                <div className="mt-24 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">
                            {name}
                        </h2>
                        {username && (
                            <p className="text-gray-400">@{username}</p>
                        )}
                        {bio && (
                            <p className="mt-2 text-gray-300 max-w-xl">{bio}</p>
                        )}
                    </div>

                    {isOwnProfile ? (
                        <motion.button
                            type="button"
                            onClick={() => setShowEditModal(true)}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-2 rounded-full font-semibold shadow-md transition text-sm bg-indigo-500 text-white hover:bg-indigo-600"
                        >
                            Edit Profile
                        </motion.button>
                    ) : (
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={handleFollowToggle}
                            disabled={busyFollow}
                            className={`px-6 py-2 rounded-full font-semibold shadow-md transition text-sm ${
                                isFollowing
                                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                    : "bg-indigo-500 text-white hover:bg-indigo-600"
                            } ${busyFollow ? "opacity-70 cursor-wait" : ""}`}
                        >
                            {isFollowing ? "Unfollow" : "Follow"}
                        </motion.button>
                    )}
                </div>

                <div className="flex gap-6 mt-6 text-sm text-gray-300">
          <span className="flex items-center gap-1">
            <Users size={16} /> {followersCount}
          </span>
                    <span className="flex items-center gap-1">
            <UserIcon size={16} /> {followingCount}
          </span>
                    <span className="flex items-center gap-1">
            <Heart size={16} /> {likesCount}
          </span>
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
                            <p className="text-gray-400">No posts yet.</p>
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
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {stories.map((story, i) => (
                                        <div
                                            key={story.id}
                                            className="aspect-square rounded-xl border border-gray-700 shadow-md bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden cursor-pointer hover:scale-105 transition-transform relative group"
                                        >
                                            {story.content?.startsWith('http') ? (
                                                <img 
                                                    src={story.content} 
                                                    alt="Story" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-4">
                                                    <p className="text-gray-400 text-sm text-center">
                                                        {story.content}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {/* Visibility indicator */}
                                            <div className="absolute top-2 right-2">
                                                {story.visibility === 'public' && <Globe size={12} className="text-green-400" />}
                                                {story.visibility === 'followers' && <Users size={12} className="text-blue-400" />}
                                                {story.visibility === 'close_friends' && <UserCheck size={12} className="text-purple-400" />}
                                                {story.visibility === 'premium' && <Sparkles size={12} className="text-yellow-400" />}
                                            </div>
                                            
                                            {/* Story info overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex items-center justify-between text-xs text-white">
                                                    <span>{story.views || 0} views</span>
                                                    <span>{story.duration || 24}h</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                            className="text-gray-300"
                        >
                            <h3 className="font-semibold text-lg text-white">
                                About {name}
                            </h3>
                            <p className="mt-2 leading-relaxed">{bio}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
        </div>
    );
}