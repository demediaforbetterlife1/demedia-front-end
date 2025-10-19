"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Trophy, 
    Flame, 
    Star, 
    Zap, 
    Crown, 
    Target, 
    Clock, 
    Users,
    Gift,
    TrendingUp,
    Award,
    Sparkles,
    Rocket,
    Diamond,
    Heart,
    Eye,
    Share
} from "lucide-react";

interface UserStats {
    level: number;
    xp: number;
    xpToNext: number;
    streak: number;
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    rank: number;
    badges: Badge[];
    tokens: number;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: any;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    earned: boolean;
    progress?: number;
    maxProgress?: number;
}

interface Challenge {
    id: string;
    title: string;
    description: string;
    reward: number;
    deadline: Date;
    progress: number;
    maxProgress: number;
    type: 'daily' | 'weekly' | 'monthly' | 'special';
}

export default function GamificationSystem() {
    const [userStats, setUserStats] = useState<UserStats>({
        level: 15,
        xp: 2450,
        xpToNext: 500,
        streak: 7,
        totalViews: 125000,
        totalLikes: 8900,
        totalShares: 1200,
        rank: 42,
        badges: [],
        tokens: 1250
    });

    const [activeTab, setActiveTab] = useState<'stats' | 'challenges' | 'rewards' | 'leaderboard'>('stats');

    const badges: Badge[] = [
        {
            id: "first-deSnap",
            name: "DeSnap Pioneer",
            description: "Created your first DeSnap",
            icon: Zap,
            rarity: "common",
            earned: true
        },
        {
            id: "viral-creator",
            name: "Viral Creator",
            description: "Get 10K views on a single DeSnap",
            icon: TrendingUp,
            rarity: "rare",
            earned: true
        },
        {
            id: "streak-master",
            name: "Streak Master",
            description: "Maintain a 30-day posting streak",
            icon: Flame,
            rarity: "epic",
            earned: false,
            progress: 7,
            maxProgress: 30
        },
        {
            id: "collaboration-king",
            name: "Collaboration King",
            description: "Collaborate with 50 different creators",
            icon: Users,
            rarity: "legendary",
            earned: false,
            progress: 12,
            maxProgress: 50
        },
        {
            id: "trend-setter",
            name: "Trend Setter",
            description: "Start a trending hashtag",
            icon: Sparkles,
            rarity: "epic",
            earned: true
        },
        {
            id: "engagement-expert",
            name: "Engagement Expert",
            description: "Get 1M total likes across all DeSnaps",
            icon: Heart,
            rarity: "legendary",
            earned: false,
            progress: 8900,
            maxProgress: 1000000
        }
    ];

    const challenges: Challenge[] = [
        {
            id: "daily-poster",
            title: "Daily Creator",
            description: "Post a DeSnap every day this week",
            reward: 100,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            progress: 3,
            maxProgress: 7,
            type: "daily"
        },
        {
            id: "collaboration-challenge",
            title: "Team Player",
            description: "Collaborate with 5 different creators",
            reward: 250,
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            progress: 2,
            maxProgress: 5,
            type: "weekly"
        },
        {
            id: "viral-challenge",
            title: "Go Viral",
            description: "Get 50K views on a single DeSnap",
            reward: 500,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            progress: 0,
            maxProgress: 1,
            type: "monthly"
        }
    ];

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'text-gray-400 border-gray-500';
            case 'rare': return 'text-blue-400 border-blue-500';
            case 'epic': return 'text-purple-400 border-purple-500';
            case 'legendary': return 'text-yellow-400 border-yellow-500';
            default: return 'text-gray-400 border-gray-500';
        }
    };

    const getRarityBg = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'bg-gray-500/10';
            case 'rare': return 'bg-blue-500/10';
            case 'epic': return 'bg-purple-500/10';
            case 'legendary': return 'bg-yellow-500/10';
            default: return 'bg-gray-500/10';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <h2 className="text-3xl font-bold text-white">DeSnaps Gamification</h2>
                    <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-gray-400">Earn rewards, climb ranks, and unlock achievements</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-900/20 to-blue-700/20 rounded-xl p-4 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                        <Crown className="w-6 h-6 text-blue-400" />
                        <div>
                            <p className="text-blue-300 text-sm">Level</p>
                            <p className="text-white text-2xl font-bold">{userStats.level}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-900/20 to-green-700/20 rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center gap-3">
                        <Flame className="w-6 h-6 text-green-400" />
                        <div>
                            <p className="text-green-300 text-sm">Streak</p>
                            <p className="text-white text-2xl font-bold">{userStats.streak} days</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-900/20 to-purple-700/20 rounded-xl p-4 border border-purple-500/20">
                    <div className="flex items-center gap-3">
                        <Target className="w-6 h-6 text-purple-400" />
                        <div>
                            <p className="text-purple-300 text-sm">Rank</p>
                            <p className="text-white text-2xl font-bold">#{userStats.rank}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-700/20 rounded-xl p-4 border border-yellow-500/20">
                    <div className="flex items-center gap-3">
                        <Diamond className="w-6 h-6 text-yellow-400" />
                        <div>
                            <p className="text-yellow-300 text-sm">Tokens</p>
                            <p className="text-white text-2xl font-bold">{userStats.tokens}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* XP Progress */}
            <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Experience Points</span>
                    <span className="text-gray-400">{userStats.xp} / {userStats.xp + userStats.xpToNext} XP</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(userStats.xp / (userStats.xp + userStats.xpToNext)) * 100}%` }}
                    />
                </div>
                <p className="text-gray-400 text-sm mt-1">{userStats.xpToNext} XP to next level</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1">
                {[
                    { id: 'stats', label: 'Stats', icon: TrendingUp },
                    { id: 'challenges', label: 'Challenges', icon: Target },
                    { id: 'rewards', label: 'Rewards', icon: Gift },
                    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                                activeTab === tab.id
                                    ? "bg-purple-600 text-white shadow-lg"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div
                        key="stats"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Eye className="w-5 h-5 text-blue-400" />
                                    <span className="text-white font-semibold">Total Views</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{userStats.totalViews.toLocaleString()}</p>
                            </div>
                            
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Heart className="w-5 h-5 text-red-400" />
                                    <span className="text-white font-semibold">Total Likes</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{userStats.totalLikes.toLocaleString()}</p>
                            </div>
                            
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Share className="w-5 h-5 text-green-400" />
                                    <span className="text-white font-semibold">Total Shares</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{userStats.totalShares.toLocaleString()}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'challenges' && (
                    <motion.div
                        key="challenges"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {challenges.map((challenge) => (
                            <div key={challenge.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-white font-semibold">{challenge.title}</h3>
                                        <p className="text-gray-400 text-sm">{challenge.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-yellow-400 font-bold">+{challenge.reward} tokens</p>
                                        <p className="text-gray-400 text-xs">
                                            {challenge.deadline.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400 text-sm">Progress</span>
                                    <span className="text-white text-sm">
                                        {challenge.progress} / {challenge.maxProgress}
                                    </span>
                                </div>
                                
                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${(challenge.progress / challenge.maxProgress) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'rewards' && (
                    <motion.div
                        key="rewards"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {badges.map((badge) => {
                                const Icon = badge.icon;
                                const rarityColor = getRarityColor(badge.rarity);
                                const rarityBg = getRarityBg(badge.rarity);
                                
                                return (
                                    <div 
                                        key={badge.id} 
                                        className={`rounded-xl p-4 border ${rarityColor} ${rarityBg} ${
                                            badge.earned ? 'opacity-100' : 'opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Icon className="w-6 h-6" />
                                            <div>
                                                <h3 className="text-white font-semibold">{badge.name}</h3>
                                                <p className="text-gray-400 text-sm">{badge.description}</p>
                                            </div>
                                        </div>
                                        
                                        {badge.progress !== undefined && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Progress</span>
                                                    <span className="text-white">
                                                        {badge.progress} / {badge.maxProgress}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${badge.maxProgress ? (badge.progress / badge.maxProgress) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {badge.earned && (
                                            <div className="flex items-center gap-2 mt-3">
                                                <Award className="w-4 h-4 text-yellow-400" />
                                                <span className="text-yellow-400 text-sm font-semibold">Earned!</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'leaderboard' && (
                    <motion.div
                        key="leaderboard"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <h3 className="text-white font-semibold mb-4">Global Leaderboard</h3>
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((rank) => (
                                    <div key={rank} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                                rank === 1 ? 'bg-yellow-500 text-black' :
                                                rank === 2 ? 'bg-gray-400 text-black' :
                                                rank === 3 ? 'bg-orange-500 text-white' :
                                                'bg-gray-600 text-white'
                                            }`}>
                                                {rank}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Creator {rank}</p>
                                                <p className="text-gray-400 text-sm">{Math.floor(Math.random() * 1000000)} XP</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-semibold">Level {15 + rank}</p>
                                            <p className="text-gray-400 text-sm">{Math.floor(Math.random() * 100)}K views</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
