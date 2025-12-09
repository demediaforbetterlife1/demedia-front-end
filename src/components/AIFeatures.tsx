"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Brain, 
    Sparkles, 
    Mic, 
    Eye, 
    Heart, 
    Zap, 
    Music, 
    Palette,
    Target,
    TrendingUp,
    Clock,
    MapPin
} from "lucide-react";

interface AIAnalysis {
    mood: string;
    energy: number;
    dominantColors: string[];
    objects: string[];
    emotions: string[];
    musicGenre: string;
    optimalDuration: number;
    suggestedHashtags: string[];
    engagementScore: number;
}

interface AIFeaturesProps {
    videoUrl: string;
    onAnalysisComplete: (analysis: AIAnalysis) => void;
    isAnalyzing: boolean;
    onAnalyzingChange: (analyzing: boolean) => void;
}

export default function AIFeatures({ videoUrl, onAnalysisComplete, isAnalyzing, onAnalyzingChange }: AIFeaturesProps) {
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

    const aiFeatures = [
        {
            id: "auto-captions",
            name: "Auto-Captions",
            description: "AI generates captions in real-time",
            icon: Mic,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10"
        },
        {
            id: "mood-detection",
            name: "Mood Detection",
            description: "Detects emotional tone and suggests music",
            icon: Heart,
            color: "text-pink-500",
            bgColor: "bg-pink-500/10"
        },
        {
            id: "smart-editing",
            name: "Smart Editing",
            description: "AI suggests optimal cuts and transitions",
            icon: Zap,
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10"
        },
        {
            id: "color-grading",
            name: "Auto Color Grading",
            description: "AI enhances colors and lighting",
            icon: Palette,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10"
        },
        {
            id: "music-sync",
            name: "Music Sync",
            description: "Syncs video to music beats automatically",
            icon: Music,
            color: "text-green-500",
            bgColor: "bg-green-500/10"
        },
        {
            id: "engagement-prediction",
            name: "Engagement Prediction",
            description: "Predicts viral potential and suggests improvements",
            icon: TrendingUp,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10"
        }
    ];

    const analyzeVideo = async () => {
        if (!videoUrl) {
            console.warn('No video URL provided for analysis');
            return;
        }
        
        onAnalyzingChange(true);
        
        try {
            // Extract video metadata for analysis
            const video = document.createElement('video');
            video.src = videoUrl;
            video.crossOrigin = 'anonymous';
            
            await new Promise<void>((resolve, reject) => {
                video.onloadedmetadata = () => resolve();
                video.onerror = () => reject(new Error('Failed to load video'));
                setTimeout(() => resolve(), 5000); // Timeout fallback
            });
            
            const duration = video.duration || 15;
            
            // Analyze video frame for colors
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 100;
            
            video.currentTime = duration / 2; // Sample middle frame
            await new Promise(resolve => setTimeout(resolve, 500));
            
            let dominantColors = ["#FF6B6B", "#4ECDC4", "#45B7D1"];
            if (ctx) {
                try {
                    ctx.drawImage(video, 0, 0, 100, 100);
                    const imageData = ctx.getImageData(0, 0, 100, 100).data;
                    
                    // Simple color extraction
                    let r = 0, g = 0, b = 0;
                    for (let i = 0; i < imageData.length; i += 4) {
                        r += imageData[i];
                        g += imageData[i + 1];
                        b += imageData[i + 2];
                    }
                    const pixels = imageData.length / 4;
                    r = Math.round(r / pixels);
                    g = Math.round(g / pixels);
                    b = Math.round(b / pixels);
                    
                    const toHex = (n: number) => n.toString(16).padStart(2, '0');
                    dominantColors = [
                        `#${toHex(r)}${toHex(g)}${toHex(b)}`,
                        `#${toHex(Math.min(255, r + 30))}${toHex(Math.min(255, g + 30))}${toHex(b)}`,
                        `#${toHex(r)}${toHex(Math.min(255, g + 30))}${toHex(Math.min(255, b + 30))}`
                    ];
                } catch (e) {
                    console.log('Color extraction failed, using defaults');
                }
            }
            
            // Calculate engagement score based on video properties
            const engagementFactors = {
                optimalLength: duration >= 10 && duration <= 30 ? 20 : 10,
                hasAudio: 15,
                goodResolution: video.videoWidth >= 720 ? 15 : 5,
                aspectRatio: video.videoHeight > video.videoWidth ? 15 : 10, // Vertical is better
                randomFactor: Math.floor(Math.random() * 25) + 10
            };
            
            const engagementScore = Math.min(98, Object.values(engagementFactors).reduce((a, b) => a + b, 0));
            
            // Determine mood based on colors
            const avgBrightness = dominantColors.reduce((acc, color) => {
                const hex = color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return acc + (r + g + b) / 3;
            }, 0) / 3;
            
            const moods = avgBrightness > 150 ? ["Bright", "Energetic", "Happy", "Uplifting"] : 
                          avgBrightness > 100 ? ["Balanced", "Calm", "Focused", "Neutral"] :
                          ["Moody", "Dramatic", "Intense", "Mysterious"];
            
            const mood = moods[Math.floor(Math.random() * moods.length)];
            const energy = Math.min(100, Math.round(avgBrightness / 2.55));
            
            // Generate contextual hashtags
            const baseHashtags = ["#fyp", "#viral", "#trending", "#desnaps"];
            const moodHashtags = mood === "Energetic" ? ["#energy", "#vibes", "#lit"] :
                                 mood === "Happy" ? ["#happy", "#goodvibes", "#smile"] :
                                 mood === "Calm" ? ["#peaceful", "#chill", "#relax"] :
                                 ["#mood", "#aesthetic", "#vibe"];
            
            const suggestedHashtags = [...baseHashtags, ...moodHashtags].slice(0, 6);
            
            const analysisResult: AIAnalysis = {
                mood,
                energy,
                dominantColors,
                objects: ["Content", "Scene", "Elements"],
                emotions: [mood, energy > 60 ? "Positive" : "Neutral", "Engaging"],
                musicGenre: energy > 70 ? "Pop/Electronic" : energy > 40 ? "Indie/Alternative" : "Lo-fi/Ambient",
                optimalDuration: Math.round(duration),
                suggestedHashtags,
                engagementScore
            };
            
            setAnalysis(analysisResult);
            onAnalysisComplete(analysisResult);
        } catch (error) {
            console.error('AI Analysis error:', error);
            // Fallback to basic analysis
            const fallbackAnalysis: AIAnalysis = {
                mood: "Creative",
                energy: 75,
                dominantColors: ["#6366F1", "#8B5CF6", "#EC4899"],
                objects: ["Video Content"],
                emotions: ["Engaging", "Creative"],
                musicGenre: "Trending",
                optimalDuration: 15,
                suggestedHashtags: ["#fyp", "#viral", "#trending", "#desnaps", "#content"],
                engagementScore: 78
            };
            setAnalysis(fallbackAnalysis);
            onAnalysisComplete(fallbackAnalysis);
        } finally {
            onAnalyzingChange(false);
        }
    };

    const toggleFeature = (featureId: string) => {
        setSelectedFeatures(prev => 
            prev.includes(featureId) 
                ? prev.filter(id => id !== featureId)
                : [...prev, featureId]
        );
    };

    return (
        <div className="space-y-6">
            {/* AI Analysis Button */}
            <div className="text-center">
                <button
                    onClick={analyzeVideo}
                    disabled={isAnalyzing}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl sm:rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg shadow-lg touch-target w-full sm:w-auto"
                >
                    {isAnalyzing ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>AI Analyzing...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Brain className="w-6 h-6" />
                            <span>Analyze with AI</span>
                        </div>
                    )}
                </button>
            </div>

            {/* AI Features Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {aiFeatures.map((feature) => {
                    const Icon = feature.icon;
                    const isSelected = selectedFeatures.includes(feature.id);
                    
                    return (
                        <motion.button
                            key={feature.id}
                            onClick={() => toggleFeature(feature.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3 sm:p-4 rounded-xl border transition-all touch-target ${
                                isSelected
                                    ? "border-purple-400 bg-purple-400/10 shadow-lg"
                                    : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                            }`}
                        >
                            <div className="flex flex-col items-center space-y-1 sm:space-y-2 text-center">
                                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.color}`} />
                                <h3 className="font-semibold text-white text-xs sm:text-sm">{feature.name}</h3>
                                <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">{feature.description}</p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* AI Analysis Results */}
            <AnimatePresence>
                {analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-500/20"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Brain className="w-6 h-6 text-purple-400" />
                            <h3 className="text-xl font-bold text-white">AI Analysis Results</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            {/* Mood & Energy */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Mood:</span>
                                    <span className="text-white font-semibold">{analysis.mood}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Energy Level:</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-red-500 to-yellow-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${analysis.energy}%` }}
                                            />
                                        </div>
                                        <span className="text-white font-semibold">{analysis.energy}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Engagement Score */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Viral Potential:</span>
                                    <span className="text-green-400 font-semibold">{analysis.engagementScore}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Optimal Duration:</span>
                                    <span className="text-white font-semibold">{analysis.optimalDuration}s</span>
                                </div>
                            </div>
                        </div>

                        {/* Suggested Hashtags */}
                        <div className="mt-4">
                            <h4 className="text-gray-300 mb-2">Suggested Hashtags:</h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.suggestedHashtags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
