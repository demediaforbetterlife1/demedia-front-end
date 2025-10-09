"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Wand2, 
    Sparkles, 
    TrendingUp, 
    Hash, 
    Image, 
    Video, 
    Music, 
    FileText,
    Lightbulb,
    Target,
    Zap,
    X,
    Plus,
    Copy,
    Check
} from "lucide-react";

interface AISuggestion {
    id: string;
    type: "post" | "desnap" | "story" | "poll" | "question";
    title: string;
    description: string;
    content: string;
    tags: string[];
    trendingScore: number;
    engagementPrediction: number;
    difficulty: "easy" | "medium" | "hard";
    estimatedTime: string;
    category: string;
}

interface AISuggestionsProps {
    isOpen: boolean;
    onClose: () => void;
    onSuggestionSelected: (suggestion: AISuggestion) => void;
}

const sampleSuggestions: AISuggestion[] = [
    {
        id: "1",
        type: "post",
        title: "Share Your Morning Routine",
        description: "People love seeing authentic daily routines",
        content: "What's your ideal morning routine? Share the habits that set you up for success! 🌅 #MorningRoutine #Productivity #Wellness",
        tags: ["lifestyle", "productivity", "wellness"],
        trendingScore: 85,
        engagementPrediction: 78,
        difficulty: "easy",
        estimatedTime: "2 min",
        category: "Lifestyle"
    },
    {
        id: "2",
        type: "desnap",
        title: "Quick Skill Tutorial",
        description: "Short-form educational content is trending",
        content: "Teach a quick skill in 30 seconds! Perfect for DeSnap format. Think: origami, cooking tip, or life hack.",
        tags: ["education", "tutorial", "skills"],
        trendingScore: 92,
        engagementPrediction: 85,
        difficulty: "medium",
        estimatedTime: "5 min",
        category: "Education"
    },
    {
        id: "3",
        type: "poll",
        title: "Community Opinion Poll",
        description: "Interactive content drives high engagement",
        content: "What's your favorite way to unwind after a long day? A) Reading B) Exercise C) Music D) Socializing",
        tags: ["community", "interactive", "lifestyle"],
        trendingScore: 78,
        engagementPrediction: 92,
        difficulty: "easy",
        estimatedTime: "1 min",
        category: "Community"
    },
    {
        id: "4",
        type: "story",
        title: "Behind-the-Scenes Moment",
        description: "Authentic, personal content performs well",
        content: "Share a behind-the-scenes moment from your work or hobby. People love seeing the real process!",
        tags: ["authentic", "personal", "behind-the-scenes"],
        trendingScore: 88,
        engagementPrediction: 82,
        difficulty: "easy",
        estimatedTime: "3 min",
        category: "Personal"
    },
    {
        id: "5",
        type: "question",
        title: "Ask for Advice",
        description: "Questions encourage community interaction",
        content: "I'm trying to decide between two career paths. What factors should I consider? Looking for diverse perspectives!",
        tags: ["advice", "career", "community"],
        trendingScore: 75,
        engagementPrediction: 88,
        difficulty: "easy",
        estimatedTime: "2 min",
        category: "Community"
    }
];

export default function AISuggestions({ isOpen, onClose, onSuggestionSelected }: AISuggestionsProps) {
    const [activeTab, setActiveTab] = useState<"trending" | "personalized" | "categories">("trending");
    const [suggestions, setSuggestions] = useState<AISuggestion[]>(sampleSuggestions);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const categories = ["all", "Lifestyle", "Education", "Community", "Personal", "Entertainment", "Business"];

    const handleGenerateSuggestions = async () => {
        setIsGenerating(true);
        
        // Simulate AI generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Add new suggestions
        const newSuggestions = [
            {
                id: Date.now().toString(),
                type: "post" as const,
                title: "AI-Generated Suggestion",
                description: "Fresh content idea based on current trends",
                content: "This is a dynamically generated suggestion based on your interests and current trends!",
                tags: ["ai-generated", "trending"],
                trendingScore: Math.floor(Math.random() * 30) + 70,
                engagementPrediction: Math.floor(Math.random() * 30) + 70,
                difficulty: "easy" as const,
                estimatedTime: "2 min",
                category: "AI Generated"
            }
        ];
        
        setSuggestions(prev => [...newSuggestions, ...prev]);
        setIsGenerating(false);
    };

    const handleCopyContent = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSelectSuggestion = (suggestion: AISuggestion) => {
        onSuggestionSelected(suggestion);
        onClose();
    };

    const filteredSuggestions = selectedCategory === "all" 
        ? suggestions 
        : suggestions.filter(s => s.category === selectedCategory);

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "easy": return "text-green-400 bg-green-500/20";
            case "medium": return "text-yellow-400 bg-yellow-500/20";
            case "hard": return "text-red-400 bg-red-500/20";
            default: return "text-gray-400 bg-gray-500/20";
        }
    };

    const getTrendingColor = (score: number) => {
        if (score >= 90) return "text-green-400";
        if (score >= 80) return "text-yellow-400";
        if (score >= 70) return "text-orange-400";
        return "text-gray-400";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-5xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                        <Wand2 size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">AI Content Suggestions</h2>
                                        <p className="text-gray-400 text-sm">AI-powered content ideas based on trends and your interests</p>
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
                                    onClick={() => setActiveTab("trending")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "trending" 
                                            ? "bg-indigo-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Trending
                                </button>
                                <button
                                    onClick={() => setActiveTab("personalized")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "personalized" 
                                            ? "bg-indigo-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Personalized
                                </button>
                                <button
                                    onClick={() => setActiveTab("categories")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "categories" 
                                            ? "bg-indigo-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Categories
                                </button>
                            </div>

                            {/* Category Filter */}
                            {activeTab === "categories" && (
                                <div className="mb-6">
                                    <h3 className="text-white font-medium mb-3">Filter by Category</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(category => (
                                            <button
                                                key={category}
                                                onClick={() => setSelectedCategory(category)}
                                                className={`px-3 py-2 rounded-full text-sm transition-colors ${
                                                    selectedCategory === category
                                                        ? 'bg-indigo-500 text-white'
                                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                }`}
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Generate Button */}
                            <div className="mb-6">
                                <button
                                    onClick={handleGenerateSuggestions}
                                    disabled={isGenerating}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            Generate New Ideas
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Suggestions List */}
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {filteredSuggestions.map((suggestion) => (
                                    <motion.div
                                        key={suggestion.id}
                                        className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-white font-semibold">{suggestion.title}</h3>
                                                    <div className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(suggestion.difficulty)}`}>
                                                        {suggestion.difficulty}
                                                    </div>
                                                    <div className="text-xs text-gray-400">{suggestion.estimatedTime}</div>
                                                </div>
                                                <p className="text-gray-400 text-sm mb-3">{suggestion.description}</p>
                                                <div className="bg-gray-700 rounded-lg p-3 mb-3">
                                                    <p className="text-white text-sm">{suggestion.content}</p>
                                                </div>
                                                <div className="flex gap-1 mb-3">
                                                    {suggestion.tags.map(tag => (
                                                        <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp size={16} className={getTrendingColor(suggestion.trendingScore)} />
                                                    <span className="text-gray-400">Trending: </span>
                                                    <span className={getTrendingColor(suggestion.trendingScore)}>{suggestion.trendingScore}%</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Target size={16} className="text-blue-400" />
                                                    <span className="text-gray-400">Engagement: </span>
                                                    <span className="text-blue-400">{suggestion.engagementPrediction}%</span>
                                                </div>
                                                <div className="text-gray-400 capitalize">{suggestion.type}</div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCopyContent(suggestion.content, suggestion.id)}
                                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    {copiedId === suggestion.id ? (
                                                        <Check size={16} className="text-green-400" />
                                                    ) : (
                                                        <Copy size={16} className="text-gray-400" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleSelectSuggestion(suggestion)}
                                                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                                                >
                                                    <Plus size={16} />
                                                    Use This
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {filteredSuggestions.length === 0 && (
                                <div className="text-center py-8">
                                    <Lightbulb size={48} className="text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-400">No suggestions found for this category</p>
                                    <button
                                        onClick={handleGenerateSuggestions}
                                        className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                    >
                                        Generate Ideas
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
