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
    Upload,
    X,
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
import { getUserProfile, apiFetch } from "../../../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getEnhancedThemeClasses } from "@/utils/enhancedThemeUtils";
import { notificationService } from "@/services/notificationService";
import { useSearchParams, useRouter } from "next/navigation";
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
import EditPostModal from "@/components/EditPostModal";
import FollowersModal from "@/components/FollowersModal";
import FollowersList from "@/components/FollowersList";
import ProfileAnalytics from "@/components/ProfileAnalytics";
import ProfileCustomization from "@/components/ProfileCustomization";
import PremiumUserIndicator from "@/components/PremiumUserIndicator";
import PhotoUploadModal from "@/components/PhotoUploadModal";
import { getThemeClasses, getButtonClasses, getCardClasses } from "@/utils/themeUtils";

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
    subscriptionTier?: 'monthly' | 'quarterly' | 'semiannual' | null;
}

export default function ProfilePage() {
    const { user, isLoading: authLoading } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const userIdFromUrl = searchParams.get('userId');
    // Fix: Only use current user's ID if no userIdFromUrl is provided
    const userId = userIdFromUrl ? userIdFromUrl : user?.id?.toString();
    const isOwnProfile = !userIdFromUrl || userIdFromUrl === user?.id?.toString();
    
    // State variables - moved before early returns
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
    
    // Followers/Following state
    const [showFollowersList, setShowFollowersList] = useState(false);
    const [showFollowingList, setShowFollowingList] = useState(false);
    const [listType, setListType] = useState<'followers' | 'following'>('followers');
    
    // Additional validation
    if (userIdFromUrl && userIdFromUrl !== user?.id?.toString()) {
        console.log('Loading different user profile:', userIdFromUrl, 'vs current user:', user?.id);
    }
    
    // Debug logging
    console.log('Profile Page Debug:', {
        userIdFromUrl,
        currentUserId: user?.id,
        finalUserId: userId,
        isOwnProfile,
        url: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries())
    });
    
    // Additional validation to prevent wrong profile loading
    if (userIdFromUrl && userIdFromUrl !== user?.id?.toString()) {
        console.log('🔍 Loading different user profile:', {
            requestedUserId: userIdFromUrl,
            currentUserId: user?.id,
            isDifferentUser: true
        });
    }
    
    // Ensure userId is always valid
    if (!userId || userId === 'undefined' || userId === 'null') {
        console.error('❌ Invalid userId detected:', userId);
        if (user?.id) {
            console.log('🔄 Redirecting to own profile');
            window.location.href = '/profile';
            return null;
        } else {
            console.log('🔄 Redirecting to login');
            window.location.href = '/login';
            return null;
        }
    }

    const themeClasses = getEnhancedThemeClasses(theme);
    
    const handleFollowersClick = () => {
        setListType('followers');
        setShowFollowersList(true);
    };
    
    const handleFollowingClick = () => {
        setListType('following');
        setShowFollowingList(true);
    };
    
    // State for modals and features
    const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');
    
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
    
    // Photo Upload State
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
    const [photoUploadType, setPhotoUploadType] = useState<'profile' | 'cover'>('profile');

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

            // Reset profile state when userId changes
            if (profile && profile.id.toString() !== userId) {
                console.log('User ID changed, resetting profile state');
                setProfile(null);
                setIsFollowing(false);
            }

            try {
                setLoading(true);
                setError(null);
                console.log('Loading profile for userId:', userId, 'type:', typeof userId);
                console.log('About to call getUserProfile with:', userId);
                const data = await getUserProfile(userId);
                console.log('getUserProfile returned:', data);
                
                if (!data) {
                    console.error('getUserProfile returned null');
                    console.log('Profile fetch failed for userId:', userId);
                    console.log('Is own profile:', isOwnProfile);
                    console.log('Current user ID:', user?.id);
                    
                    setError("Profile not found - User may not exist or has been deleted");
                    setLoading(false);
                    
                    // Don't redirect - just show the error message
                    console.log('❌ User profile not found for userId:', userId);
                    return;
                }
                
                console.log('Profile data loaded:', data);
                
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
                    profilePicture: data.profilePicture ?? null,
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
                    followersCount: data.followersCount ?? 0,
                    followingCount: data.followingCount ?? 0,
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
            const res = await apiFetch('/api/chat/create-or-find', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: profile.id
                })
            });

            if (res.ok) {
                const chatData = await res.json();
                // Navigate to the chat using router
                router.push(`/messeging/chat/${chatData.id}`);
            } else {
                console.error('Failed to create/find chat');
                // Show error notification
                await notificationService.showNotification({
                    title: 'Chat Error',
                    body: 'Failed to start chat. Please try again.',
                    tag: 'chat_error'
                });
                // Fallback: try to navigate to messaging page
                router.push('/messeging');
            }
        } catch (err) {
            console.error('Error starting chat:', err);
            // Show error notification
            await notificationService.showNotification({
                title: 'Chat Error',
                body: 'Failed to start chat. Please try again.',
                tag: 'chat_error'
            });
            // Fallback: try to navigate to messaging page
            router.push('/messeging');
        }
    }

    // Photo Upload Functions
    const handlePhotoUpload = async (file: File, type: 'profile' | 'cover') => {
        if (!file) return;
        
        setIsUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            formData.append('userId', user?.id?.toString() || '');
            
            const endpoint = type === 'profile' ? '/api/upload/profile' : '/api/upload/cover';
            const response = await apiFetch(endpoint, {
                method: 'POST',
                body: formData,
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`${type} photo uploaded:`, data);
                console.log('Photo URL received:', data.url);
                
                // Ensure the URL is properly formatted
                let photoUrl = data.url;
                if (photoUrl && !photoUrl.startsWith('http')) {
                    photoUrl = `https://demedia-backend.fly.dev${photoUrl}`;
                }
                console.log('Formatted photo URL:', photoUrl);
                
                // Update profile state with new photo URL
                setProfile(prev => prev ? {
                    ...prev,
                    [type === 'profile' ? 'profilePicture' : 'coverPicture']: photoUrl
                } : null);
                
                // Also update the user context if it's the current user's profile
                if (isOwnProfile && user) {
                    // Update user context with new photo URL
                    const updatedUser = {
                        ...user,
                        [type === 'profile' ? 'profilePicture' : 'coverPhoto']: data.url
                    };
                    // Note: You might need to add a method to update user context
                    // This depends on how your AuthContext is implemented
                }
                
                // Show success notification
                try {
                    const { notificationService } = await import('@/services/notificationService');
                    notificationService.showNotification({
                        title: 'Photo Updated',
                        body: `${type === 'profile' ? 'Profile' : 'Cover'} photo updated successfully!`,
                        tag: 'photo_updated'
                    });
                } catch (error) {
                    console.log('Notification service not available');
                }
                
                // Refresh profile data to ensure photo is displayed
                if (isOwnProfile) {
                    setTimeout(() => {
                        refreshProfile();
                    }, 1000);
                }
            } else {
                console.error(`Failed to upload ${type} photo`);
                const errorText = await response.text();
                console.error('Upload error details:', errorText);
                
                try {
                    const { notificationService } = await import('@/services/notificationService');
                    notificationService.showNotification({
                        title: 'Upload Failed',
                        body: `Failed to upload ${type} photo. Please try again.`,
                        tag: 'upload_error'
                    });
                } catch (error) {
                    alert(`Failed to upload ${type} photo. Please try again.`);
                }
            }
        } catch (error) {
            console.error(`Error uploading ${type} photo:`, error);
            
            try {
                const { notificationService } = await import('@/services/notificationService');
                notificationService.showNotification({
                    title: 'Upload Error',
                    body: `Error uploading ${type} photo. Please try again.`,
                    tag: 'upload_error'
                });
            } catch (error) {
                alert(`Error uploading ${type} photo. Please try again.`);
            }
        } finally {
            setIsUploadingPhoto(false);
            setShowPhotoUploadModal(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                return;
            }
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB.');
                return;
            }
            
            handlePhotoUpload(file, photoUploadType);
        }
    };

    if (authLoading || loading) {
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
    }
    
    if (error)
        return (
            <div className={`min-h-screen ${themeClasses.bg} pb-20 md:pb-0 flex items-center justify-center`}>
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Profile Not Found</h2>
                    <p className={`${themeClasses.textSecondary} mb-6`}>
                        {error.includes("User may not exist") 
                            ? "This user profile doesn't exist or has been deleted." 
                            : error}
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.history.back()}
                            className={`w-full px-6 py-3 rounded-lg ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}
                        >
                            Go Back
                        </button>
                        {user?.id && (
                            <button
                                onClick={() => window.location.href = '/profile'}
                                className={`w-full px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300`}
                            >
                                View My Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    
    if (!profile)
        return (
            <div className={`min-h-screen ${themeClasses.bg} pb-20 md:pb-0 flex items-center justify-center`}>
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="w-10 h-10 text-gray-500" />
                    </div>
                    <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Profile Not Found</h2>
                    <p className={`${themeClasses.textSecondary} mb-6`}>
                        This user profile doesn't exist or has been deleted.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.history.back()}
                            className={`w-full px-6 py-3 rounded-lg ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}
                        >
                            Go Back
                        </button>
                        {user?.id && (
                            <button
                                onClick={() => window.location.href = '/profile'}
                                className={`w-full px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300`}
                            >
                                View My Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );

    const { coverPicture, profilePicture, name, username, bio, followersCount, followingCount, likesCount, stories } =
        profile;
    
    // Debug logging for profile picture
    console.log('Profile picture value:', profilePicture);
    console.log('Cover picture value:', coverPicture);

    const handleGoToAuthorProfile = (username?: string) => {
      if (!username) return;
      router.push(`/profile/${username}`);
    };

    return (
        <div key={userId}>
            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
            `}</style>
            <div className={`min-h-screen theme-bg-primary pb-20 md:pb-0 gold-theme`}>
                <div className="max-w-6xl mx-auto p-4">
                    {/* Enhanced Cover Section */}
                    <div className="relative mb-8">
                        {coverPicture ? (
                            <div className="relative h-64 sm:h-80 md:h-96 lg:h-[28rem] overflow-hidden rounded-3xl shadow-2xl group">
                                <img
                                    src={coverPicture}
                                    alt="Cover"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />
                                {isOwnProfile && (
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            setPhotoUploadType('cover');
                                            setShowPhotoUploadModal(true);
                                        }}
                                        disabled={isUploadingPhoto}
                                        className="absolute bottom-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100"
                                    >
                                        <Camera size={16} />
                                    </motion.button>
                                )}
                            </div>
                        ) : (
                            <div className={`h-64 sm:h-80 md:h-96 lg:h-[28rem] bg-gradient-to-br ${themeClasses.coverGradient} rounded-3xl flex items-center justify-center relative overflow-hidden shadow-2xl group`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-black/10"></div>
                                <div className="text-center relative z-10">
                                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                                        <UserIcon className="w-10 h-10 text-white" />
                                    </div>
                                    <p className={`text-lg font-medium text-white/90 mb-4`}>No cover photo</p>
                                    {isOwnProfile && (
                                        <motion.button 
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setPhotoUploadType('cover');
                                                setShowPhotoUploadModal(true);
                                            }}
                                            disabled={isUploadingPhoto}
                                            className="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-white/30 transition-all duration-300 disabled:opacity-50 shadow-lg text-sm font-medium"
                                        >
                                            {isUploadingPhoto ? 'Uploading...' : 'Add Cover Photo'}
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        )}

                    {/* Modern Profile Section */}
                    <div className="relative px-6 pb-6">
                        {/* Enhanced Profile Picture Section */}
                        <div className="absolute -top-20 sm:-top-24 md:-top-28 left-6 sm:left-8">
                            <div className="relative group">
                                {/* Animated Ring */}
                                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                                
                                {/* Main Profile Circle */}
                                <div className={`relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 ${themeClasses.border} shadow-2xl ring-4 ring-white/20 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300`}>
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
                                    console.log("Error details:", e);
                                e.currentTarget.src = "/assets/images/default-avatar.svg";
                                }}
                                onLoad={() => {
                                    console.log("Profile picture loaded successfully:", profilePicture);
                            }}
                        />
                    ) : (
                        <img
                            src="/assets/images/default-avatar.svg"
                            alt={name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    )}
                                    
                                    {/* Online Status */}
                                    <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    </div>
                            </div>
                </div>

                        {/* Profile Info Section */}
                        <div className="pt-20 sm:pt-24 px-4 sm:px-6">
                            {/* Name and Username */}
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className={`text-3xl sm:text-4xl font-bold ${themeClasses.text}`}>{name}</h1>
                                    <PremiumUserIndicator 
                                        subscriptionTier={profile?.subscriptionTier}
                                        size="md"
                                    />
                                </div>
                                <p className={`text-lg sm:text-xl ${themeClasses.textSecondary}`}>@{username}</p>
                            </div>

                            {/* Bio */}
                        {bio && (
                                <div className="mb-6">
                                    <p className={`text-sm leading-relaxed ${themeClasses.textSecondary} max-w-2xl`}>{bio}</p>
                                </div>
                            )}

                            {/* Modern Stats Section - Horizontal Layout */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleFollowersClick}
                                    className={`text-center p-4 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} cursor-pointer hover:shadow-lg transition-all duration-300 backdrop-blur-sm`}
                                >
                                    <div className={`text-2xl font-bold ${themeClasses.text} mb-1`}>{followersCount}</div>
                                    <div className={`text-xs font-medium ${themeClasses.textSecondary}`}>Followers</div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                                        <div className="bg-gradient-to-r from-cyan-500 to-purple-600 h-1.5 rounded-full transition-all duration-500" style={{width: `${Math.min(100, (followersCount / 1000) * 100)}%`}}></div>
                                    </div>
                                </motion.div>
                                
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleFollowingClick}
                                    className={`text-center p-4 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} cursor-pointer hover:shadow-lg transition-all duration-300 backdrop-blur-sm`}
                                >
                                    <div className={`text-2xl font-bold ${themeClasses.text} mb-1`}>{followingCount}</div>
                                    <div className={`text-xs font-medium ${themeClasses.textSecondary}`}>Following</div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                                        <div className="bg-gradient-to-r from-pink-500 to-rose-600 h-1.5 rounded-full transition-all duration-500" style={{width: `${Math.min(100, (followingCount / 500) * 100)}%`}}></div>
                                    </div>
                                </motion.div>
                                
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className={`text-center p-4 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} cursor-pointer hover:shadow-lg transition-all duration-300 backdrop-blur-sm`}
                                >
                                    <div className={`text-2xl font-bold ${themeClasses.text} mb-1`}>{likesCount}</div>
                                    <div className={`text-xs font-medium ${themeClasses.textSecondary}`}>Likes</div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                                        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-1.5 rounded-full transition-all duration-500" style={{width: `${Math.min(100, (likesCount / 10000) * 100)}%`}}></div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Enhanced Action Buttons */}
                            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-8">
                    {isOwnProfile ? (
                                    <>
                        <motion.button
                            type="button"
                            onClick={() => setShowEditModal(true)}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                            className={`flex-1 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${themeClasses.button} text-sm sm:text-base shadow-lg hover:shadow-xl backdrop-blur-sm`}
                        >
                            <Edit size={18} />
                            <span>Edit Profile</span>
                        </motion.button>
                        
                        {/* Profile Photo Upload Button */}
                        <motion.button
                            type="button"
                            onClick={() => {
                                setPhotoUploadType('profile');
                                setShowPhotoUploadModal(true);
                            }}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                            className={`px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${themeClasses.buttonSecondary} flex items-center space-x-2 text-sm sm:text-base shadow-lg hover:shadow-xl backdrop-blur-sm`}
                        >
                            <Camera size={18} />
                            <span>Change Photo</span>
                        </motion.button>
                        
                        {/* Profile Customization Button */}
                        {user && (
                        <ProfileCustomization 
                                user={{ id: String(user.id) }} 
                            onUpdate={(updates) => {
                                console.log('Profile customization updated:', updates);
                                // Here you can implement the actual update logic
                            }} 
                        />
                        )}
                                    </>
                                ) : (
                                    <>
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.02 }}
                                onClick={handleFollowToggle}
                                disabled={busyFollow}
                                className={`flex-1 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                                    isFollowing
                                        ? `${themeClasses.buttonSecondary}`
                                        : `${themeClasses.button}`
                                } ${busyFollow ? "opacity-70 cursor-wait" : ""} text-sm sm:text-base shadow-lg hover:shadow-xl backdrop-blur-sm`}
                            >
                                {busyFollow ? "..." : isFollowing ? "Following" : "Follow"}
                            </motion.button>
                            
                            {/* Chat Button */}
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handleStartChat()}
                                className={`px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${themeClasses.button} flex items-center space-x-2 text-sm sm:text-base shadow-lg hover:shadow-xl`}
                            >
                                <MessageCircle size={18} />
                                <span>Chat</span>
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

                            {/* Modern Navigation Tabs */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
                                {[
                                    { id: "posts", label: "Posts", icon: Grid3X3, color: "from-blue-500 to-cyan-600" },
                                    { id: "desnaps", label: "DeSnaps", icon: Video, color: "from-purple-500 to-pink-600" },
                                    { id: "stories", label: "Stories", icon: Sparkles, color: "from-yellow-500 to-orange-600" },
                                    { id: "achievements", label: "Achievements", icon: Trophy, color: "from-yellow-500 to-amber-600" },
                                    { id: "analytics", label: "Analytics", icon: BarChart3, color: "from-green-500 to-emerald-600" },
                                    { id: "wellness", label: "Wellness", icon: Heart, color: "from-red-500 to-rose-600" },
                                    { id: "goals", label: "Goals", icon: Target, color: "from-indigo-500 to-purple-600" },
                                    { id: "memories", label: "Memories", icon: Clock, color: "from-pink-500 to-rose-600" },
                                ].map((tab) => (
                                    <motion.button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 relative rounded-t-xl ${
                                            activeTab === tab.id
                                                ? `text-white bg-gradient-to-r ${tab.color} shadow-lg`
                                                : `${themeClasses.textSecondary} hover:${themeClasses.text} hover:bg-gray-100/10`
                                        }`}
                                    >
                                        <tab.icon size={18} />
                                        <span>{tab.label}</span>
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

                            {/* Modern Content Sections */}
                            <div className="p-8">
                <AnimatePresence mode="wait">
                    {activeTab === "posts" && (
                        <motion.div
                            key="posts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <UserPosts 
                                userId={userId} 
                                showCommentModal={showCommentModal}
                                setShowCommentModal={setShowCommentModal}
                                selectedPost={selectedPost}
                                setSelectedPost={setSelectedPost}
                                themeClasses={themeClasses}
                            />
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
                            <UserDeSnaps 
                                userId={userId} 
                                themeClasses={themeClasses}
                                theme={theme}
                            />
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
                                                    <div className="text-center py-8">
                                                        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                        <p className={`text-lg ${themeClasses.textSecondary}`}>No achievements yet</p>
                                                        <p className={`text-sm ${themeClasses.textSecondary}`}>Start engaging to unlock achievements</p>
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
                                            <ProfileAnalytics userId={user?.id?.toString() || ''} posts={[]} />
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
                                                            <div className="text-2xl font-bold text-gray-400">--</div>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Mental Health</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Track your mood and wellness</div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                                            <div className="bg-gradient-to-r from-gray-300 to-gray-400 h-2 rounded-full" style={{width: '0%'}}></div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-2">Start tracking to see data</div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Activity className="w-8 h-8 text-green-500" />
                                                            <div className="text-2xl font-bold text-gray-400">--</div>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Social Balance</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Healthy social media usage</div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                                            <div className="bg-gradient-to-r from-gray-300 to-gray-400 h-2 rounded-full" style={{width: '0%'}}></div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-2">Start tracking to see data</div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Sun className="w-8 h-8 text-yellow-500" />
                                                            <div className="text-2xl font-bold text-gray-400">--</div>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Energy Level</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary}`}>Daily energy and motivation</div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                                            <div className="bg-gradient-to-r from-gray-300 to-gray-400 h-2 rounded-full" style={{width: '0%'}}></div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-2">Start tracking to see data</div>
                                                    </div>
                                                </div>

                                                {/* Mood Tracker */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} mb-8`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Mood Tracker</h4>
                                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                                            <div key={day} className="text-center">
                                                                <div className="text-xs text-gray-400 mb-2">{day}</div>
                                                                <div className="w-8 h-8 rounded-full mx-auto bg-gray-300"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className={`${themeClasses.textSecondary}`}>Start tracking your mood</span>
                                                        <span className={`${themeClasses.textSecondary}`}>0-day streak</span>
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
                                                            <div className="text-2xl font-bold text-gray-400">--</div>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${themeClasses.text} mb-2`}>No Goals Set</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary} mb-3`}>Create your first goal to get started</div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div className="bg-gradient-to-r from-gray-300 to-gray-400 h-2 rounded-full" style={{width: '0%'}}></div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-2">Set a goal to track progress</div>
                                                    </div>

                                                    <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} hover:shadow-lg transition-all duration-300`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Heart className="w-8 h-8 text-red-500" />
                                                            <div className="text-2xl font-bold text-gray-400">--</div>
                                                        </div>
                                                        <div className={`text-lg font-semibold ${themeClasses.text} mb-2`}>No Goals Set</div>
                                                        <div className={`text-sm ${themeClasses.textSecondary} mb-3`}>Create your first goal to get started</div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div className="bg-gradient-to-r from-gray-300 to-gray-400 h-2 rounded-full" style={{width: '0%'}}></div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-2">Set a goal to track progress</div>
                                                    </div>
                                                </div>

                                                {/* Goal Categories */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} mb-8`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Goal Categories</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                                                            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                                            <div className={`text-sm font-medium ${themeClasses.text}`}>Social</div>
                                                            <div className={`text-xs ${themeClasses.textSecondary}`}>0 goals</div>
                                                        </div>
                                                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                                                            <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                                                            <div className={`text-sm font-medium ${themeClasses.text}`}>Creative</div>
                                                            <div className={`text-xs ${themeClasses.textSecondary}`}>0 goals</div>
                                                        </div>
                                                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                                                            <Heart className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                                            <div className={`text-sm font-medium ${themeClasses.text}`}>Wellness</div>
                                                            <div className={`text-xs ${themeClasses.textSecondary}`}>0 goals</div>
                                                        </div>
                                                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                                                            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                                            <div className={`text-sm font-medium ${themeClasses.text}`}>Achievement</div>
                                                            <div className={`text-xs ${themeClasses.textSecondary}`}>0 goals</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Goal Progress Chart */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border}`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Monthly Progress</h4>
                                                    <div className="h-32 flex items-center justify-center">
                                                        <div className="text-center">
                                                            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                            <p className={`text-lg ${themeClasses.textSecondary}`}>No goals set yet</p>
                                                            <p className={`text-sm ${themeClasses.textSecondary}`}>Create goals to see your progress here</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between mt-4">
                                                        <span className={`text-sm ${themeClasses.textSecondary}`}>Goal completion rate</span>
                                                        <span className={`text-sm font-medium ${themeClasses.text}`}>0% this month</span>
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
                                                    <div className="text-center py-8">
                                                        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                        <p className={`text-lg ${themeClasses.textSecondary}`}>No memories yet</p>
                                                        <p className={`text-sm ${themeClasses.textSecondary}`}>Your milestones and memories will appear here</p>
                                                    </div>
                                                </div>

                                                {/* Memory Stats */}
                                                <div className={`p-6 rounded-xl ${themeClasses.accentBg} border ${themeClasses.border} mt-8`}>
                                                    <h4 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>Memory Statistics</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="text-center">
                                                            <div className={`text-2xl font-bold ${themeClasses.text}`}>0</div>
                                                            <div className={`text-sm ${themeClasses.textSecondary}`}>Memories</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className={`text-2xl font-bold ${themeClasses.text}`}>0</div>
                                                            <div className={`text-sm ${themeClasses.textSecondary}`}>Days Active</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className={`text-2xl font-bold ${themeClasses.text}`}>0</div>
                                                            <div className={`text-sm ${themeClasses.textSecondary}`}>Milestones</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className={`text-2xl font-bold ${themeClasses.text}`}>0</div>
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
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onProfileUpdated={(updatedProfile) => {
                    setProfile(updatedProfile);
                    setShowEditModal(false);
                }}
            />

            {/* Followers List Modal */}
            <FollowersList
                isOpen={showFollowersList}
                onClose={() => setShowFollowersList(false)}
                userId={parseInt(userId)}
                type={listType}
            />

            {/* Following List Modal */}
            <FollowersList
                isOpen={showFollowingList}
                onClose={() => setShowFollowingList(false)}
                userId={parseInt(userId)}
                type="following"
            />

            {/* Photo Upload Modal */}
            <PhotoUploadModal
                isOpen={showPhotoUploadModal}
                onClose={() => setShowPhotoUploadModal(false)}
                onUpload={handlePhotoUpload}
                type={photoUploadType}
                isUploading={isUploadingPhoto}
            />
        </div>
    );
}

// UserDeSnaps component to display user's DeSnaps
const UserDeSnaps = ({ 
    userId, 
    themeClasses,
    theme
}: { 
    userId?: string;
    themeClasses: any;
    theme: string;
}) => {
    const [deSnaps, setDeSnaps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        
        const fetchUserDeSnaps = async () => {
            try {
                setLoading(true);
                const response = await apiFetch(`/api/desnaps/user/${userId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch DeSnaps');
                }
                
                const data = await response.json();
                setDeSnaps(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load DeSnaps');
            } finally {
                setLoading(false);
            }
        };

        fetchUserDeSnaps();
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

    if (deSnaps.length === 0) {
        return (
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
        );
    }

    return (
        <div className="space-y-6">
            {deSnaps.map((deSnap) => (
                <motion.div 
                    key={deSnap.id} 
                    className={`rounded-2xl p-6 shadow-xl backdrop-blur-sm transition-all duration-300 ${
                        theme === 'gold' 
                            ? 'bg-gradient-to-br from-gray-700/90 to-gray-800/90 border border-yellow-500/30 gold-glow gold-shimmer' 
                            : 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50'
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* DeSnap Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                                {deSnap.author?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{deSnap.author?.name || 'Unknown User'}</h3>
                                <p className="text-sm text-gray-400">@{deSnap.author?.username || 'unknown'}</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            {new Date(deSnap.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    {/* DeSnap Content */}
                    <div className="mb-4">
                        {deSnap.content && (
                            <p className="text-gray-300 text-base leading-relaxed mb-4">
                                {deSnap.content}
                            </p>
                        )}
                        
                        {/* DeSnap Video/Thumbnail */}
                        {deSnap.thumbnail && (
                            <div className="relative rounded-xl overflow-hidden">
                                <img 
                                    src={deSnap.thumbnail} 
                                    alt="DeSnap thumbnail" 
                                    className="w-full h-64 object-cover"
                                    onError={(e) => {
                                        console.log('DeSnap thumbnail failed to load:', deSnap.thumbnail);
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                        <Video className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DeSnap Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                        <div className="flex items-center space-x-6">
                            <button className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors">
                                <Heart size={20} />
                                <span className="font-medium">{deSnap.likes || 0}</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
                                <MessageCircle size={20} />
                                <span className="font-medium">{deSnap.comments || 0}</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                                <Share size={20} />
                                <span className="font-medium">Share</span>
                            </button>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{deSnap.views || 0} views</span>
                            <span>•</span>
                            <span>{deSnap.duration || 0}s</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// UserPosts component to display user's posts
const UserPosts = ({ 
    userId, 
    showCommentModal, 
    setShowCommentModal, 
    selectedPost, 
    setSelectedPost,
    themeClasses
}: { 
    userId?: string;
    showCommentModal: boolean;
    setShowCommentModal: (show: boolean) => void;
    selectedPost: any;
    setSelectedPost: (post: any) => void;
    themeClasses: any;
}) => {
    const { theme } = useTheme();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [postToDelete, setPostToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
	const router = useRouter();

	const handleGoToAuthorProfile = (username?: string) => {
		if (!username) return;
		router.push(`/profile/${username}`);
	};

    const fetchUserPosts = async () => {
        if (!userId) return;
        
        try {
            setLoading(true);
            const response = await apiFetch(`/api/posts/user/${userId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            
            const data = await response.json();
            // Handle both direct array and wrapped response formats
            setPosts(Array.isArray(data) ? data : (data.posts || []));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserPosts();
    }, [userId])

    // Listen for post creation events to refresh user posts
    useEffect(() => {
        const handlePostCreated = () => {
            fetchUserPosts();
        };

        window.addEventListener('post:created', handlePostCreated);
        
        return () => {
            window.removeEventListener('post:created', handlePostCreated);
        };
    }, [userId, fetchUserPosts]);

    const handleEdit = (post: any) => {
        setSelectedPost(post);
        setShowEditModal(true);
    };

    const handleDelete = (post: any) => {
        setPostToDelete(post);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!postToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/posts/${postToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-id': localStorage.getItem('userId') || '',
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Delete response:', result);
                
                // Remove from local state immediately
                setPosts(prev => prev.filter(p => p.id !== postToDelete.id));
                setShowDeleteConfirm(false);
                setPostToDelete(null);
                
                // Show success message
                console.log('Post deleted successfully');
                notificationService.showNotification({
                    title: 'Post Deleted',
                    body: 'Your post has been successfully deleted',
                    tag: 'post_deleted'
                });
            } else {
                const errorText = await response.text();
                console.error('Delete failed:', response.status, errorText);
                
                // Try to parse error message
                let errorMessage = `Failed to delete post (${response.status})`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                
                notificationService.showNotification({
                    title: 'Delete Failed',
                    body: errorMessage,
                    tag: 'delete_error'
                });
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            notificationService.showNotification({
                title: 'Network Error',
                body: `Network error: ${error instanceof Error ? error.message : 'Unable to connect to server'}`,
                tag: 'network_error'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePostUpdated = (updatedPost: any) => {
        setPosts(prev => prev.map(p => 
            p.id === updatedPost.id ? updatedPost : p
        ));
        setShowEditModal(false);
        setSelectedPost(null);
    };

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
        <div className="space-y-6">
            {posts.map((post) => (
                <motion.div 
                    key={post.id} 
                    className={`rounded-2xl p-6 shadow-xl backdrop-blur-sm transition-all duration-300 ${
                        theme === 'gold' 
                            ? 'bg-gradient-to-br from-gray-700/90 to-gray-800/90 border border-yellow-500/30 gold-glow gold-shimmer' 
                            : 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50'
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { const u = post.author?.username; if (u) router.push(`/profile/${u}`); }}
                                className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold hover:shadow-lg transition-all duration-300 cursor-pointer ring-2 ring-cyan-500/20"
                            >
                                {post.author?.name?.charAt(0) || 'U'}
                            </motion.button>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-bold text-white text-lg">{post.author?.name || 'Unknown User'}</h3>
                                    <PremiumUserIndicator 
                                        subscriptionTier={post.author?.subscriptionTier}
                                        size="sm"
                                    />
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs text-green-400">Online</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mb-1">@{post.author?.username || 'unknown'}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{new Date(post.createdAt).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Edit/Delete buttons - only show for current user's posts */}
                        {user?.id && (Number(user.id) === Number(userId) || (post.user?.id || post.author?.id) === Number(user?.id)) && (
                            <div className="flex items-center space-x-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleEdit(post)}
                                    className="p-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all duration-300 border border-blue-500/30"
                                    title="Edit Post"
                                >
                                    <Edit size={18} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setPostToDelete(post);
                                        setShowDeleteConfirm(true);
                                    }}
                                    className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all duration-300 border border-red-500/30"
                                    title="Delete Post"
                                >
                                    <Trash2 size={18} />
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                        {post.title && (
                            <h2 className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                {post.title}
                            </h2>
                        )}
                        <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                            {post.content}
                        </p>
                    </div>

                    {/* Post Media */}
                    {(post.imageUrl || post.images?.length || post.media?.length) && (
                        <div className="mb-4">
                            {post.imageUrl && (
                                <img 
                                    src={post.imageUrl} 
                                    alt="Post content" 
                                    className="w-full rounded-xl object-cover max-h-96 shadow-lg"
                                    onError={(e) => {
                                        console.log('Image failed to load:', post.imageUrl);
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}
                            
                            {post.images && post.images.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {post.images.map((imageUrl: string, index: number) => (
                                        <img 
                                            key={index}
                                            src={imageUrl} 
                                            alt={`Post content ${index + 1}`} 
                                            className="w-full rounded-xl object-cover max-h-64 shadow-lg"
                                            onError={(e) => {
                                                console.log('Image failed to load:', imageUrl);
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-700/50 gap-4">
                        <div className="flex items-center space-x-4 sm:space-x-6">
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <Heart size={20} />
                                <span className="font-medium">{post.likes || 0}</span>
                            </motion.button>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setSelectedPost(post);
                                    setShowCommentModal(true);
                                }}
                                className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                            >
                                <MessageCircle size={20} />
                                <span className="font-medium">{post.comments || 0}</span>
                            </motion.button>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors"
                            >
                                <Share size={20} />
                                <span className="font-medium">Share</span>
                            </motion.button>
                        </div>
                        
                        {/* Engagement Stats */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{post.views || 0} views</span>
                            <span>•</span>
                            <span>{post.likes || 0} likes</span>
                        </div>
                    </div>
                </motion.div>
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

            {/* Edit Post Modal */}
            {selectedPost && (
                <EditPostModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedPost(null);
                    }}
                    post={selectedPost}
                    onPostUpdated={handlePostUpdated}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div
                        className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Delete Post</h2>
                                    <p className="text-sm text-gray-400">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-300 mb-6">
                                Are you sure you want to delete this post? This action cannot be undone.
                            </p>
                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setPostToDelete(null);
                                    }}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Post'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
}