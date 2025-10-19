"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Users,
  Calendar,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';

interface ProfileAnalyticsProps {
  userId: string;
  posts: any[];
}

export default function ProfileAnalytics({ userId, posts }: ProfileAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

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
    const calculateAnalytics = () => {
      const totalPosts = posts.length;
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
      const totalShares = posts.reduce((sum, post) => sum + (post.shares || 0), 0);
      const avgEngagement = totalPosts > 0 ? ((totalLikes + totalComments + totalShares) / totalPosts) : 0;
      
      // Calculate growth metrics
      const thisWeek = posts.filter(post => {
        const postDate = new Date(post.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return postDate > weekAgo;
      }).length;
      
      const lastWeek = posts.filter(post => {
        const postDate = new Date(post.createdAt);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return postDate > twoWeeksAgo && postDate <= weekAgo;
      }).length;
      
      const growthRate = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;
      
      // Top performing post
      const topPost = posts.reduce((top, post) => {
        const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
        const topEngagement = (top.likes || 0) + (top.comments || 0) + (top.shares || 0);
        return engagement > topEngagement ? post : top;
      }, posts[0] || {});

      setAnalytics({
        totalPosts,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagement: Math.round(avgEngagement),
        growthRate: Math.round(growthRate),
        thisWeek,
        lastWeek,
        topPost,
        engagementRate: totalPosts > 0 ? Math.round((totalLikes + totalComments + totalShares) / totalPosts) : 0
      });
      setLoading(false);
    };

    calculateAnalytics();
  }, [posts]);

  if (loading) {
    return (
      <div className={`p-6 ${themeClasses.bg} rounded-xl ${themeClasses.border} border`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Posts',
      value: analytics?.totalPosts || 0,
      icon: <BarChart3 size={24} />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Total Likes',
      value: analytics?.totalLikes || 0,
      icon: <Heart size={24} />,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Total Comments',
      value: analytics?.totalComments || 0,
      icon: <MessageCircle size={24} />,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Engagement Rate',
      value: `${analytics?.engagementRate || 0}%`,
      icon: <Target size={24} />,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 ${themeClasses.bg} rounded-xl ${themeClasses.border} border shadow-lg`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${themeClasses.text} flex items-center gap-2`}>
          <TrendingUp className="text-blue-500" size={24} />
          Profile Analytics
        </h3>
        <div className={`px-3 py-1 rounded-full ${themeClasses.accentBg} ${themeClasses.accent} text-sm font-medium`}>
          <Zap size={16} className="inline mr-1" />
          Live Data
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg ${stat.bgColor} border ${themeClasses.border} ${themeClasses.hover} transition-all duration-300`}
          >
            <div className={`${stat.color} mb-2`}>
              {stat.icon}
            </div>
            <div className={`text-2xl font-bold ${themeClasses.text}`}>
              {stat.value}
            </div>
            <div className={`text-sm ${themeClasses.textSecondary}`}>
              {stat.title}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-4 rounded-lg ${themeClasses.bg} border ${themeClasses.border}`}>
          <h4 className={`font-semibold ${themeClasses.text} mb-3 flex items-center gap-2`}>
            <Calendar size={20} className="text-blue-500" />
            Weekly Growth
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={themeClasses.textSecondary}>This Week</span>
              <span className={`font-bold ${themeClasses.text}`}>{analytics?.thisWeek || 0} posts</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={themeClasses.textSecondary}>Last Week</span>
              <span className={`font-bold ${themeClasses.text}`}>{analytics?.lastWeek || 0} posts</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={themeClasses.textSecondary}>Growth Rate</span>
              <span className={`font-bold ${analytics?.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {analytics?.growthRate >= 0 ? '+' : ''}{analytics?.growthRate || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${themeClasses.bg} border ${themeClasses.border}`}>
          <h4 className={`font-semibold ${themeClasses.text} mb-3 flex items-center gap-2`}>
            <Users size={20} className="text-green-500" />
            Top Performance
          </h4>
          {analytics?.topPost ? (
            <div className="space-y-2">
              <div className={`text-sm ${themeClasses.textSecondary} line-clamp-2`}>
                "{analytics.topPost.content?.substring(0, 100)}..."
              </div>
              <div className="flex justify-between text-sm">
                <span className={themeClasses.textSecondary}>Likes</span>
                <span className={themeClasses.text}>{analytics.topPost.likes || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={themeClasses.textSecondary}>Comments</span>
                <span className={themeClasses.text}>{analytics.topPost.comments || 0}</span>
              </div>
            </div>
          ) : (
            <div className={`text-sm ${themeClasses.textSecondary}`}>
              No posts yet
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
