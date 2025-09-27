"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, User, FileText, Image, Video, Users, Hash, Calendar, Eye, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

interface SearchResult {
    id: string;
    type: 'user' | 'post' | 'story' | 'hashtag';
    title: string;
    description?: string;
    author?: {
        name: string;
        username: string;
        profilePicture?: string;
    };
    content?: string;
    image?: string;
    createdAt?: string;
    likes?: number;
    comments?: number;
    views?: number;
    hashtags?: string[];
}

export default function SearchResultsPage() {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'posts' | 'stories' | 'hashtags'>('all');
    const [searchQuery, setSearchQuery] = useState("");
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useI18n();

    const query = searchParams.get('q') || '';

    useEffect(() => {
        if (query) {
            setSearchQuery(query);
            performSearch(query);
        }
    }, [query]);

    const performSearch = useCallback(async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [usersRes, postsRes, storiesRes, hashtagsRes] = await Promise.all([
                fetch(`/api/search/users?q=${encodeURIComponent(searchTerm)}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                }),
                fetch(`/api/search/posts?q=${encodeURIComponent(searchTerm)}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                }),
                fetch(`/api/search/stories?q=${encodeURIComponent(searchTerm)}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                }),
                fetch(`/api/search/hashtags?q=${encodeURIComponent(searchTerm)}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                })
            ]);

            const [users, posts, stories, hashtags] = await Promise.all([
                usersRes.ok ? usersRes.json() : [],
                postsRes.ok ? postsRes.json() : [],
                storiesRes.ok ? storiesRes.json() : [],
                hashtagsRes.ok ? hashtagsRes.json() : []
            ]);

            const allResults: SearchResult[] = [
                ...users.map((user: any) => ({
                    id: user.id,
                    type: 'user' as const,
                    title: user.name,
                    description: user.bio || `@${user.username}`,
                    author: {
                        name: user.name,
                        username: user.username,
                        profilePicture: user.profilePicture
                    }
                })),
                ...posts.map((post: any) => ({
                    id: post.id,
                    type: 'post' as const,
                    title: post.title,
                    description: post.content,
                    author: post.author,
                    createdAt: post.createdAt,
                    likes: post.likes || 0,
                    comments: post.comments || 0
                })),
                ...stories.map((story: any) => ({
                    id: story.id,
                    type: 'story' as const,
                    title: `Story by ${story.author?.name || 'Unknown'}`,
                    description: story.content,
                    author: story.author,
                    image: story.content?.startsWith('http') ? story.content : undefined,
                    createdAt: story.createdAt,
                    views: story.views || 0
                })),
                ...hashtags.map((hashtag: any) => ({
                    id: hashtag.id,
                    type: 'hashtag' as const,
                    title: `#${hashtag.tag}`,
                    description: `${hashtag.postCount || 0} posts`,
                    hashtags: [hashtag.tag]
                }))
            ];

            setResults(allResults);
        } catch (err) {
            console.error('Search error:', err);
            setError('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredResults = results.filter(result => {
        if (activeFilter === 'all') return true;
        return result.type === activeFilter.slice(0, -1); // Remove 's' from plural
    });

    const handleResultClick = (result: SearchResult) => {
        switch (result.type) {
            case 'user':
                router.push(`/profile?userId=${result.id}`);
                break;
            case 'post':
                router.push(`/post/${result.id}`);
                break;
            case 'story':
                router.push(`/profile?userId=${result.author?.username}`);
                break;
            case 'hashtag':
                router.push(`/hashtag/${result.title.replace('#', '')}`);
                break;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    const getResultIcon = (type: string) => {
        switch (type) {
            case 'user': return <User size={20} className="text-blue-500" />;
            case 'post': return <FileText size={20} className="text-green-500" />;
            case 'story': return <Image size={20} className="text-purple-500" />;
            case 'hashtag': return <Hash size={20} className="text-cyan-500" />;
            default: return <Search size={20} className="text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Search Results
                    </h1>
                    <p className="text-gray-400">
                        {loading ? 'Searching...' : `${filteredResults.length} results for "${searchQuery}"`}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search for users, posts, stories..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value.trim()) {
                                    performSearch(e.target.value);
                                }
                            }}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'all', label: 'All', count: results.length },
                            { id: 'users', label: 'Users', count: results.filter(r => r.type === 'user').length },
                            { id: 'posts', label: 'Posts', count: results.filter(r => r.type === 'post').length },
                            { id: 'stories', label: 'Stories', count: results.filter(r => r.type === 'story').length },
                            { id: 'hashtags', label: 'Hashtags', count: results.filter(r => r.type === 'hashtag').length }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id as any)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                    activeFilter === filter.id
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                {filter.label} ({filter.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                            <span className="ml-3 text-gray-400">Searching...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="text-red-400 text-lg mb-2">⚠️ Error</div>
                            <p className="text-gray-400">{error}</p>
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="mx-auto text-gray-500 mb-4" size={48} />
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">No results found</h3>
                            <p className="text-gray-400">
                                Try searching for something else or check your spelling
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredResults.map((result, index) => (
                                <motion.div
                                    key={`${result.type}-${result.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleResultClick(result)}
                                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:bg-gray-700/50 transition cursor-pointer"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            {getResultIcon(result.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-white truncate">
                                                    {result.title}
                                                </h3>
                                                {result.createdAt && (
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {formatTimeAgo(result.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {result.description && (
                                                <p className="text-gray-300 mb-3 line-clamp-2">
                                                    {result.description}
                                                </p>
                                            )}
                                            
                                            {result.author && (
                                                <div className="flex items-center gap-2 mb-3">
                                                    {result.author.profilePicture ? (
                                                        <img
                                                            src={result.author.profilePicture}
                                                            alt={result.author.name}
                                                            className="w-6 h-6 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {result.author.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-gray-400">
                                                        {result.author.name} (@{result.author.username})
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {result.image && (
                                                <div className="mb-3">
                                                    <img
                                                        src={result.image}
                                                        alt="Content"
                                                        className="w-full max-w-xs h-32 object-cover rounded-lg"
                                                    />
                                                </div>
                                            )}
                                            
                                            {result.hashtags && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {result.hashtags.map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                {result.likes !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <Heart size={14} />
                                                        {result.likes}
                                                    </span>
                                                )}
                                                {result.comments !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle size={14} />
                                                        {result.comments}
                                                    </span>
                                                )}
                                                {result.views !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <Eye size={14} />
                                                        {result.views}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
