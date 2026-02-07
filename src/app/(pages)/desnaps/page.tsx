"use client";

import React, { useState, useEffect, useMemo, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    Video,
    Play,
    Heart,
    Eye,
    Zap,
    Plus,
    Search,
    Users,
    Sparkles,
    Clock,
    Grid3X3,
    LayoutGrid,
    MessageCircle,
    Flame,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import CreateDeSnapModal from '@/components/CreateDeSnapModal';
import DeSnapsViewer from '@/components/DeSnapsViewer';
import { apiFetch } from '@/lib/api';
import { normalizeDeSnap } from '@/utils/desnapUtils';
import { ensureAbsoluteMediaUrl } from '@/utils/mediaUtils';
import { DeSnap } from '@/types/desnap';
import ProfilePhoto from '@/components/ProfilePhoto';

// State management with useReducer for better performance
interface DeSnapsState {
    deSnaps: DeSnap[];
    loading: boolean;
    error: string | null;
    showCreateModal: boolean;
    selectedDeSnap: DeSnap | null;
    filter: 'all' | 'following' | 'trending';
    searchQuery: string;
    viewMode: 'grid' | 'compact';
    hoveredId: number | null;
}

type DeSnapsAction = 
    | { type: 'SET_DESNAPS'; payload: DeSnap[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_SHOW_CREATE_MODAL'; payload: boolean }
    | { type: 'SET_SELECTED_DESNAP'; payload: DeSnap | null }
    | { type: 'SET_FILTER'; payload: 'all' | 'following' | 'trending' }
    | { type: 'SET_SEARCH_QUERY'; payload: string }
    | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'compact' }
    | { type: 'SET_HOVERED_ID'; payload: number | null };

const initialState: DeSnapsState = {
    deSnaps: [],
    loading: true,
    error: null,
    showCreateModal: false,
    selectedDeSnap: null,
    filter: 'all',
    searchQuery: '',
    viewMode: 'grid',
    hoveredId: null,
};

function deSnapsReducer(state: DeSnapsState, action: DeSnapsAction): DeSnapsState {
    switch (action.type) {
        case 'SET_DESNAPS':
            return { ...state, deSnaps: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_SHOW_CREATE_MODAL':
            return { ...state, showCreateModal: action.payload };
        case 'SET_SELECTED_DESNAP':
            return { ...state, selectedDeSnap: action.payload };
        case 'SET_FILTER':
            return { ...state, filter: action.payload };
        case 'SET_SEARCH_QUERY':
            return { ...state, searchQuery: action.payload };
        case 'SET_VIEW_MODE':
            return { ...state, viewMode: action.payload };
        case 'SET_HOVERED_ID':
            return { ...state, hoveredId: action.payload };
        default:
            return state;
    }
}

export default function DeSnapsPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [state, dispatch] = useReducer(deSnapsReducer, initialState);
    
    // Destructure state for easier access
    const { 
        deSnaps, 
        loading, 
        error, 
        showCreateModal, 
        selectedDeSnap, 
        filter, 
        searchQuery, 
        viewMode, 
        hoveredId 
    } = state;

    const themeClasses = useMemo(() => {
        const baseClasses = {
            light: {
                bg: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
                card: 'bg-white/80 backdrop-blur-xl',
                cardHover: 'hover:bg-white hover:shadow-xl hover:shadow-gray-200/50',
                text: 'text-gray-900',
                textSecondary: 'text-gray-600',
                border: 'border-gray-200/60',
                accent: 'from-orange-500 to-pink-500',
                accentSolid: 'bg-orange-500',
                input: 'bg-white/90 border-gray-200',
                badge: 'bg-gray-100 text-gray-700'
            },
            'super-light': {
                bg: 'bg-gradient-to-br from-slate-50 via-white to-blue-50',
                card: 'bg-white/90 backdrop-blur-xl',
                cardHover: 'hover:bg-white hover:shadow-xl hover:shadow-blue-100/50',
                text: 'text-slate-900',
                textSecondary: 'text-slate-500',
                border: 'border-slate-200/60',
                accent: 'from-blue-500 to-purple-500',
                accentSolid: 'bg-blue-500',
                input: 'bg-white border-slate-200',
                badge: 'bg-slate-100 text-slate-700'
            },
            dark: {
                bg: 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800',
                card: 'bg-gray-800/80 backdrop-blur-xl',
                cardHover: 'hover:bg-gray-800 hover:shadow-xl hover:shadow-cyan-500/10',
                text: 'text-white',
                textSecondary: 'text-gray-400',
                border: 'border-gray-700/60',
                accent: 'from-cyan-500 to-purple-500',
                accentSolid: 'bg-cyan-500',
                input: 'bg-gray-800/90 border-gray-700',
                badge: 'bg-gray-700 text-gray-300'
            },
            'super-dark': {
                bg: 'bg-black',
                card: 'bg-gradient-to-br from-gray-950/90 via-black/80 to-purple-950/50 backdrop-blur-2xl border border-purple-500/20',
                cardHover: 'hover:border-purple-400/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
                text: 'text-white',
                textSecondary: 'text-gray-400',
                border: 'border-purple-500/20',
                accent: 'from-cyan-400 to-purple-500',
                accentSolid: 'bg-purple-500',
                input: 'bg-black/50 border-purple-500/30',
                badge: 'bg-purple-900/50 text-purple-300'
            },
            gold: {
                bg: 'bg-[#0f0f0f]',
                card: 'bg-gradient-to-br from-[#1a1a1a]/95 to-[#161616]/90 backdrop-blur-xl border border-amber-500/10',
                cardHover: 'hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(201,162,39,0.1)]',
                text: 'text-white',
                textSecondary: 'text-gray-400',
                border: 'border-amber-500/15',
                accent: 'from-amber-500 to-orange-500',
                accentSolid: 'bg-amber-500',
                input: 'bg-[#1a1a1a]/80 border-amber-500/20',
                badge: 'bg-amber-900/30 text-amber-400'
            }
        };
        return baseClasses[theme as keyof typeof baseClasses] || baseClasses.dark;
    }, [theme]);

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
            dispatch({ type: 'SET_DESNAPS', payload: (() => {
                const filtered = deSnaps.filter(ds => ds.id !== normalized.id);
                return [normalized, ...filtered];
            })() });
        };

        const handleUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ deSnap?: any }>;
            const raw = customEvent.detail?.deSnap;
            if (!raw) return;
            const normalized = normalizeDeSnap(raw);
            if (!normalized) return;
            dispatch({ type: 'SET_DESNAPS', payload: deSnaps.map(ds => ds.id === normalized.id ? normalized : ds) });
        };

        // Listen for profile updates to refresh author profile pictures
        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ 
                userId?: string | number; 
                profilePicture?: string;
                name?: string;
                username?: string;
            }>;
            const { userId, profilePicture, name, username } = customEvent.detail || {};
            
            if (!userId) return;
            
            console.log("👤 Profile updated, refreshing author data in DeSnaps:", userId);
            
            // Update all DeSnaps by this author with the new profile picture
            dispatch({ 
                type: 'SET_DESNAPS', 
                payload: deSnaps.map(deSnap => {
                    if (deSnap.author && String(deSnap.author.id) === String(userId)) {
                        return {
                            ...deSnap,
                            author: {
                                ...deSnap.author,
                                profilePicture: profilePicture || deSnap.author.profilePicture,
                                name: name || deSnap.author.name,
                                username: username || deSnap.author.username,
                            }
                        };
                    }
                    return deSnap;
                })
            });
        };

        window.addEventListener('desnap:created', handleCreated as EventListener);
        window.addEventListener('desnap:updated', handleUpdated as EventListener);
        window.addEventListener('profile:updated', handleProfileUpdated as EventListener);

        return () => {
            window.removeEventListener('desnap:created', handleCreated as EventListener);
            window.removeEventListener('desnap:updated', handleUpdated as EventListener);
            window.removeEventListener('profile:updated', handleProfileUpdated as EventListener);
        };
    }, []);

    const fetchDeSnaps = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });

            let response;
            let data;

            try {
                response = await apiFetch(`/api/desnaps?filter=${filter}`, {}, user?.id);
                if (response.ok) {
                    data = await response.json();
                    const normalized = (Array.isArray(data) ? data : []).map(normalizeDeSnap).filter(Boolean) as DeSnap[];
                    dispatch({ type: 'SET_DESNAPS', payload: normalized });
                    return;
                }
            } catch (apiError) {
                console.warn('Main API failed, trying fallback:', apiError);
            }

            try {
                if (user?.id) {
                    response = await apiFetch(`/api/desnaps/user/${user.id}`);
                    if (response.ok) {
                        data = await response.json();
                        const normalized = (Array.isArray(data) ? data : []).map(normalizeDeSnap).filter(Boolean) as DeSnap[];
                        dispatch({ type: 'SET_DESNAPS', payload: normalized });
                        return;
                    }
                }
            } catch (userError) {
                console.warn('User API failed:', userError);
            }

            try {
                const directResponse = await apiFetch('/api/desnaps', { method: 'GET' }, user?.id);
                if (directResponse.ok) {
                    data = await directResponse.json();
                    const normalized = (Array.isArray(data) ? data : []).map(normalizeDeSnap).filter(Boolean) as DeSnap[];
                    dispatch({ type: 'SET_DESNAPS', payload: normalized });
                    return;
                }
            } catch (directError) {
                console.warn('Direct fetch failed:', directError);
            }

            dispatch({ type: 'SET_ERROR', payload: 'Unable to fetch DeSnaps. Please check your connection.' });
            dispatch({ type: 'SET_DESNAPS', payload: [] });
        } catch (err) {
            console.error('Error fetching DeSnaps:', err);
            dispatch({ type: 'SET_ERROR', payload: `Network error: ${err instanceof Error ? err.message : 'Unable to fetch DeSnaps'}` });
            dispatch({ type: 'SET_DESNAPS', payload: [] });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleLike = async (deSnapId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await apiFetch(`/api/desnaps/${deSnapId}/like`, { method: 'POST' });
            if (response.ok) {
                dispatch({ type: 'SET_DESNAPS', payload: deSnaps.map(ds =>
                    ds.id === deSnapId
                        ? { ...ds, isLiked: !ds.isLiked, likes: ds.isLiked ? ds.likes - 1 : ds.likes + 1 }
                        : ds
                ) });
            }
        } catch (err) {
            console.error('Failed to like DeSnap:', err);
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
            ].filter(Boolean).join(" ").toLowerCase();
            return haystack.includes(normalizedQuery);
        })
        : deSnaps;

    const filterOptions = [
        { key: 'all', label: 'For You', icon: Sparkles },
        { key: 'following', label: 'Following', icon: Users },
        { key: 'trending', label: 'Trending', icon: Flame }
    ];

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${themeClasses.accent} animate-spin`} style={{ animationDuration: '1.5s' }}>
                            <div className={`absolute inset-1 rounded-full ${themeClasses.bg}`}></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className={`w-8 h-8 text-transparent bg-gradient-to-r ${themeClasses.accent} bg-clip-text`} style={{ fill: 'url(#gradient)' }} />
                        </div>
                    </div>
                    <p className={`${themeClasses.textSecondary} text-lg font-medium`}>Loading DeSnaps...</p>
                    <p className={`${themeClasses.textSecondary} text-sm mt-1 opacity-60`}>Discovering amazing content</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${themeClasses.bg} pb-20 md:pb-0`}>
            {/* Premium Header */}
            <div className={`sticky top-0 z-40 ${themeClasses.card} border-b ${themeClasses.border}`}>
                <div className="px-4 sm:px-6 py-4">
                    {/* Top Row - Logo & Create Button */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`relative w-11 h-11 rounded-2xl bg-gradient-to-br ${themeClasses.accent} p-[2px] shadow-lg`}>
                                <div className={`w-full h-full rounded-2xl ${themeClasses.bg} flex items-center justify-center`}>
                                    <Zap className="w-5 h-5 text-orange-500" />
                                </div>
                            </div>
                            <div>
                                <h1 className={`text-xl sm:text-2xl font-bold ${themeClasses.text} tracking-tight`}>
                                    DeSnaps
                                </h1>
                                <p className={`text-xs ${themeClasses.textSecondary} hidden sm:block`}>
                                    Share moments that matter
                                </p>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => dispatch({ type: 'SET_SHOW_CREATE_MODAL', payload: true })}
                            className={`flex items-center gap-2 px-3 sm:px-4 lg:px-5 py-2.5 min-h-[44px] bg-gradient-to-r ${themeClasses.accent} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation`}
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Create</span>
                        </motion.button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`} />
                        <input
                            type="text"
                            placeholder="Search creators, tags, or content..."
                            value={searchQuery}
                            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
                            className={`w-full pl-12 pr-4 py-3 min-h-[44px] ${themeClasses.input} border rounded-xl ${themeClasses.text} placeholder:${themeClasses.textSecondary} focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm touch-manipulation`}
                            style={{ fontSize: '16px' }}
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                            {filterOptions.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => dispatch({ type: 'SET_FILTER', payload: key as any })}
                                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
                                        filter === key
                                            ? `bg-gradient-to-r ${themeClasses.accent} text-white shadow-md`
                                            : `${themeClasses.textSecondary} hover:bg-black/5 dark:hover:bg-white/5`
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{label}</span>
                                </button>
                            ))}
                        </div>

                        {/* View Toggle */}
                        <div className="flex gap-1 p-1 rounded-lg bg-black/5 dark:bg-white/5">
                            <button
                                onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
                                className={`p-2 min-w-[44px] min-h-[44px] rounded-md transition-all touch-manipulation ${viewMode === 'grid' ? themeClasses.accentSolid + ' text-white' : themeClasses.textSecondary}`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'compact' })}
                                className={`p-2 min-w-[44px] min-h-[44px] rounded-md transition-all touch-manipulation ${viewMode === 'compact' ? themeClasses.accentSolid + ' text-white' : themeClasses.textSecondary}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-3 sm:p-4 md:p-6">
                {error ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 px-4"
                    >
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${themeClasses.card} flex items-center justify-center`}>
                            <Video className={`w-10 h-10 ${themeClasses.textSecondary}`} />
                        </div>
                        <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Connection Issue</h3>
                        <p className={`${themeClasses.textSecondary} mb-6 max-w-md mx-auto`}>{error}</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={fetchDeSnaps}
                            className={`px-6 py-3 bg-gradient-to-r ${themeClasses.accent} text-white rounded-xl font-semibold shadow-lg`}
                        >
                            Try Again
                        </motion.button>
                    </motion.div>
                ) : filteredDeSnaps.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 px-4"
                    >
                        <div className={`relative w-32 h-32 mx-auto mb-8`}>
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${themeClasses.accent} opacity-20 blur-2xl`}></div>
                            <div className={`relative w-full h-full rounded-full ${themeClasses.card} flex items-center justify-center border ${themeClasses.border}`}>
                                {filter === 'following' ? (
                                    <Users className={`w-12 h-12 ${themeClasses.textSecondary}`} />
                                ) : filter === 'trending' ? (
                                    <Flame className={`w-12 h-12 ${themeClasses.textSecondary}`} />
                                ) : (
                                    <Video className={`w-12 h-12 ${themeClasses.textSecondary}`} />
                                )}
                            </div>
                        </div>
                        <h3 className={`text-2xl font-bold ${themeClasses.text} mb-3`}>
                            {searchQuery 
                                ? 'No results found' 
                                : filter === 'following' 
                                    ? 'No DeSnaps from people you follow'
                                    : filter === 'trending'
                                        ? 'No trending DeSnaps yet'
                                        : 'No DeSnaps yet'}
                        </h3>
                        <p className={`${themeClasses.textSecondary} mb-8 max-w-md mx-auto`}>
                            {searchQuery 
                                ? 'Try adjusting your search or explore different content' 
                                : filter === 'following'
                                    ? "Follow some creators to see their DeSnaps here, or check out the 'For You' feed to discover new content!"
                                    : filter === 'trending'
                                        ? 'Be the first to create a viral DeSnap!'
                                        : 'Be the first to share a moment! Create your first DeSnap and start the trend.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {filter === 'following' && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => dispatch({ type: 'SET_FILTER', payload: 'all' })}
                                    className={`inline-flex items-center gap-2 px-6 py-3 ${themeClasses.card} border ${themeClasses.border} ${themeClasses.text} rounded-xl font-semibold transition-all duration-300`}
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Explore For You
                                </motion.button>
                            )}
                            {!searchQuery && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => dispatch({ type: 'SET_SHOW_CREATE_MODAL', payload: true })}
                                    className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${themeClasses.accent} text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300`}
                                >
                                    <Plus className="w-5 h-5" />
                                    Create DeSnap
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Stats Bar */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <p className={`text-sm ${themeClasses.textSecondary}`}>
                                    <span className={`font-semibold ${themeClasses.text}`}>{filteredDeSnaps.length}</span> DeSnaps
                                </p>
                                {filter !== 'all' && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${themeClasses.badge}`}>
                                        {filter === 'following' ? 'Following' : 'Trending'}
                                    </span>
                                )}
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${themeClasses.textSecondary}`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>Updated just now</span>
                            </div>
                        </div>

                        {/* DeSnaps Grid - Enhanced Comfortable View */}
                        <div className={`grid gap-3 sm:gap-4 ${
                            viewMode === 'grid' 
                                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
                        }`}>
                            <AnimatePresence mode="popLayout">
                                {filteredDeSnaps.map((deSnap, index) => (
                                    <motion.div
                                        key={deSnap.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                        transition={{ 
                                            delay: index * 0.05, 
                                            duration: 0.4,
                                            type: "spring",
                                            stiffness: 100
                                        }}
                                        whileHover={{ scale: 1.02, y: -8 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => dispatch({ type: 'SET_SELECTED_DESNAP', payload: deSnap })}
                                        onMouseEnter={() => dispatch({ type: 'SET_HOVERED_ID', payload: deSnap.id })}
                                        onMouseLeave={() => dispatch({ type: 'SET_HOVERED_ID', payload: null })}
                                        className={`${themeClasses.card} rounded-3xl overflow-hidden cursor-pointer group relative transition-all duration-500 ${themeClasses.cardHover}`}
                                        style={{
                                            boxShadow: hoveredId === deSnap.id 
                                                ? '0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
                                                : '0 4px 20px -5px rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        {/* Video Thumbnail with Enhanced Aspect Ratio */}
                                        <div className={`relative ${viewMode === 'grid' ? 'aspect-[9/16]' : 'aspect-[9/14]'} overflow-hidden`}>
                                            {deSnap.thumbnail ? (
                                                <Image
                                                    src={deSnap.thumbnail}
                                                    alt=""
                                                    width={300}
                                                    height={400}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black`}>
                                                    <Video className="w-12 h-12 text-gray-600 opacity-50" />
                                                </div>
                                            )}

                                            {/* Enhanced Gradient Overlays */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            {/* Animated Play Button - Center */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <motion.div 
                                                    initial={{ scale: 0.7, opacity: 0 }}
                                                    animate={{ 
                                                        scale: hoveredId === deSnap.id ? 1.1 : 0.7, 
                                                        opacity: hoveredId === deSnap.id ? 1 : 0 
                                                    }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                    className={`relative w-16 h-16 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-2xl`}
                                                >
                                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 opacity-20 animate-pulse" />
                                                    <Play className="w-7 h-7 text-gray-900 ml-1" fill="currentColor" />
                                                </motion.div>
                                            </div>

                                            {/* Enhanced Author Info - Top */}
                                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                                                <motion.div 
                                                    initial={{ x: -20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: index * 0.05 + 0.2 }}
                                                    className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-2 pr-4"
                                                >
                                                    <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/40 shadow-lg">
                                                        <ProfilePhoto
                                                            src={deSnap.author?.profilePicture}
                                                            alt={deSnap.author?.name || 'User'}
                                                            width={36}
                                                            height={36}
                                                            userId={deSnap.author?.id}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-sm font-semibold truncate max-w-[120px] drop-shadow-lg">
                                                            {deSnap.author?.name || 'User'}
                                                        </span>
                                                        <span className="text-white/80 text-xs truncate max-w-[120px] drop-shadow-lg">
                                                            @{deSnap.author?.username || 'user'}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            {/* Enhanced Stats - Bottom */}
                                            <div className="absolute bottom-4 left-4 right-4 z-10">
                                                <motion.div 
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ delay: index * 0.05 + 0.3 }}
                                                    className="bg-black/40 backdrop-blur-md rounded-2xl px-4 py-3"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-4">
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={(e) => handleLike(deSnap.id, e)}
                                                                className="flex items-center gap-1.5 text-white group/like"
                                                            >
                                                                <Heart 
                                                                    className={`w-5 h-5 transition-all ${deSnap.isLiked ? 'fill-red-500 text-red-500 animate-pulse' : 'group-hover/like:scale-125 group-hover/like:text-red-400'}`} 
                                                                />
                                                                <span className="text-sm font-semibold drop-shadow-lg">{formatNumber(deSnap.likes)}</span>
                                                            </motion.button>
                                                            <div className="flex items-center gap-1.5 text-white">
                                                                <MessageCircle className="w-5 h-5" />
                                                                <span className="text-sm font-semibold drop-shadow-lg">{formatNumber(deSnap.comments)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-white/90">
                                                            <Eye className="w-4 h-4" />
                                                            <span className="text-sm font-medium drop-shadow-lg">{formatNumber(deSnap.views)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Caption Preview */}
                                                    {(deSnap as any).caption && (
                                                        <p className="text-white/90 text-xs line-clamp-2 drop-shadow-lg">
                                                            {(deSnap as any).caption}
                                                        </p>
                                                    )}
                                                </motion.div>
                                            </div>

                                            {/* Enhanced Duration Badge */}
                                            {deSnap.duration > 0 && (
                                                <motion.div 
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: index * 0.05 + 0.4 }}
                                                    className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20"
                                                >
                                                    <span className="text-white text-xs font-semibold flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {Math.floor(deSnap.duration / 60)}:{(deSnap.duration % 60).toString().padStart(2, '0')}
                                                    </span>
                                                </motion.div>
                                            )}

                                            {/* Trending Badge */}
                                            {deSnap.views > 1000 && (
                                                <motion.div 
                                                    initial={{ scale: 0, rotate: -45 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ delay: index * 0.05 + 0.5, type: "spring" }}
                                                    className="absolute top-16 right-4 px-2 py-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"
                                                >
                                                    <span className="text-white text-xs font-bold flex items-center gap-1">
                                                        <Flame className="w-3 h-3" />
                                                        Trending
                                                    </span>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>

            {/* Floating Create Button - Mobile */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => dispatch({ type: 'SET_SHOW_CREATE_MODAL', payload: true })}
                className={`fixed bottom-24 right-4 md:hidden w-14 h-14 rounded-full bg-gradient-to-r ${themeClasses.accent} text-white shadow-2xl flex items-center justify-center z-30`}
            >
                <Plus className="w-6 h-6" />
            </motion.button>

            {/* Create DeSnap Modal */}
            <CreateDeSnapModal
                isOpen={showCreateModal}
                onClose={() => dispatch({ type: 'SET_SHOW_CREATE_MODAL', payload: false })}
                onDeSnapCreated={() => {
                    dispatch({ type: 'SET_SHOW_CREATE_MODAL', payload: false });
                    fetchDeSnaps();
                }}
            />

            {/* DeSnap Viewer with scroll navigation */}
            {selectedDeSnap && (
                <DeSnapsViewer
                    isOpen={!!selectedDeSnap}
                    onClose={() => dispatch({ type: 'SET_SELECTED_DESNAP', payload: null })}
                    deSnap={selectedDeSnap}
                    onDeSnapUpdated={(updated) => {
                        dispatch({ type: 'SET_DESNAPS', payload: deSnaps.map(ds => ds.id === updated.id ? updated : ds) });
                    }}
                    allDeSnaps={filteredDeSnaps}
                    currentIndex={filteredDeSnaps.findIndex(ds => ds.id === selectedDeSnap.id)}
                    onNavigate={(index) => {
                        const nextDeSnap = filteredDeSnaps[index];
                        if (nextDeSnap) {
                            dispatch({ type: 'SET_SELECTED_DESNAP', payload: nextDeSnap });
                        }
                    }}
                />
            )}
        </div>
    );
}
