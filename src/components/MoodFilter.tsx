"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Smile, 
    Frown, 
    Heart, 
    Zap, 
    Brain, 
    Coffee, 
    Music, 
    Gamepad2,
    Target,
    Sparkles,
    X
} from "lucide-react";

interface MoodFilterProps {
    isOpen: boolean;
    onClose: () => void;
    onMoodChange: (mood: string, filters: string[]) => void;
    currentMood?: string;
}

const moodOptions = [
    { id: "happy", name: "Happy", icon: Smile, color: "from-yellow-400 to-orange-500", description: "Uplifting and positive content" },
    { id: "sad", name: "Sad", icon: Frown, color: "from-blue-400 to-indigo-500", description: "Comforting and supportive content" },
    { id: "love", name: "Love", icon: Heart, color: "from-pink-400 to-red-500", description: "Romantic and heartwarming content" },
    { id: "energetic", name: "Energetic", icon: Zap, color: "from-green-400 to-emerald-500", description: "High-energy and motivational content" },
    { id: "creative", name: "Creative", icon: Brain, color: "from-purple-400 to-violet-500", description: "Artistic and inspiring content" },
    { id: "focused", name: "Focused", icon: Target, color: "from-cyan-400 to-blue-500", description: "Productive and goal-oriented content" },
    { id: "relaxed", name: "Relaxed", icon: Coffee, color: "from-amber-400 to-orange-500", description: "Calm and peaceful content" },
    { id: "playful", name: "Playful", icon: Gamepad2, color: "from-lime-400 to-green-500", description: "Fun and entertaining content" },
    { id: "inspired", name: "Inspired", icon: Sparkles, color: "from-rose-400 to-pink-500", description: "Motivational and aspirational content" }
];

const contentFilters = [
    { id: "videos", name: "Videos", description: "Short videos and DeSnaps" },
    { id: "images", name: "Images", description: "Photos and artwork" },
    { id: "text", name: "Text Posts", description: "Written thoughts and stories" },
    { id: "music", name: "Music", description: "Audio content and playlists" },
    { id: "interactive", name: "Interactive", description: "Polls, quizzes, and games" }
];

export default function MoodFilter({ isOpen, onClose, onMoodChange, currentMood }: MoodFilterProps) {
    const [selectedMood, setSelectedMood] = useState(currentMood || "");
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [intensity, setIntensity] = useState(5); // 1-10 scale
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [userMoodHistory, setUserMoodHistory] = useState<any[]>([]);
    const [recommendedContent, setRecommendedContent] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSelectedMood(currentMood || "");
            setSelectedFilters([]);
            setIntensity(5);
            loadUserMoodData();
        }
    }, [isOpen, currentMood]);

    const loadUserMoodData = async () => {
        try {
            // Load user's mood history from localStorage
            const savedMoodHistory = localStorage.getItem('userMoodHistory');
            if (savedMoodHistory) {
                setUserMoodHistory(JSON.parse(savedMoodHistory));
            }
        } catch (error) {
            console.error('Error loading mood data:', error);
        }
    };

    const handleMoodSelect = (moodId: string) => {
        setSelectedMood(moodId);
        // Save mood selection to localStorage
        const moodHistory = JSON.parse(localStorage.getItem('userMoodHistory') || '[]');
        const newEntry = {
            mood: moodId,
            timestamp: new Date().toISOString(),
            intensity: intensity
        };
        moodHistory.push(newEntry);
        localStorage.setItem('userMoodHistory', JSON.stringify(moodHistory));
        setUserMoodHistory(moodHistory);
    };

    const handleFilterToggle = (filterId: string) => {
        setSelectedFilters(prev => 
            prev.includes(filterId) 
                ? prev.filter(f => f !== filterId)
                : [...prev, filterId]
        );
    };

    const generateMoodRecommendations = (mood: string) => {
        // This would be replaced with real AI recommendations
        const baseRecommendations = [
            { id: 1, type: 'post', title: 'Inspirational Quote', author: 'DeMedia AI', mood: mood },
            { id: 2, type: 'video', title: 'Motivational Video', author: 'DeMedia AI', mood: mood },
            { id: 3, type: 'music', title: 'Mood Playlist', author: 'DeMedia AI', mood: mood }
        ];
        
        return baseRecommendations.filter(rec => rec.mood === mood);
    };

    const handleApplyFilter = async () => {
        if (!selectedMood) return;

        setIsAnalyzing(true);
        
        // Save mood preferences to localStorage
        const moodPreferences = {
            mood: selectedMood,
            filters: selectedFilters,
            intensity: intensity,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('currentMoodPreferences', JSON.stringify(moodPreferences));
        
        // Simulate AI analysis
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate recommendations based on mood
        const recommendations = generateMoodRecommendations(selectedMood);
        setRecommendedContent(recommendations);
        
        onMoodChange(selectedMood, selectedFilters);
        setIsAnalyzing(false);
        onClose();
    };

    const selectedMoodData = moodOptions.find(m => m.id === selectedMood);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                        <Target size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Mood-Based Content Filter</h2>
                                        <p className="text-gray-400 text-sm">AI-powered content curation based on your current mood</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Mood Selection */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-white mb-4">How are you feeling?</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {moodOptions.map((mood) => {
                                        const Icon = mood.icon;
                                        const isSelected = selectedMood === mood.id;
                                        return (
                                            <motion.button
                                                key={mood.id}
                                                onClick={() => handleMoodSelect(mood.id)}
                                                className={`p-4 rounded-xl border-2 transition-all ${
                                                    isSelected 
                                                        ? `border-transparent bg-gradient-to-r ${mood.color} text-white` 
                                                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                                }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Icon size={24} className="mx-auto mb-2" />
                                                <div className="text-sm font-medium">{mood.name}</div>
                                                <div className="text-xs opacity-75 mt-1">{mood.description}</div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Content Type Filters */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-white mb-4">Content Types</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {contentFilters.map((filter) => {
                                        const isSelected = selectedFilters.includes(filter.id);
                                        return (
                                            <button
                                                key={filter.id}
                                                onClick={() => handleFilterToggle(filter.id)}
                                                className={`p-3 rounded-lg border transition-all ${
                                                    isSelected 
                                                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' 
                                                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                                }`}
                                            >
                                                <div className="text-sm font-medium">{filter.name}</div>
                                                <div className="text-xs opacity-75 mt-1">{filter.description}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Intensity Slider */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-white mb-4">Filter Intensity</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>Subtle</span>
                                        <span>Strong</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={intensity}
                                        onChange={(e) => setIntensity(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                        style={{
                                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${intensity * 10}%, #374151 ${intensity * 10}%, #374151 100%)`
                                        }}
                                    />
                                    <div className="text-center text-sm text-gray-300">
                                        {intensity <= 3 && "Light filtering - More diverse content"}
                                        {intensity > 3 && intensity <= 7 && "Moderate filtering - Balanced content"}
                                        {intensity > 7 && "Strong filtering - Highly curated content"}
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            {selectedMoodData && (
                                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
                                    <h4 className="font-semibold text-white mb-2">Preview</h4>
                                    <p className="text-sm text-gray-300">
                                        You'll see content that matches your <span className="text-indigo-300 font-medium">{selectedMoodData.name}</span> mood
                                        {selectedFilters.length > 0 && (
                                            <span> with {selectedFilters.length} content type{selectedFilters.length > 1 ? 's' : ''} selected</span>
                                        )}
                                        {intensity > 7 && <span> with strong filtering applied</span>}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApplyFilter}
                                    disabled={!selectedMood || isAnalyzing}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Target size={16} />
                                            Apply Filter
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
