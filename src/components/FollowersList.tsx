"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, UserCheck, UserX, Search } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeClasses, getButtonClasses, getModalClasses } from '@/utils/themeUtils';

interface Follower {
  id: number;
  name: string;
  username: string;
  profilePicture?: string;
  isFollowing: boolean;
  followedAt: string;
}

interface FollowersListProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  type: 'followers' | 'following';
}

export default function FollowersList({ isOpen, onClose, userId, type }: FollowersListProps) {
  const { theme } = useTheme();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const themeClasses = getThemeClasses(theme);
  const modalClasses = getModalClasses(theme);

  useEffect(() => {
    if (isOpen) {
      fetchFollowers();
    }
  }, [isOpen, userId, type]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = type === 'followers' 
        ? `/api/user/${userId}/followers`
        : `/api/user/${userId}/following`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'user-id': localStorage.getItem('userId') || '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowers(data);
      } else {
        setError('Failed to load followers');
      }
    } catch (err) {
      setError('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (followerId: number, isFollowing: boolean) => {
    try {
      setActionLoading(followerId);
      
      const endpoint = isFollowing 
        ? `/api/user/${followerId}/unfollow`
        : `/api/user/${followerId}/follow`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'user-id': localStorage.getItem('userId') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ followerId: parseInt(localStorage.getItem('userId') || '0') })
      });

      if (response.ok) {
        // Update the local state
        setFollowers(prev => 
          prev.map(follower => 
            follower.id === followerId 
              ? { ...follower, isFollowing: !isFollowing }
              : follower
          )
        );
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredFollowers = followers.filter(follower =>
    follower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    follower.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={modalClasses.overlay}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={modalClasses.content}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={modalClasses.header}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${themeClasses.textPrimary}`}>
                {type === 'followers' ? 'Followers' : 'Following'}
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${themeClasses.hover}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${type}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg ${themeClasses.bgTertiary} ${themeClasses.textPrimary} ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className={themeClasses.textSecondary}>{error}</p>
                <button
                  onClick={fetchFollowers}
                  className={getButtonClasses(theme, 'primary')}
                >
                  Try Again
                </button>
              </div>
            ) : filteredFollowers.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className={themeClasses.textSecondary}>
                  {searchQuery ? 'No results found' : `No ${type} yet`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFollowers.map((follower) => (
                  <motion.div
                    key={follower.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center justify-between p-3 rounded-lg ${themeClasses.bgTertiary} ${themeClasses.border}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center">
                        {follower.profilePicture ? (
                          <img
                            src={follower.profilePicture}
                            alt={follower.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${themeClasses.textPrimary}`}>
                          {follower.name}
                        </h3>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                          @{follower.username}
                        </p>
                      </div>
                    </div>
                    
                    {type === 'following' && (
                      <button
                        onClick={() => handleFollowToggle(follower.id, follower.isFollowing)}
                        disabled={actionLoading === follower.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          follower.isFollowing
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        } ${actionLoading === follower.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {actionLoading === follower.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : follower.isFollowing ? (
                          <>
                            <UserX className="w-4 h-4 mr-1" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Follow
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
