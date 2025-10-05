"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Filter, Clock, TrendingUp, Users, Hash, Image, Video, Mic } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'story' | 'hashtag';
  title: string;
  content?: string;
  author?: {
    name: string;
    username: string;
    profilePicture?: string;
  };
  hashtags?: string[];
  createdAt?: string;
  likes?: number;
  comments?: number;
}

interface EnhancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedSearchModal({ isOpen, onClose }: EnhancedSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'posts' | 'stories' | 'hashtags'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'popularity'>('relevance');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    // Load trending hashtags (mock data for now)
    setTrendingHashtags(['#technology', '#lifestyle', '#travel', '#food', '#fitness']);
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: query,
        filter: activeFilter,
        sort: sortBy,
        time: timeFilter
      });

      const response = await fetch(`/api/search/enhanced?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Add to recent searches
      const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));

      // Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(query)}&filter=${activeFilter}&sort=${sortBy}&time=${timeFilter}`);
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      performSearch(query);
    } else {
      setSearchResults([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users size={16} className="text-blue-400" />;
      case 'post': return <Hash size={16} className="text-green-400" />;
      case 'story': return <Image size={16} className="text-purple-400" />;
      case 'hashtag': return <Hash size={16} className="text-orange-400" />;
      default: return <Search size={16} className="text-gray-400" />;
    }
  };

  const getResultTypeText = (type: string) => {
    switch (type) {
      case 'user': return 'User';
      case 'post': return 'Post';
      case 'story': return 'Story';
      case 'hashtag': return 'Hashtag';
      default: return 'Result';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-2xl mx-4 rounded-2xl p-[4px] bg-transparent"
          >
            <motion.div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 blur-md animate-spin-slow" style={{ zIndex: 0 }} />
            <div className="relative bg-gradient-to-br from-[#0d1b2a]/90 via-[#1b263b]/80 to-[#0d1b2a]/90 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-cyan-200">Enhanced Search</h2>
                <button
                  onClick={onClose}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search users, posts, stories, hashtags..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                >
                  <Filter size={16} />
                  Filters
                </button>
                
                {showFilters && (
                  <div className="flex gap-2">
                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-lg bg-[#1b263b]/70 text-white text-sm"
                    >
                      <option value="all">All</option>
                      <option value="users">Users</option>
                      <option value="posts">Posts</option>
                      <option value="stories">Stories</option>
                      <option value="hashtags">Hashtags</option>
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 rounded-lg bg-[#1b263b]/70 text-white text-sm"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="date">Date</option>
                      <option value="popularity">Popularity</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 mb-4">
                  {searchResults.slice(0, 5).map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSearch(result.title)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#1b263b]/50 hover:bg-[#1b263b]/70 cursor-pointer transition-colors"
                    >
                      {getResultIcon(result.type)}
                      <div className="flex-1">
                        <div className="text-white font-medium">{result.title}</div>
                        <div className="text-cyan-300 text-sm">{getResultTypeText(result.type)}</div>
                        {result.content && (
                          <div className="text-gray-400 text-xs mt-1 line-clamp-1">{result.content}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {searchQuery === "" && recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-cyan-200 font-semibold flex items-center gap-2">
                      <Clock size={16} />
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(search);
                          handleSearch(search);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-[#1b263b]/50 transition-colors text-cyan-300"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Hashtags */}
              {searchQuery === "" && (
                <div className="mb-4">
                  <h3 className="text-cyan-200 font-semibold flex items-center gap-2 mb-2">
                    <TrendingUp size={16} />
                    Trending
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingHashtags.map((hashtag, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(hashtag);
                          handleSearch(hashtag);
                        }}
                        className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-sm"
                      >
                        {hashtag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSearch(searchQuery)}
                  disabled={!searchQuery.trim()}
                  className="flex-1 py-2 px-4 rounded-lg bg-cyan-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-600 transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={() => router.push('/search')}
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                >
                  Advanced
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
