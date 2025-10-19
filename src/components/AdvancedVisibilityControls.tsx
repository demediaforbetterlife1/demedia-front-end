"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Globe, 
    Users, 
    UserCheck, 
    Sparkles, 
    Clock, 
    MapPin, 
    Eye, 
    EyeOff,
    Shield,
    Lock,
    Timer,
    Calendar,
    Zap,
    Brain,
    Target,
    Heart,
    Star
} from "lucide-react";

interface VisibilityRule {
    id: string;
    name: string;
    description: string;
    icon: any;
    type: 'time' | 'location' | 'behavior' | 'relationship' | 'ai';
    enabled: boolean;
    settings: any;
}

interface AdvancedVisibilityControlsProps {
    onVisibilityChange: (rules: VisibilityRule[]) => void;
}

export default function AdvancedVisibilityControls({ onVisibilityChange }: AdvancedVisibilityControlsProps) {
    const [visibilityRules, setVisibilityRules] = useState<VisibilityRule[]>([
        {
            id: "time-based",
            name: "Time-Based Visibility",
            description: "Show/hide based on time of day or specific dates",
            icon: Clock,
            type: "time",
            enabled: false,
            settings: {
                startTime: "09:00",
                endTime: "17:00",
                days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
                timezone: "UTC"
            }
        },
        {
            id: "location-based",
            name: "Location-Based Visibility",
            description: "Show/hide based on viewer's location",
            icon: MapPin,
            type: "location",
            enabled: false,
            settings: {
                allowedCountries: ["US", "CA", "UK"],
                blockedCountries: [],
                radius: 50,
                centerLocation: null
            }
        },
        {
            id: "behavior-based",
            name: "Behavior-Based Visibility",
            description: "Show/hide based on viewer's interaction patterns",
            icon: Brain,
            type: "behavior",
            enabled: false,
            settings: {
                minEngagement: 70,
                requiredActions: ["like", "comment", "share"],
                timeSpent: 30
            }
        },
        {
            id: "relationship-depth",
            name: "Relationship Depth",
            description: "Show/hide based on relationship strength",
            icon: Heart,
            type: "relationship",
            enabled: false,
            settings: {
                relationshipScore: 80,
                interactionHistory: 30,
                mutualConnections: 5
            }
        },
        {
            id: "ai-mood-matching",
            name: "AI Mood Matching",
            description: "Show/hide based on viewer's current mood",
            icon: Zap,
            type: "ai",
            enabled: false,
            settings: {
                moodDetection: true,
                energyLevel: "high",
                emotionalState: "positive"
            }
        },
        {
            id: "engagement-prediction",
            name: "Engagement Prediction",
            description: "Show/hide based on predicted engagement",
            icon: Target,
            type: "ai",
            enabled: false,
            settings: {
                minPredictedEngagement: 80,
                viralPotential: "high",
                audienceMatch: 90
            }
        }
    ]);

    const [activeRule, setActiveRule] = useState<string | null>(null);

    const toggleRule = (ruleId: string) => {
        setVisibilityRules(prev => 
            prev.map(rule => 
                rule.id === ruleId 
                    ? { ...rule, enabled: !rule.enabled }
                    : rule
            )
        );
        onVisibilityChange(visibilityRules);
    };

    const updateRuleSettings = (ruleId: string, newSettings: any) => {
        setVisibilityRules(prev => 
            prev.map(rule => 
                rule.id === ruleId 
                    ? { ...rule, settings: { ...rule.settings, ...newSettings } }
                    : rule
            )
        );
        onVisibilityChange(visibilityRules);
    };

    const getRuleIcon = (type: string) => {
        switch (type) {
            case 'time': return Clock;
            case 'location': return MapPin;
            case 'behavior': return Brain;
            case 'relationship': return Heart;
            case 'ai': return Zap;
            default: return Eye;
        }
    };

    const getRuleColor = (type: string) => {
        switch (type) {
            case 'time': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'location': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'behavior': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            case 'relationship': return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
            case 'ai': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-8 h-8 text-blue-400" />
                    <h2 className="text-3xl font-bold text-white">Advanced Visibility Controls</h2>
                    <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-400">Revolutionary privacy controls that don't exist anywhere else</p>
            </div>

            {/* Basic Visibility */}
            <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Basic Visibility</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { id: 'public', name: 'Public', icon: Globe, color: 'text-green-500' },
                        { id: 'followers', name: 'Followers', icon: Users, color: 'text-blue-500' },
                        { id: 'close-friends', name: 'Close Friends', icon: UserCheck, color: 'text-purple-500' },
                        { id: 'premium', name: 'Premium', icon: Sparkles, color: 'text-yellow-500' }
                    ].map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.id}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-600 hover:border-gray-500 transition-colors"
                            >
                                <Icon className={`w-6 h-6 ${option.color}`} />
                                <span className="text-white font-medium">{option.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Advanced Rules */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Advanced Rules</h3>
                {visibilityRules.map((rule) => {
                    const Icon = rule.icon;
                    const colorClass = getRuleColor(rule.type);
                    const isActive = activeRule === rule.id;
                    
                    return (
                        <div key={rule.id} className={`rounded-xl border p-4 ${colorClass} ${
                            rule.enabled ? 'opacity-100' : 'opacity-60'
                        }`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Icon className="w-6 h-6" />
                                    <div>
                                        <h4 className="text-white font-semibold">{rule.name}</h4>
                                        <p className="text-gray-400 text-sm">{rule.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setActiveRule(isActive ? null : rule.id)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        {isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => toggleRule(rule.id)}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            rule.enabled ? 'bg-green-500' : 'bg-gray-600'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            rule.enabled ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>
                            </div>

                            {/* Rule Settings */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 space-y-4"
                                    >
                                        {rule.type === 'time' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-gray-300 text-sm mb-2">Start Time</label>
                                                    <input
                                                        type="time"
                                                        value={rule.settings.startTime}
                                                        onChange={(e) => updateRuleSettings(rule.id, { startTime: e.target.value })}
                                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 text-sm mb-2">End Time</label>
                                                    <input
                                                        type="time"
                                                        value={rule.settings.endTime}
                                                        onChange={(e) => updateRuleSettings(rule.id, { endTime: e.target.value })}
                                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {rule.type === 'location' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-gray-300 text-sm mb-2">Allowed Countries</label>
                                                    <input
                                                        type="text"
                                                        placeholder="US, CA, UK"
                                                        value={rule.settings.allowedCountries.join(', ')}
                                                        onChange={(e) => updateRuleSettings(rule.id, { 
                                                            allowedCountries: e.target.value.split(',').map(c => c.trim()) 
                                                        })}
                                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 text-sm mb-2">Radius (km)</label>
                                                    <input
                                                        type="number"
                                                        value={rule.settings.radius}
                                                        onChange={(e) => updateRuleSettings(rule.id, { radius: parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {rule.type === 'behavior' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-gray-300 text-sm mb-2">Minimum Engagement %</label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={rule.settings.minEngagement}
                                                        onChange={(e) => updateRuleSettings(rule.id, { minEngagement: parseInt(e.target.value) })}
                                                        className="w-full"
                                                    />
                                                    <span className="text-white text-sm">{rule.settings.minEngagement}%</span>
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 text-sm mb-2">Required Actions</label>
                                                    <div className="flex gap-2">
                                                        {['like', 'comment', 'share', 'save'].map((action) => (
                                                            <label key={action} className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={rule.settings.requiredActions.includes(action)}
                                                                    onChange={(e) => {
                                                                        const actions = e.target.checked
                                                                            ? [...rule.settings.requiredActions, action]
                                                                            : rule.settings.requiredActions.filter((a: string) => a !== action);
                                                                        updateRuleSettings(rule.id, { requiredActions: actions });
                                                                    }}
                                                                    className="rounded"
                                                                />
                                                                <span className="text-white text-sm capitalize">{action}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {rule.type === 'ai' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-gray-300 text-sm mb-2">AI Confidence Level</label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={rule.settings.aiConfidence || 80}
                                                        onChange={(e) => updateRuleSettings(rule.id, { aiConfidence: parseInt(e.target.value) })}
                                                        className="w-full"
                                                    />
                                                    <span className="text-white text-sm">{rule.settings.aiConfidence || 80}%</span>
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 text-sm mb-2">AI Analysis Type</label>
                                                    <select
                                                        value={rule.settings.analysisType || 'mood'}
                                                        onChange={(e) => updateRuleSettings(rule.id, { analysisType: e.target.value })}
                                                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
                                                    >
                                                        <option value="mood">Mood Detection</option>
                                                        <option value="engagement">Engagement Prediction</option>
                                                        <option value="behavior">Behavior Analysis</option>
                                                        <option value="preference">Preference Matching</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/20">
                <h3 className="text-xl font-bold text-white mb-4">Visibility Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-gray-300 mb-2">Active Rules</h4>
                        <p className="text-white">
                            {visibilityRules.filter(rule => rule.enabled).length} of {visibilityRules.length} rules enabled
                        </p>
                    </div>
                    <div>
                        <h4 className="text-gray-300 mb-2">Estimated Reach</h4>
                        <p className="text-white">
                            {Math.floor(Math.random() * 50) + 25}% of your audience
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
