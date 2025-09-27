"use client";

import { useState, useCallback, useRef } from 'react';

interface SearchResult {
  id: string;
  type: 'user' | 'post';
  name?: string;
  username?: string;
  title?: string;
  content?: string;
  author?: {
    name: string;
  };
}

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const [usersRes, postsRes] = await Promise.all([
        fetch(`/api/search/users?q=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`/api/search/posts?q=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      const [users, posts] = await Promise.all([
        usersRes.ok ? usersRes.json() : [],
        postsRes.ok ? postsRes.json() : []
      ]);

      const results: SearchResult[] = [
        ...users.map((user: any) => ({ ...user, type: 'user' as const })),
        ...posts.map((post: any) => ({ ...post, type: 'post' as const }))
      ];
      
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback((query: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      search(query);
    }, 300);
  }, [search]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const handleSearchSubmit = useCallback((query: string) => {
    if (query.trim()) {
      // Navigate to search results page
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const hideSearchResults = useCallback(() => {
    setShowSearchResults(false);
  }, []);

  return {
    searchQuery,
    searchResults,
    showSearchResults,
    isSearching,
    error,
    handleSearchInputChange,
    handleSearchSubmit,
    clearSearch,
    hideSearchResults,
    search,
  };
};
