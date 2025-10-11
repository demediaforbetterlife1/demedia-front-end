"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, 
    X, 
    User, 
    FileText, 
    Hash, 
    Clock, 
    Filter,
    Shield,
    AlertTriangle,
    Eye,
    EyeOff
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
    id: number;
    type: 'user' | 'post' | 'story' | 'hashtag';
    title: string;
    content?: string;
    author?: {
        name: string;
        username: string;
        profilePicture?: string;
    };
    createdAt?: string;
    likes?: number;
    comments?: number;
    views?: number;
    isAdultContent?: boolean;
    hashtags?: string[];
}

interface ImprovedSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImprovedSearchModal({ isOpen, onClose }: ImprovedSearchModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'posts' | 'stories' | 'hashtags'>('all');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showAdultContent, setShowAdultContent] = useState(false);
    const { user } = useAuth();

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse recent searches:', e);
            }
        }
    }, []);

    // Enhanced search function with better error handling and content filtering
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setError(null);
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            // Check for adult content keywords
            const adultKeywords = ['+18', 'adult', 'nsfw', 'porn', 'sex', 'xxx', 'nude', 'naked'];
            const hasAdultContent = adultKeywords.some(keyword => 
                query.toLowerCase().includes(keyword.toLowerCase())
            );

            if (hasAdultContent && !showAdultContent) {
                setSearchResults([]);
                setError("Adult content is not available. Please enable adult content in settings to view this content.");
                setIsSearching(false);
                return;
            }

            // Prepare search parameters
            const searchParams = new URLSearchParams({
                q: query.trim(),
                filter: activeFilter,
                includeAdult: showAdultContent ? 'true' : 'false'
            });

            // Make multiple API calls in parallel for better performance
            const searchPromises = [];

            if (activeFilter === 'all' || activeFilter === 'users') {
                searchPromises.push(
                    fetch(`/api/search/users?${searchParams}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json',
                        },
                    }).then(res => res.ok ? res.json() : [])
                );
            }

            if (activeFilter === 'all' || activeFilter === 'posts') {
                searchPromises.push(
                    fetch(`/api/search/posts?${searchParams}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json',
                        },
                    }).then(res => res.ok ? res.json() : [])
                );
            }

            if (activeFilter === 'all' || activeFilter === 'stories') {
                searchPromises.push(
                    fetch(`/api/search/stories?${searchParams}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json',
                        },
                    }).then(res => res.ok ? res.json() : [])
                );
            }

            if (activeFilter === 'all' || activeFilter === 'hashtags') {
                searchPromises.push(
                    fetch(`/api/search/hashtags?${searchParams}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json',
                        },
                    }).then(res => res.ok ? res.json() : [])
                );
            }

            const results = await Promise.all(searchPromises);
            const allResults: SearchResult[] = [];

            // Process results based on active filter
            if (activeFilter === 'all' || activeFilter === 'users') {
                const users = results[0] || [];
                allResults.push(...users.map((user: any) => ({
                    ...user,
                    type: 'user' as const
                })));
            }

            if (activeFilter === 'all' || activeFilter === 'posts') {
                const posts = results[1] || [];
                allResults.push(...posts.map((post: any) => ({
                    ...post,
                    type: 'post' as const
                })));
            }

            if (activeFilter === 'all' || activeFilter === 'stories') {
                const stories = results[2] || [];
                allResults.push(...stories.map((story: any) => ({
                    ...story,
                    type: 'story' as const
                })));
            }

            if (activeFilter === 'all' || activeFilter === 'hashtags') {
                const hashtags = results[3] || [];
                allResults.push(...hashtags.map((hashtag: any) => ({
                    ...hashtag,
                    type: 'hashtag' as const
                })));
            }

            // Sort results by relevance and recency
            allResults.sort((a, b) => {
                // Prioritize exact matches
                const aExact = a.title?.toLowerCase().includes(query.toLowerCase()) || 
                              a.content?.toLowerCase().includes(query.toLowerCase());
                const bExact = b.title?.toLowerCase().includes(query.toLowerCase()) || 
                              b.content?.toLowerCase().includes(query.toLowerCase());
                
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                // Then by recency
                if (a.createdAt && b.createdAt) {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                
                return 0;
            });

            setSearchResults(allResults);

            // Add to recent searches
            if (query.trim() && !recentSearches.includes(query.trim())) {
                const newRecent = [query.trim(), ...recentSearches].slice(0, 5);
                setRecentSearches(newRecent);
                localStorage.setItem('recentSearches', JSON.stringify(newRecent));
            }

        } catch (err) {
            console.error('Search error:', err);
            setError('Search failed. Please try again.');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [activeFilter, showAdultContent, recentSearches]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                performSearch(searchQuery);
            } else {
                setSearchResults([]);
                setError(null);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, performSearch]);

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleFilterChange = (filter: typeof activeFilter) => {
        setActiveFilter(filter);
        if (searchQuery.trim()) {
            performSearch(searchQuery);
        }
    };

    const handleResultClick = (result: SearchResult) => {
        // Navigate based on result type
        switch (result.type) {
            case 'user':
                window.location.href = `/profile?userId=${result.id}`;
                break;
            case 'post':
                window.location.href = `/post/${result.id}`;
                break;
            case 'story':
                // Handle story navigation
                break;
            case 'hashtag':
                window.location.href = `/search?q=${encodeURIComponent(result.title)}&filter=hashtags`;
                break;
        }
        onClose();
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const getResultIcon = (type: string) => {
        switch (type) {
            case 'user': return <User className="w-4 h-4" />;
            case 'post': return <FileText className="w-4 h-4" />;
            case 'story': return <Clock className="w-4 h-4" />;
            case 'hashtag': return <Hash className="w-4 h-4" />;
            default: return <Search className="w-4 h-4" />;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                <Search className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Search</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Find users, posts, and more</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search for users, posts, stories..."
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center space-x-2 mt-4">
                            {(['all', 'users', 'posts', 'stories', 'hashtags'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => handleFilterChange(filter)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        activeFilter === filter
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Adult Content Toggle */}
                        <div className="flex items-center space-x-2 mt-3">
                            <button
                                onClick={() => setShowAdultContent(!showAdultContent)}
                                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                    showAdultContent
                                        ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {showAdultContent ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                <span>Show Adult Content</span>
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {isSearching && (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="ml-3 text-gray-600 dark:text-gray-400">Searching...</span>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <span className="text-red-700 dark:text-red-400">{error}</span>
                            </div>
                        )}

                        {!isSearching && !error && searchQuery.trim() && searchResults.length === 0 && (
                            <div className="text-center py-8">
                                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No results found for "{searchQuery}"</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Try different keywords or check your spelling</p>
                            </div>
                        )}

                        {!isSearching && !error && searchResults.length > 0 && (
                            <div className="space-y-3">
                                {searchResults.map((result) => (
                                    <motion.button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleResultClick(result)}
                                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                                {getResultIcon(result.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {result.title}
                                                    </h3>
                                                    {result.isAdultContent && (
                                                        <Shield className="w-4 h-4 text-red-500" />
                                                    )}
                                                </div>
                                                {result.content && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                                        {result.content}
                                                    </p>
                                                )}
                                                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                                                    {result.author && (
                                                        <span>by {result.author.name}</span>
                                                    )}
                                                    {result.createdAt && (
                                                        <span>{formatTimeAgo(result.createdAt)}</span>
                                                    )}
                                                    {result.likes !== undefined && (
                                                        <span>{result.likes} likes</span>
                                                    )}
                                                    {result.views !== undefined && (
                                                        <span>{result.views} views</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Recent Searches */}
                        {!isSearching && !error && !searchQuery.trim() && recentSearches.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Recent Searches</h3>
                                    <button
                                        onClick={clearRecentSearches}
                                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {recentSearches.map((search, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSearchQuery(search)}
                                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-700 dark:text-gray-300">{search}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
