"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Flame
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import CreateDeSnapModal from '@/components/CreateDeSnapModal';
import DeSnapsViewer from '@/components/DeSnapsViewer';
import { apiFetch } from '@/lib/api';
import { normalizeDeSnap } from '@/utils/desnapUtils';
import { ensureAbsoluteMediaUrl } from '@/utils/mediaUtils';
import { DeSnap } from '@/types/desnap';

export default function DeSnapsPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [deSnaps, setDeSnaps] = useState<DeSnap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDeSnap, setSelectedDeSnap] = useState<DeSnap | null>(null);
    const [filter, setFilter] = useState<'all' | 'following' | 'trending'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    const getThemeClasses = () => {
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

            let response;
            let data;

            try {
                response = await apiFetch(`/api/desnaps?filter=${filter}`, {}, user?.id);
                if (response.ok) {
                    data = await response.json();
                    const normalized = (Array.isArray(data) ? data : []).map(normalizeDeSnap).filter(Boolean) as DeSnap[];
                    setDeSnaps(normalized);
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
                        setDeSnaps(normalized);
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
                    setDeSnaps(normalized);
                    return;
                }
            } catch (directError) {
                console.warn('Direct fetch failed:', directError);
            }

            setError('Unable to fetch DeSnaps. Please check your connection.');
            setDeSnaps([]);
        } catch (err) {
            console.error('Error fetching DeSnaps:', err);
            setError(`Network error: ${err instanceof Error ? err.message : 'Unable to fetch DeSnaps'}`);
            setDeSnaps([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (deSnapId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await apiFetch(`/api/desnaps/${deSnapId}/like`, { method: 'POST' });
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
                            onClick={() => setShowCreateModal(true)}
                            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r ${themeClasses.accent} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-12 pr-4 py-3 ${themeClasses.input} border rounded-xl ${themeClasses.text} placeholder:${themeClasses.textSecondary} focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm`}
                            style={{ fontSize: '16px' }}
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                            {filterOptions.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? themeClasses.accentSolid + ' text-white' : themeClasses.textSecondary}`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('compact')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'compact' ? themeClasses.accentSolid + ' text-white' : themeClasses.textSecondary}`}
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
                                <Video className={`w-12 h-12 ${themeClasses.textSecondary}`} />
                            </div>
                        </div>
                        <h3 className={`text-2xl font-bold ${themeClasses.text} mb-3`}>
                            {searchQuery ? 'No results found' : 'No DeSnaps yet'}
                        </h3>
                        <p className={`${themeClasses.textSecondary} mb-8 max-w-md mx-auto`}>
                            {searchQuery 
                                ? 'Try adjusting your search or explore different content' 
                                : 'Be the first to share a moment! Create your first DeSnap and start the trend.'}
                        </p>
                        {!searchQuery && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowCreateModal(true)}
                                className={`inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r ${themeClasses.accent} text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300`}
                            >
                                <Sparkles className="w-5 h-5" />
                                Create Your First DeSnap
                            </motion.button>
                        )}
                    </motion.div>
                ) : (
                    <>
                        {/* Stats Bar */}
                        <div className="flex items-center justify-between mb-6">
                            <p className={`text-sm ${themeClasses.textSecondary}`}>
                                <span className={`font-semibold ${themeClasses.text}`}>{filteredDeSnaps.length}</span> DeSnaps
                            </p>
                            <div className={`flex items-center gap-2 text-xs ${themeClasses.textSecondary}`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>Updated just now</span>
                            </div>
                        </div>

                        {/* DeSnaps Grid */}
                        <div className={`grid gap-3 sm:gap-4 ${
                            viewMode === 'grid' 
                                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
                                : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
                        }`}>
                            <AnimatePresence mode="popLayout">
                                {filteredDeSnaps.map((deSnap, index) => (
                                    <motion.div
                                        key={deSnap.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.03, duration: 0.3 }}
                                        whileHover={{ scale: 1.03, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedDeSnap(deSnap)}
                                        onMouseEnter={() => setHoveredId(deSnap.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        className={`${themeClasses.card} ${themeClasses.cardHover} rounded-2xl overflow-hidden cursor-pointer group relative transition-all duration-300`}
                                    >
                                        {/* Video Thumbnail */}
                                        <div className={`relative ${viewMode === 'grid' ? 'aspect-[9/16]' : 'aspect-[9/14]'}`}>
                                            {deSnap.thumbnail ? (
                                                <img
                                                    src={deSnap.thumbnail}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900`}>
                                                    <Video className="w-8 h-8 text-gray-600" />
                                                </div>
                                            )}

                                            {/* Gradient Overlays */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            {/* Play Button - Center */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <motion.div 
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ 
                                                        scale: hoveredId === deSnap.id ? 1 : 0.8, 
                                                        opacity: hoveredId === deSnap.id ? 1 : 0 
                                                    }}
                                                    className={`w-14 h-14 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl`}
                                                >
                                                    <Play className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" />
                                                </motion.div>
                                            </div>

                                            {/* Author Info - Top */}
                                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {deSnap.author?.profilePicture ? (
                                                        <img
                                                            src={ensureAbsoluteMediaUrl(deSnap.author.profilePicture) || deSnap.author.profilePicture}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30 shadow-lg"
                                                        />
                                                    ) : (
                                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${themeClasses.accent} flex items-center justify-center ring-2 ring-white/30 shadow-lg`}>
                                                            <span className="text-white text-xs font-bold">
                                                                {deSnap.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span className="text-white text-xs font-medium truncate max-w-[80px] drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        @{deSnap.author?.username || 'user'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Stats - Bottom */}
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={(e) => handleLike(deSnap.id, e)}
                                                            className="flex items-center gap-1 text-white group/like"
                                                        >
                                                            <Heart 
                                                                className={`w-4 h-4 transition-all ${deSnap.isLiked ? 'fill-red-500 text-red-500' : 'group-hover/like:scale-110'}`} 
                                                            />
                                                            <span className="text-xs font-medium drop-shadow-lg">{formatNumber(deSnap.likes)}</span>
                                                        </button>
                                                        <div className="flex items-center gap-1 text-white">
                                                            <MessageCircle className="w-4 h-4" />
                                                            <span className="text-xs font-medium drop-shadow-lg">{formatNumber(deSnap.comments)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-white/80">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span className="text-xs drop-shadow-lg">{formatNumber(deSnap.views)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Duration Badge */}
                                            {deSnap.duration > 0 && (
                                                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md">
                                                    <span className="text-white text-xs font-medium">
                                                        {Math.floor(deSnap.duration / 60)}:{(deSnap.duration % 60).toString().padStart(2, '0')}
                                                    </span>
                                                </div>
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
                onClick={() => setShowCreateModal(true)}
                className={`fixed bottom-24 right-4 md:hidden w-14 h-14 rounded-full bg-gradient-to-r ${themeClasses.accent} text-white shadow-2xl flex items-center justify-center z-30`}
            >
                <Plus className="w-6 h-6" />
            </motion.button>

            {/* Create DeSnap Modal */}
            <CreateDeSnapModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onDeSnapCreated={() => {
                    setShowCreateModal(false);
                    fetchDeSnaps();
                }}
            />

            {/* DeSnap Viewer with scroll navigation */}
            {selectedDeSnap && (
                <DeSnapsViewer
                    isOpen={!!selectedDeSnap}
                    onClose={() => setSelectedDeSnap(null)}
                    deSnap={selectedDeSnap}
                    onDeSnapUpdated={(updated) => {
                        setDeSnaps(prev => prev.map(ds => ds.id === updated.id ? updated : ds));
                    }}
                    allDeSnaps={filteredDeSnaps}
                    currentIndex={filteredDeSnaps.findIndex(ds => ds.id === selectedDeSnap.id)}
                    onNavigate={(index) => {
                        const nextDeSnap = filteredDeSnaps[index];
                        if (nextDeSnap) {
                            setSelectedDeSnap(nextDeSnap);
                        }
                    }}
                />
            )}
        </div>
    );
}
