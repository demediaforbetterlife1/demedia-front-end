"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Eye, 
    EyeOff, 
    MessageCircle, 
    ThumbsUp, 
    ThumbsDown,
    Star,
    TrendingUp,
    TrendingDown,
    Shield,
    Send,
    X,
    Plus,
    Filter,
    Search
} from "lucide-react";

interface AnonymousInsight {
    id: string;
    content: string;
    type: "feedback" | "suggestion" | "compliment" | "criticism";
    sentiment: "positive" | "negative" | "neutral";
    category: string;
    timestamp: Date;
    isRead: boolean;
    rating?: number;
    tags: string[];
}

interface AnonymousInsightsProps {
    isOpen: boolean;
    onClose: () => void;
    onInsightReceived: (insight: AnonymousInsight) => void;
}

const sampleInsights: AnonymousInsight[] = [
    {
        id: "1",
        content: "Your recent posts about productivity have been really helpful! Keep sharing those tips.",
        type: "compliment",
        sentiment: "positive",
        category: "Content Quality",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: false,
        rating: 5,
        tags: ["productivity", "helpful"]
    },
    {
        id: "2",
        content: "Consider posting more behind-the-scenes content. People love seeing the real process.",
        type: "suggestion",
        sentiment: "positive",
        category: "Content Strategy",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        isRead: true,
        rating: 4,
        tags: ["behind-the-scenes", "authentic"]
    },
    {
        id: "3",
        content: "Your video quality could be improved. Consider better lighting for your DeSnaps.",
        type: "feedback",
        sentiment: "neutral",
        category: "Technical Quality",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isRead: true,
        rating: 3,
        tags: ["video", "quality", "lighting"]
    },
    {
        id: "4",
        content: "Love your authentic voice! Don't change who you are for more followers.",
        type: "compliment",
        sentiment: "positive",
        category: "Authenticity",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isRead: false,
        rating: 5,
        tags: ["authentic", "voice", "encouragement"]
    }
];

export default function AnonymousInsights({ isOpen, onClose, onInsightReceived }: AnonymousInsightsProps) {
    const [activeTab, setActiveTab] = useState<"received" | "send" | "analytics">("received");
    const [insights, setInsights] = useState<AnonymousInsight[]>(sampleInsights);
    const [showSendForm, setShowSendForm] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [newInsight, setNewInsight] = useState({
        content: "",
        type: "feedback" as const,
        sentiment: "positive" as const,
        category: "",
        rating: 5,
        tags: [] as string[]
    });

    const [filterType, setFilterType] = useState<string>("all");
    const [filterSentiment, setFilterSentiment] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const categories = [
        "Content Quality", "Content Strategy", "Technical Quality", "Authenticity", 
        "Engagement", "Community", "Personal Growth", "Other"
    ];

    const handleSendInsight = async () => {
        if (!newInsight.content.trim()) return;

        setIsSending(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const insightData = {
            ...newInsight,
            id: Date.now().toString(),
            timestamp: new Date(),
            isRead: false
        };
        
        setInsights(prev => [insightData, ...prev]);
        setShowSendForm(false);
        setNewInsight({
            content: "",
            type: "feedback",
            sentiment: "positive",
            category: "",
            rating: 5,
            tags: []
        });
        setIsSending(false);
        onInsightReceived(insightData);
    };

    const handleMarkAsRead = (insightId: string) => {
        setInsights(prev => prev.map(insight => 
            insight.id === insightId ? { ...insight, isRead: true } : insight
        ));
    };

    const filteredInsights = insights.filter(insight => {
        const matchesType = filterType === "all" || insight.type === filterType;
        const matchesSentiment = filterSentiment === "all" || insight.sentiment === filterSentiment;
        const matchesSearch = searchQuery === "" || 
            insight.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            insight.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesType && matchesSentiment && matchesSearch;
    });

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case "positive": return "text-green-400 bg-green-500/20";
            case "negative": return "text-red-400 bg-red-500/20";
            case "neutral": return "text-yellow-400 bg-yellow-500/20";
            default: return "text-gray-400 bg-gray-500/20";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "feedback": return <MessageCircle size={16} />;
            case "suggestion": return <TrendingUp size={16} />;
            case "compliment": return <ThumbsUp size={16} />;
            case "criticism": return <ThumbsDown size={16} />;
            default: return <MessageCircle size={16} />;
        }
    };

    const getAnalytics = () => {
        const totalInsights = insights.length;
        const positiveInsights = insights.filter(i => i.sentiment === "positive").length;
        const averageRating = insights.reduce((sum, i) => sum + (i.rating || 0), 0) / totalInsights;
        const unreadCount = insights.filter(i => !i.isRead).length;
        
        return { totalInsights, positiveInsights, averageRating, unreadCount };
    };

    const analytics = getAnalytics();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-slate-500 rounded-full flex items-center justify-center">
                                        <Eye size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Anonymous Insights</h2>
                                        <p className="text-gray-400 text-sm">Get honest feedback without revealing identity</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("received")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "received" 
                                            ? "bg-gray-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Received ({analytics.unreadCount} new)
                                </button>
                                <button
                                    onClick={() => setActiveTab("send")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "send" 
                                            ? "bg-gray-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Send Insight
                                </button>
                                <button
                                    onClick={() => setActiveTab("analytics")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "analytics" 
                                            ? "bg-gray-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Analytics
                                </button>
                            </div>

                            {activeTab === "received" && (
                                <div className="space-y-4">
                                    {/* Filters */}
                                    <div className="flex gap-4 mb-4">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Search insights..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                                            />
                                        </div>
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="feedback">Feedback</option>
                                            <option value="suggestion">Suggestion</option>
                                            <option value="compliment">Compliment</option>
                                            <option value="criticism">Criticism</option>
                                        </select>
                                        <select
                                            value={filterSentiment}
                                            onChange={(e) => setFilterSentiment(e.target.value)}
                                            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        >
                                            <option value="all">All Sentiments</option>
                                            <option value="positive">Positive</option>
                                            <option value="negative">Negative</option>
                                            <option value="neutral">Neutral</option>
                                        </select>
                                    </div>

                                    {/* Insights List */}
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {filteredInsights.map((insight) => (
                                            <motion.div
                                                key={insight.id}
                                                className={`bg-gray-800 rounded-xl p-4 border transition-colors ${
                                                    insight.isRead ? 'border-gray-700' : 'border-gray-600'
                                                }`}
                                                whileHover={{ scale: 1.01 }}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {getTypeIcon(insight.type)}
                                                        <span className="text-white font-medium capitalize">{insight.type}</span>
                                                        <div className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(insight.sentiment)}`}>
                                                            {insight.sentiment}
                                                        </div>
                                                        {!insight.isRead && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {insight.timestamp.toLocaleDateString()}
                                                    </div>
                                                </div>
                                                
                                                <p className="text-gray-300 mb-3">{insight.content}</p>
                                                
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="text-gray-400">{insight.category}</span>
                                                        {insight.rating && (
                                                            <div className="flex items-center gap-1">
                                                                <Star size={14} className="text-yellow-400" />
                                                                <span className="text-yellow-400">{insight.rating}/5</span>
                                                            </div>
                                                        )}
                                                        <div className="flex gap-1">
                                                            {insight.tags.map(tag => (
                                                                <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    {!insight.isRead && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(insight.id)}
                                                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                                        >
                                                            Mark as Read
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === "send" && (
                                <div className="space-y-4">
                                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Shield size={20} className="text-green-400" />
                                            <h3 className="text-white font-semibold">Send Anonymous Insight</h3>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-4">
                                            Your identity will remain completely anonymous. Share honest feedback to help others improve.
                                        </p>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-white font-medium mb-2">Your Insight</label>
                                                <textarea
                                                    value={newInsight.content}
                                                    onChange={(e) => setNewInsight(prev => ({ ...prev, content: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500 h-24 resize-none"
                                                    placeholder="Share your honest feedback or suggestion..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-white font-medium mb-2">Type</label>
                                                    <select
                                                        value={newInsight.type}
                                                        onChange={(e) => setNewInsight(prev => ({ ...prev, type: e.target.value as any }))}
                                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                    >
                                                        <option value="feedback">Feedback</option>
                                                        <option value="suggestion">Suggestion</option>
                                                        <option value="compliment">Compliment</option>
                                                        <option value="criticism">Criticism</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-white font-medium mb-2">Category</label>
                                                    <select
                                                        value={newInsight.category}
                                                        onChange={(e) => setNewInsight(prev => ({ ...prev, category: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(category => (
                                                            <option key={category} value={category}>{category}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-white font-medium mb-2">Sentiment</label>
                                                    <select
                                                        value={newInsight.sentiment}
                                                        onChange={(e) => setNewInsight(prev => ({ ...prev, sentiment: e.target.value as any }))}
                                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                    >
                                                        <option value="positive">Positive</option>
                                                        <option value="neutral">Neutral</option>
                                                        <option value="negative">Negative</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-white font-medium mb-2">Rating (1-5)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        value={newInsight.rating}
                                                        onChange={(e) => setNewInsight(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setShowSendForm(false)}
                                                    className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSendInsight}
                                                    disabled={!newInsight.content.trim() || !newInsight.category || isSending}
                                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-500 to-slate-500 text-white rounded-lg hover:from-gray-600 hover:to-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {isSending ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send size={16} />
                                                            Send Anonymously
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "analytics" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-800 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-white">{analytics.totalInsights}</div>
                                            <div className="text-sm text-gray-400">Total Insights</div>
                                        </div>
                                        <div className="bg-gray-800 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-white">{analytics.positiveInsights}</div>
                                            <div className="text-sm text-gray-400">Positive</div>
                                        </div>
                                        <div className="bg-gray-800 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-white">{analytics.averageRating.toFixed(1)}</div>
                                            <div className="text-sm text-gray-400">Avg Rating</div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-800 rounded-xl p-4">
                                        <h3 className="text-white font-semibold mb-4">Insight Categories</h3>
                                        <div className="space-y-2">
                                            {categories.map(category => {
                                                const count = insights.filter(i => i.category === category).length;
                                                return (
                                                    <div key={category} className="flex items-center justify-between">
                                                        <span className="text-gray-300">{category}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-20 bg-gray-700 rounded-full h-2">
                                                                <div 
                                                                    className="bg-gray-500 h-2 rounded-full"
                                                                    style={{ width: `${(count / Math.max(...categories.map(c => insights.filter(i => i.category === c).length))) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-white text-sm w-8 text-right">{count}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
