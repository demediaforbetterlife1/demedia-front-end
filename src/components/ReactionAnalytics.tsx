"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, Users, Heart, ThumbsUp, Laugh, Fire, Star, Zap, PartyPopper } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ReactionAnalyticsProps {
    postId: number;
    isOpen: boolean;
    onClose: () => void;
}

interface ReactionStats {
    emoji: string;
    count: number;
    percentage: number;
    users: string[];
}

const REACTION_ICONS = {
    "❤️": Heart,
    "👍": ThumbsUp,
    "😂": Laugh,
    "🔥": Fire,
    "⭐": Star,
    "⚡": Zap,
    "🎉": PartyPopper,
};

export default function ReactionAnalytics({ postId, isOpen, onClose }: ReactionAnalyticsProps) {
    const [stats, setStats] = useState<ReactionStats[]>([]);
    const [totalReactions, setTotalReactions] = useState(0);
    const [uniqueUsers, setUniqueUsers] = useState(0);
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'all'>('all');

    useEffect(() => {
        if (isOpen && postId) {
            fetchAnalytics();
        }
    }, [isOpen, postId, timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await apiFetch(`/api/posts/${postId}/reactions/analytics?range=${timeRange}`);
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats || []);
                setTotalReactions(data.totalReactions || 0);
                setUniqueUsers(data.uniqueUsers || 0);
            }
        } catch (error) {
            console.error('Error fetching reaction analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getReactionIcon = (emoji: string) => {
        const IconComponent = REACTION_ICONS[emoji as keyof typeof REACTION_ICONS];
        return IconComponent || Heart;
    };

    const getReactionColor = (emoji: string) => {
        const colors = {
            "❤️": "text-red-500",
            "👍": "text-blue-500",
            "😂": "text-yellow-500",
            "🔥": "text-orange-500",
            "⭐": "text-purple-500",
            "⚡": "text-cyan-500",
            "🎉": "text-pink-500",
        };
        return colors[emoji as keyof typeof colors] || "text-gray-500";
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[80vh] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Reaction Analytics
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Post #{postId} engagement insights
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Time Range Selector */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</span>
                            <div className="flex space-x-2">
                                {(['hour', 'day', 'week', 'all'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                            timeRange === range
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {range.charAt(0).toUpperCase() + range.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm opacity-90">Total Reactions</p>
                                                <p className="text-2xl font-bold">{totalReactions}</p>
                                            </div>
                                            <TrendingUp className="w-8 h-8 opacity-80" />
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm opacity-90">Unique Users</p>
                                                <p className="text-2xl font-bold">{uniqueUsers}</p>
                                            </div>
                                            <Users className="w-8 h-8 opacity-80" />
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm opacity-90">Avg per User</p>
                                                <p className="text-2xl font-bold">
                                                    {uniqueUsers > 0 ? Math.round(totalReactions / uniqueUsers * 10) / 10 : 0}
                                                </p>
                                            </div>
                                            <Heart className="w-8 h-8 opacity-80" />
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Reaction Breakdown */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Reaction Breakdown
                                    </h3>
                                    <div className="space-y-3">
                                        {stats.map((stat, index) => {
                                            const IconComponent = getReactionIcon(stat.emoji);
                                            return (
                                                <motion.div
                                                    key={stat.emoji}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getReactionColor(stat.emoji)} bg-gray-100 dark:bg-gray-700`}>
                                                            <IconComponent className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {stat.emoji} {stat.count} reactions
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {stat.percentage.toFixed(1)}% of total
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${stat.percentage}%` }}
                                                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                            {stat.percentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Top Reactors */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Most Active Reactors
                                    </h3>
                                    <div className="space-y-2">
                                        {stats.slice(0, 5).map((stat, index) => (
                                            <div key={stat.emoji} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-lg">{stat.emoji}</span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {stat.users.slice(0, 3).join(', ')}
                                                        {stat.users.length > 3 && ` +${stat.users.length - 3} more`}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {stat.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
