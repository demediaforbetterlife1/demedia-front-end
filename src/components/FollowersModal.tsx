"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, UserPlus, UserMinus, Calendar, MapPin } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

interface Follower {
    id: number;
    name: string;
    username: string;
    profilePicture?: string;
    bio?: string;
    location?: string;
    followedAt: string;
    isFollowing?: boolean;
}

interface FollowersModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
}

export default function FollowersModal({ isOpen, onClose, userId, type }: FollowersModalProps) {
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [following, setFollowing] = useState<Set<number>>(new Set());
    const { theme } = useTheme();
    const { user } = useAuth();

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-white',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-50',
                    accent: 'text-blue-500',
                    accentBg: 'bg-blue-50'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-50',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-100',
                    hover: 'hover:bg-gray-100',
                    accent: 'text-blue-500',
                    accentBg: 'bg-blue-50'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    accent: 'text-blue-400',
                    accentBg: 'bg-blue-900/20'
                };
            case 'super-dark':
                return {
                    bg: 'bg-gray-900',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800',
                    hover: 'hover:bg-gray-800',
                    accent: 'text-blue-400',
                    accentBg: 'bg-blue-900/30'
                };
            default:
                return {
                    bg: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    accent: 'text-blue-400',
                    accentBg: 'bg-blue-900/20'
                };
        }
    };

    const themeClasses = getThemeClasses();

    useEffect(() => {
        if (isOpen && userId) {
            fetchFollowers();
        }
    }, [isOpen, userId, type]);

    const fetchFollowers = async () => {
        try {
            setLoading(true);
            setError(null);

            const endpoint = type === 'followers' 
                ? `/api/users/${userId}/followers`
                : `/api/users/${userId}/following`;

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                setFollowers(data[type] || data || []);
            } else {
                const errorText = await response.text();
                console.error(`${type} fetch failed:`, response.status, errorText);
                setError(`Failed to load ${type}`);
                setFollowers([]);
            }
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
            setError(`Failed to load ${type}`);
            setFollowers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (followerId: number) => {
        try {
            const response = await fetch(`/api/user/${followerId}/follow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (response.ok) {
                setFollowing(prev => new Set([...prev, followerId]));
                console.log('User followed successfully');
            } else {
                const errorText = await response.text();
                console.error('Follow failed:', response.status, errorText);
            }
        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    const handleUnfollow = async (followerId: number) => {
        try {
            const response = await fetch(`/api/user/${followerId}/unfollow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (response.ok) {
                setFollowing(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(followerId);
                    return newSet;
                });
                console.log('User unfollowed successfully');
            } else {
                const errorText = await response.text();
                console.error('Unfollow failed:', response.status, errorText);
            }
        } catch (error) {
            console.error('Error unfollowing user:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                    className={`${themeClasses.bg} rounded-2xl w-full max-w-2xl max-h-[80vh] shadow-2xl border ${themeClasses.border} flex flex-col`}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${themeClasses.accentBg} rounded-full flex items-center justify-center`}>
                                <Users className={`w-5 h-5 ${themeClasses.accent}`} />
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                                    {type === 'followers' ? 'Followers' : 'Following'}
                                </h2>
                                <p className={`text-sm ${themeClasses.textSecondary}`}>
                                    {followers.length} {type === 'followers' ? 'followers' : 'following'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 ${themeClasses.hover} rounded-full transition-colors`}
                        >
                            <X className={`w-5 h-5 ${themeClasses.textSecondary}`} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <p className={`${themeClasses.textSecondary}`}>{error}</p>
                            </div>
                        ) : followers.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-4`} />
                                <p className={`${themeClasses.textSecondary}`}>
                                    No {type === 'followers' ? 'followers' : 'following'} yet
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {followers.map((follower) => (
                                    <motion.div
                                        key={follower.id}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${themeClasses.border} ${themeClasses.hover} transition-colors`}
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {follower.profilePicture ? (
                                                    <img
                                                        src={follower.profilePicture}
                                                        alt={follower.name}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    follower.name?.charAt(0) || 'U'
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-semibold ${themeClasses.text}`}>
                                                    {follower.name}
                                                </h3>
                                                <p className={`text-sm ${themeClasses.textSecondary}`}>
                                                    @{follower.username}
                                                </p>
                                                {follower.bio && (
                                                    <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                                                        {follower.bio}
                                                    </p>
                                                )}
                                                <div className="flex items-center space-x-4 mt-2">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar size={12} className={themeClasses.textSecondary} />
                                                        <span className={`text-xs ${themeClasses.textSecondary}`}>
                                                            {formatDate(follower.followedAt)}
                                                        </span>
                                                    </div>
                                                    {follower.location && (
                                                        <div className="flex items-center space-x-1">
                                                            <MapPin size={12} className={themeClasses.textSecondary} />
                                                            <span className={`text-xs ${themeClasses.textSecondary}`}>
                                                                {follower.location}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Follow/Unfollow button - only show if not viewing own profile */}
                                        {user?.id && Number(user.id) !== Number(userId) && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    if (following.has(follower.id)) {
                                                        handleUnfollow(follower.id);
                                                    } else {
                                                        handleFollow(follower.id);
                                                    }
                                                }}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                                                    following.has(follower.id)
                                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                                }`}
                                            >
                                                {following.has(follower.id) ? (
                                                    <>
                                                        <UserMinus size={16} />
                                                        <span>Unfollow</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={16} />
                                                        <span>Follow</span>
                                                    </>
                                                )}
                                            </motion.button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
