"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Heart,
    MessageCircle,
    Share,
    Bookmark,
    Clock,
    Eye,
    Zap,
    Plus,
    Filter,
    Search
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import CreateDeSnapModal from '@/components/CreateDeSnapModal';
import { apiFetch } from '@/lib/api';
import { normalizeDeSnap } from '@/utils/desnapUtils';
import { ensureAbsoluteMediaUrl } from '@/utils/mediaUtils';

interface DeSnap {
    id: number;
    content: string;
    thumbnail?: string;
    duration: number;
    visibility: 'public' | 'followers' | 'close_friends' | 'premium';
    createdAt: string;
    expiresAt: string;
    likes: number;
    comments: number;
    views: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
    author: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
    };
}

export default function DeSnapsPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [deSnaps, setDeSnaps] = useState<DeSnap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDeSnap, setSelectedDeSnap] = useState<DeSnap | null>(null);
    const [isPlaying, setIsPlaying] = useState<number | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [filter, setFilter] = useState<'all' | 'following' | 'trending'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gray-50',
                    card: 'bg-white',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-100'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-100',
                    card: 'bg-white',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-100',
                    hover: 'hover:bg-gray-50'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700'
                };
            case 'super-dark':
                return {
                    bg: 'bg-black',
                    card: 'bg-gradient-to-br from-gray-950/80 via-black/75 to-purple-950/70 backdrop-blur-2xl border border-purple-500/40 shadow-[0_8px_32px_rgba(168,85,247,0.12)] hover:shadow-[0_16px_48px_rgba(168,85,247,0.25),0_0_64px_rgba(236,72,153,0.15)] hover:border-purple-400/60 transition-all duration-700',
                    text: 'text-white',
                    textSecondary: 'text-gray-400',
                    border: 'border-purple-500/30',
                    hover: 'hover:bg-white/5'
                };
            case 'gold':
                return {
                    bg: 'bg-gradient-to-br from-yellow-900 to-yellow-800',
                    card: 'bg-gradient-to-br from-yellow-800 to-yellow-700',
                    text: 'text-yellow-100',
                    textSecondary: 'text-yellow-200',
                    border: 'border-yellow-600/50',
                    hover: 'hover:bg-yellow-800/80 gold-shimmer'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700'
                };
        }
    };

    const themeClasses = getThemeClasses();

    useEffect(() => {
        fetchDeSnaps();
    }, [filter]);

    useEffect(() => {
        const handleCreated = (event: Event) => {
            const customEvent = event as CustomEvent<{ deSnap?: any }>;
            const raw = customEvent.detail?.deSnap;
            if (!raw) return;
            const normalized = normalizeDeSnap(raw);
            if (!normalized) return;
            setDeSnaps(prev => {
                const filtered = prev.filter(ds => ds.id !== normalized.id);
                return [normalized, ...filtered];
            });
        };

        const handleUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ deSnap?: any }>;
            const raw = customEvent.detail?.deSnap;
            if (!raw) return;
            const normalized = normalizeDeSnap(raw);
            if (!normalized) return;
            setDeSnaps(prev => prev.map(ds => ds.id === normalized.id ? normalized : ds));
        };

        window.addEventListener('desnap:created', handleCreated as EventListener);
        window.addEventListener('desnap:updated', handleUpdated as EventListener);

        return () => {
            window.removeEventListener('desnap:created', handleCreated as EventListener);
            window.removeEventListener('desnap:updated', handleUpdated as EventListener);
        };
    }, []);


    const fetchDeSnaps = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching DeSnaps with filter:', filter);

            // Try multiple endpoints with fallback
            let response;
            let data;

            try {
                // First try the main DeSnaps endpoint
                response = await apiFetch(`/api/desnaps?filter=${filter}`, {}, user?.id);
                console.log('DeSnaps API response:', response.status, response.ok);

                if (response.ok) {
                    data = await response.json();
                    console.log('DeSnaps data received:', data);
                    const normalized = (Array.isArray(data) ? data : []).map(normalizeDeSnap);
                    setDeSnaps(normalized);
                    return;
                }
            } catch (apiError) {
                console.warn('Main API failed, trying fallback:', apiError);
            }

            // Fallback: Try to fetch from user-specific endpoint
            try {
                if (user?.id) {
                    response = await apiFetch(`/api/desnaps/user/${user.id}`);
                    if (response.ok) {
                        data = await response.json();
                        console.log('User DeSnaps data received:', data);
                        const normalized = (Array.isArray(data) ? data : []).map(normalizeDeSnap);
                        setDeSnaps(normalized);
                        return;
                    }
                }
            } catch (userError) {
                console.warn('User API failed, trying direct fetch:', userError);
            }

            // Final fallback: Direct fetch to backend with multiple endpoints
            try {
                const directResponse = await apiFetch('/api/desnaps', {
                    method: 'GET'
                }, user?.id);

                if (directResponse.ok) {
                    data = await directResponse.json();
                    console.log('Direct DeSnaps data received:', data);
                    const normalized = (Array.isArray(data) ? data : []).map(normalizeDeSnap);
                    setDeSnaps(normalized);
                    return;
                }
            } catch (directError) {
                console.warn('Direct fetch failed, trying alternative endpoints:', directError);

                // Try alternative endpoints
                try {
                    const altResponse = await fetch('https://demedia-backend.fly.dev/api/snaps', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (altResponse.ok) {
                        data = await altResponse.json();
                        console.log('Alternative DeSnaps data received:', data);
                        const normalized = (Array.isArray(data) ? data : []).map(normalizeDeSnap);
                        setDeSnaps(normalized);
                        return;
                    }
                } catch (altError) {
                    console.warn('Alternative endpoint failed:', altError);
                }
            }

            // If all methods fail, show error
            console.error('All DeSnaps endpoints failed');
            setError(`Unable to fetch DeSnaps. Please check your connection and try again.`);
            setDeSnaps([]);

        } catch (err) {
            console.error('Error fetching DeSnaps:', err);
            setError(`Network error: ${err instanceof Error ? err.message : 'Unable to fetch DeSnaps'}`);
            setDeSnaps([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (deSnapId: number) => {
        try {
            const response = await apiFetch(`/api/desnaps/${deSnapId}/like`, {
                method: 'POST'
            });
            if (response.ok) {
                setDeSnaps(prev => prev.map(ds =>
                    ds.id === deSnapId
                        ? { ...ds, isLiked: !ds.isLiked, likes: ds.isLiked ? ds.likes - 1 : ds.likes + 1 }
                        : ds
                ));
            }
        } catch (err) {
            console.error('Failed to like DeSnap:', err);
        }
    };

    const handleBookmark = async (deSnapId: number) => {
        try {
            const response = await apiFetch(`/api/desnaps/${deSnapId}/bookmark`, {
                method: 'POST'
            });
            if (response.ok) {
                setDeSnaps(prev => prev.map(ds =>
                    ds.id === deSnapId
                        ? { ...ds, isBookmarked: !ds.isBookmarked }
                        : ds
                ));
            }
        } catch (err) {
            console.error('Failed to bookmark DeSnap:', err);
        }
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredDeSnaps = normalizedQuery
        ? deSnaps.filter((deSnap) => {
            const haystack = [
                deSnap.author?.name,
                deSnap.author?.username,
                (deSnap as any).caption,
                (deSnap as any).description,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        })
        : deSnaps;

    if (loading) {
        return (
            <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className={themeClasses.textSecondary}>Loading DeSnaps...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${themeClasses.bg} pb-20 md:pb-0`}>
            {/* Header */}
            <div className={`sticky top-0 z-40 ${themeClasses.card} ${themeClasses.border} border-b px-4 py-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className={`text-xl font-bold ${themeClasses.text}`}>DeSnaps</h1>
                            <p className={`text-sm ${themeClasses.textSecondary}`}>Temporary moments</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Create</span>
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search DeSnaps..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 ${themeClasses.card} ${themeClasses.border} border rounded-lg ${themeClasses.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                        />
                    </div>

                    <div className="flex space-x-2">
                        {['all', 'following', 'trending'].map((filterType) => (
                            <button
                                key={filterType}
                                onClick={() => setFilter(filterType as any)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filter === filterType
                                        ? 'bg-yellow-500 text-white'
                                        : `${themeClasses.hover} ${themeClasses.textSecondary}`
                                    }`}
                            >
                                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* DeSnaps Grid */}
            <div className="p-4">
                {error ? (
                    <div className="text-center py-8">
                        <p className={`${themeClasses.textSecondary} mb-4`}>{error}</p>
                        <button
                            onClick={fetchDeSnaps}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredDeSnaps.length === 0 ? (
                    <div className="text-center py-12">
                        <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>No DeSnaps found</h3>
                        <p className={`${themeClasses.textSecondary} mb-4`}>
                            {searchQuery ? 'Try a different search term' : 'Be the first to create a DeSnap!'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
                            >
                                Create Your First DeSnap
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {filteredDeSnaps.map((deSnap) => (
                            <motion.div
                                key={deSnap.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.03 }}
                                className={`${themeClasses.card} rounded-2xl overflow-hidden ${themeClasses.hover} cursor-pointer group relative`}
                            >
                                {/* Video Thumbnail */}
                                <div className="relative aspect-[9/16] bg-gradient-to-br from-gray-900 to-black">
                                    {deSnap.thumbnail ? (
                                        <img
                                            src={deSnap.thumbnail}
                                            alt="DeSnap thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Video className="w-8 h-8 text-gray-600" />
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Duration Badge */}
                                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {deSnap.duration}h
                                    </div>

                                    {/* Play Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedDeSnap(deSnap);
                                            setIsPlaying(deSnap.id);
                                        }}
                                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl">
                                            <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                                        </div>
                                    </button>

                                    {/* Author Badge */}
                                    <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-white/50">
                                            <span className="text-white text-xs font-bold">
                                                {deSnap.author.name.charAt(0)}
                                            </span>
                                        </div>
                                        <span className="text-white text-xs font-medium drop-shadow-lg">{deSnap.author.name}</span>
                                    </div>

                                    {/* Stats Overlay */}
                                    <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="flex items-center gap-1 text-white text-xs bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                                            <Heart className="w-3 h-3" />
                                            {deSnap.likes}
                                        </span>
                                        <span className="flex items-center gap-1 text-white text-xs bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                                            <Eye className="w-3 h-3" />
                                            {deSnap.views}
                                        </span>
                                    </div>
                                </div>


                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create DeSnap Modal */}
            <CreateDeSnapModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onDeSnapCreated={() => {
                    setShowCreateModal(false);
                    fetchDeSnaps();
                }}
            />
        </div>
    );
}
