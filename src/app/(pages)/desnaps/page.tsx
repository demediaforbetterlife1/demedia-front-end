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
                    card: 'bg-gray-900',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800',
                    hover: 'hover:bg-gray-800'
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
                response = await apiFetch(`/api/desnaps?filter=${filter}`);
                console.log('DeSnaps API response:', response.status, response.ok);
                
                if (response.ok) {
                    data = await response.json();
                    console.log('DeSnaps data received:', data);
                    setDeSnaps(Array.isArray(data) ? data : []);
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
                        setDeSnaps(Array.isArray(data) ? data : []);
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
                setDeSnaps(Array.isArray(data) ? data : []);
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
                    setDeSnaps(Array.isArray(data) ? data : []);
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

    const filteredDeSnaps = deSnaps.filter(deSnap => 
        searchQuery === '' || 
        deSnap.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deSnap.author.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    filter === filterType
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredDeSnaps.map((deSnap) => (
                            <motion.div
                                key={deSnap.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`${themeClasses.card} ${themeClasses.border} border rounded-xl overflow-hidden ${themeClasses.hover} transition-all`}
                            >
                                {/* Video Thumbnail */}
                                <div className="relative aspect-square bg-gray-900">
                                    {deSnap.thumbnail ? (
                                        <img
                                            src={deSnap.thumbnail}
                                            alt="DeSnap thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Video className="w-12 h-12 text-gray-600" />
                                        </div>
                                    )}
                                    
                                    {/* Duration Badge */}
                                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {deSnap.duration}h
                                    </div>
                                    
                                    {/* Play Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedDeSnap(deSnap);
                                            setIsPlaying(deSnap.id);
                                        }}
                                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                                    >
                                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                                            <Play className="w-6 h-6 text-gray-900 ml-1" />
                                        </div>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">
                                                {deSnap.author.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${themeClasses.text} truncate`}>
                                                {deSnap.author.name}
                                            </p>
                                            <p className={`text-xs ${themeClasses.textSecondary}`}>
                                                @{deSnap.author.username}
                                            </p>
                                        </div>
                                    </div>

                                    <p className={`text-sm ${themeClasses.text} mb-3 line-clamp-2`}>
                                        {deSnap.content}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center space-x-4">
                                            <span className="flex items-center">
                                                <Eye className="w-3 h-3 mr-1" />
                                                {deSnap.views}
                                            </span>
                                            <span className="flex items-center">
                                                <Heart className="w-3 h-3 mr-1" />
                                                {deSnap.likes}
                                            </span>
                                            <span className="flex items-center">
                                                <MessageCircle className="w-3 h-3 mr-1" />
                                                {deSnap.comments}
                                            </span>
                                        </div>
                                        <span>
                                            {new Date(deSnap.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={() => handleLike(deSnap.id)}
                                                className={`flex items-center space-x-1 transition-colors ${
                                                    deSnap.isLiked ? 'text-red-500' : themeClasses.textSecondary
                                                }`}
                                            >
                                                <Heart className={`w-4 h-4 ${deSnap.isLiked ? 'fill-current' : ''}`} />
                                                <span className="text-xs">Like</span>
                                            </button>
                                            
                                            <button className={`flex items-center space-x-1 ${themeClasses.textSecondary} hover:text-blue-500 transition-colors`}>
                                                <MessageCircle className="w-4 h-4" />
                                                <span className="text-xs">Comment</span>
                                            </button>
                                            
                                            <button className={`flex items-center space-x-1 ${themeClasses.textSecondary} hover:text-green-500 transition-colors`}>
                                                <Share className="w-4 h-4" />
                                                <span className="text-xs">Share</span>
                                            </button>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleBookmark(deSnap.id)}
                                            className={`transition-colors ${
                                                deSnap.isBookmarked ? 'text-yellow-500' : themeClasses.textSecondary
                                            }`}
                                        >
                                            <Bookmark className={`w-4 h-4 ${deSnap.isBookmarked ? 'fill-current' : ''}`} />
                                        </button>
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
