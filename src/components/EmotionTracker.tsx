"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { databaseService } from "@/services/databaseService";
import { 
    Heart, 
    Smile, 
    Frown, 
    Meh, 
    TrendingUp, 
    TrendingDown,
    BarChart3,
    Calendar,
    Target,
    Zap,
    X,
    Plus,
    Eye
} from "lucide-react";

interface EmotionData {
    id: string;
    emotion: string;
    intensity: number; // 1-10
    timestamp: Date;
    contentId?: string;
    contentType: "post" | "comment" | "desnap" | "story";
    notes?: string;
}

interface EmotionTrackerProps {
    isOpen: boolean;
    onClose: () => void;
    onEmotionRecorded: (emotionData: any) => void;
}

const emotionOptions = [
    { id: "joy", name: "Joy", icon: "😊", color: "from-yellow-400 to-orange-500", description: "Happy and positive" },
    { id: "love", name: "Love", icon: "❤️", color: "from-pink-400 to-red-500", description: "Warm and caring" },
    { id: "excitement", name: "Excitement", icon: "🤩", color: "from-purple-400 to-pink-500", description: "Thrilled and energetic" },
    { id: "gratitude", name: "Gratitude", icon: "🙏", color: "from-green-400 to-emerald-500", description: "Thankful and appreciative" },
    { id: "pride", name: "Pride", icon: "🏆", color: "from-blue-400 to-indigo-500", description: "Accomplished and confident" },
    { id: "sadness", name: "Sadness", icon: "😢", color: "from-blue-500 to-indigo-600", description: "Down and melancholic" },
    { id: "anger", name: "Anger", icon: "😠", color: "from-red-500 to-orange-600", description: "Frustrated and upset" },
    { id: "fear", name: "Fear", icon: "😨", color: "from-gray-500 to-slate-600", description: "Anxious and worried" },
    { id: "disgust", name: "Disgust", icon: "🤢", color: "from-green-600 to-lime-600", description: "Repulsed and averse" },
    { id: "surprise", name: "Surprise", icon: "😲", color: "from-yellow-500 to-amber-600", description: "Shocked and amazed" }
];

const sampleEmotions: EmotionData[] = [
    {
        id: "1",
        emotion: "joy",
        intensity: 8,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        contentId: "post_123",
        contentType: "post",
        notes: "Great response to my latest post!"
    },
    {
        id: "2",
        emotion: "love",
        intensity: 9,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        contentId: "desnap_456",
        contentType: "desnap",
        notes: "Received so much love from the community"
    },
    {
        id: "3",
        emotion: "pride",
        intensity: 7,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        contentId: "story_789",
        contentType: "story",
        notes: "Proud of the impact my story had"
    }
];

export default function EmotionTracker({ isOpen, onClose, onEmotionRecorded }: EmotionTrackerProps) {
    const [activeTab, setActiveTab] = useState<"track" | "history" | "analytics">("track");
    const [emotions, setEmotions] = useState<EmotionData[]>(sampleEmotions);
    const [showRecordForm, setShowRecordForm] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [newEmotion, setNewEmotion] = useState({
        emotion: "",
        intensity: 5,
        notes: "",
        contentType: "post" as const
    });

    const [selectedEmotion, setSelectedEmotion] = useState<string>("");
    const [intensity, setIntensity] = useState(5);

    // Load emotions from database when component mounts
    useEffect(() => {
        if (isOpen) {
            loadEmotionsFromDatabase();
        }
    }, [isOpen]);

    const loadEmotionsFromDatabase = async () => {
        try {
            const emotionData = await databaseService.getEmotionHistory();
            setEmotions(emotionData);
        } catch (error) {
            console.error('Error loading emotions from database:', error);
        }
    };

    const handleEmotionSelect = (emotionId: string) => {
        setSelectedEmotion(emotionId);
        setNewEmotion(prev => ({ ...prev, emotion: emotionId }));
    };

    const handleRecordEmotion = async () => {
        if (!selectedEmotion) return;

        setIsRecording(true);
        
        try {
            const emotionData = await databaseService.saveEmotion(
                selectedEmotion,
                intensity,
                newEmotion.contentId || undefined,
                newEmotion.contentType || undefined,
                newEmotion.notes || undefined
            );
            setEmotions(prev => [emotionData, ...prev]);
            console.log('Emotion saved to database successfully');
        } catch (error) {
            console.error('Error saving emotion to database:', error);
        }
        
        setShowRecordForm(false);
        setNewEmotion({
            emotion: "",
            intensity: 5,
            notes: "",
            contentType: "post"
        });
        setSelectedEmotion("");
        setIntensity(5);
        setIsRecording(false);
    };

    const getEmotionStats = () => {
        const last7Days = emotions.filter(e => 
            e.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        
        const emotionCounts = emotionOptions.map(option => ({
            ...option,
            count: last7Days.filter(e => e.emotion === option.id).length,
            avgIntensity: last7Days
                .filter(e => e.emotion === option.id)
                .reduce((sum, e) => sum + e.intensity, 0) / 
                Math.max(last7Days.filter(e => e.emotion === option.id).length, 1)
        }));

        return emotionCounts.sort((a, b) => b.count - a.count);
    };

    const stats = getEmotionStats();

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
                                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                                        <Heart size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Emotion Tracker</h2>
                                        <p className="text-gray-400 text-sm">Track the emotional impact of your content</p>
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
                                    onClick={() => setActiveTab("track")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "track" 
                                            ? "bg-red-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Track Emotion
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "history" 
                                            ? "bg-red-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    History
                                </button>
                                <button
                                    onClick={() => setActiveTab("analytics")}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        activeTab === "analytics" 
                                            ? "bg-red-500 text-white" 
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Analytics
                                </button>
                            </div>

                            {activeTab === "track" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">How are you feeling right now?</h3>
                                        <div className="grid grid-cols-5 gap-3">
                                            {emotionOptions.map((emotion) => {
                                                const isSelected = selectedEmotion === emotion.id;
                                                return (
                                                    <motion.button
                                                        key={emotion.id}
                                                        onClick={() => handleEmotionSelect(emotion.id)}
                                                        className={`p-4 rounded-xl border-2 transition-all ${
                                                            isSelected 
                                                                ? `border-transparent bg-gradient-to-r ${emotion.color} text-white` 
                                                                : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                                        }`}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <div className="text-2xl mb-2">{emotion.icon}</div>
                                                        <div className="text-sm font-medium">{emotion.name}</div>
                                                        <div className="text-xs opacity-75 mt-1">{emotion.description}</div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {selectedEmotion && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <h4 className="text-white font-medium mb-3">Intensity Level</h4>
                                                <div className="space-y-3">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={intensity}
                                                        onChange={(e) => setIntensity(parseInt(e.target.value))}
                                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                                        style={{
                                                            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${intensity * 10}%, #374151 ${intensity * 10}%, #374151 100%)`
                                                        }}
                                                    />
                                                    <div className="flex justify-between text-sm text-gray-400">
                                                        <span>Mild</span>
                                                        <span className="text-white font-medium">{intensity}/10</span>
                                                        <span>Intense</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-white font-medium mb-2">Notes (Optional)</label>
                                                <textarea
                                                    value={newEmotion.notes}
                                                    onChange={(e) => setNewEmotion(prev => ({ ...prev, notes: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-20 resize-none"
                                                    placeholder="What triggered this emotion?"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-white font-medium mb-2">Content Type</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {["post", "comment", "desnap", "story"].map(type => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setNewEmotion(prev => ({ ...prev, contentType: type as any }))}
                                                            className={`p-3 rounded-lg border transition-colors ${
                                                                newEmotion.contentType === type
                                                                    ? 'border-red-500 bg-red-500/20 text-red-300'
                                                                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                                            }`}
                                                        >
                                                            <div className="text-sm font-medium capitalize">{type}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleRecordEmotion}
                                                disabled={isRecording}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isRecording ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Recording...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Heart size={16} />
                                                        Record Emotion
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {activeTab === "history" && (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {emotions.map((emotion) => {
                                        const emotionData = emotionOptions.find(e => e.id === emotion.emotion);
                                        return (
                                            <motion.div
                                                key={emotion.id}
                                                className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                                                whileHover={{ scale: 1.01 }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-2xl">{emotionData?.icon}</div>
                                                        <div>
                                                            <div className="text-white font-medium">{emotionData?.name}</div>
                                                            <div className="text-sm text-gray-400">
                                                                {emotion.timestamp.toLocaleDateString()} at {emotion.timestamp.toLocaleTimeString()}
                                                            </div>
                                                            {emotion.notes && (
                                                                <div className="text-sm text-gray-300 mt-1">{emotion.notes}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-white font-medium">{emotion.intensity}/10</div>
                                                        <div className="text-xs text-gray-400 capitalize">{emotion.contentType}</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === "analytics" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-800 rounded-xl p-4">
                                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                <BarChart3 size={20} />
                                                Top Emotions (7 days)
                                            </h3>
                                            <div className="space-y-3">
                                                {stats.slice(0, 5).map((stat, index) => (
                                                    <div key={stat.id} className="flex items-center gap-3">
                                                        <div className="text-2xl">{stat.icon}</div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-white">{stat.name}</span>
                                                                <span className="text-gray-400">{stat.count} times</span>
                                                            </div>
                                                            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                                                                <div 
                                                                    className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full"
                                                                    style={{ width: `${(stat.count / Math.max(...stats.map(s => s.count))) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-gray-800 rounded-xl p-4">
                                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                <TrendingUp size={20} />
                                                Intensity Trends
                                            </h3>
                                            <div className="space-y-3">
                                                {stats.filter(s => s.count > 0).slice(0, 3).map(stat => (
                                                    <div key={stat.id} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{stat.icon}</span>
                                                            <span className="text-white text-sm">{stat.name}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-400">
                                                            Avg: {stat.avgIntensity.toFixed(1)}/10
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-800 rounded-xl p-4">
                                        <h3 className="text-white font-semibold mb-4">Emotional Insights</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-white">{emotions.length}</div>
                                                <div className="text-sm text-gray-400">Total Emotions</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-white">
                                                    {emotions.length > 0 ? (emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length).toFixed(1) : 0}
                                                </div>
                                                <div className="text-sm text-gray-400">Avg Intensity</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-white">
                                                    {stats.filter(s => s.count > 0).length}
                                                </div>
                                                <div className="text-sm text-gray-400">Unique Emotions</div>
                                            </div>
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
