"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Settings, Clock, Eye, Heart, MessageCircle, Shield, 
    Zap, Palette, Music, MapPin, Hash, AtSign, Star,
    Timer, Users, Globe, Lock, Bell, Trash2, Save
} from "lucide-react";

interface StorySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSettingsChange?: (settings: any) => void;
    initialSettings?: any;
}

const durationPresets = [
    { value: 1, label: "1 hour", description: "Quick updates" },
    { value: 3, label: "3 hours", description: "Short stories" },
    { value: 6, label: "6 hours", description: "Half day" },
    { value: 12, label: "12 hours", description: "Morning to evening" },
    { value: 24, label: "24 hours", description: "Full day" },
    { value: 48, label: "48 hours", description: "Weekend special" },
    { value: 72, label: "72 hours", description: "Extended story" }
];

const visibilityLevels = [
    { id: "public", name: "Public", icon: Globe, color: "text-green-500", description: "Visible to everyone" },
    { id: "followers", name: "Followers", icon: Users, color: "text-blue-500", description: "Only your followers" },
    { id: "close_friends", name: "Close Friends", icon: Lock, color: "text-purple-500", description: "Your inner circle" },
    { id: "exclusive", name: "Exclusive", icon: Star, color: "text-yellow-500", description: "Premium followers only" }
];

const interactionSettings = [
    { key: "allowReactions", label: "Allow Reactions", icon: Heart, description: "Let people react to your story" },
    { key: "allowComments", label: "Allow Comments", icon: MessageCircle, description: "Enable story comments" },
    { key: "showViewCount", label: "Show View Count", icon: Eye, description: "Display how many people viewed" },
    { key: "allowScreenshots", label: "Allow Screenshots", icon: Shield, description: "Let people screenshot your story" },
    { key: "notifyViewers", label: "Notify Viewers", icon: Bell, description: "Notify when someone views" }
];

const privacySettings = [
    { key: "hideFromSearch", label: "Hide from Search", icon: Eye, description: "Don't show in story search" },
    { key: "hideFromProfile", label: "Hide from Profile", icon: Users, description: "Don't show on your profile" },
    { key: "autoDelete", label: "Auto Delete", icon: Trash2, description: "Delete after expiry" },
    { key: "scheduledDelete", label: "Scheduled Delete", icon: Timer, description: "Delete at specific time" }
];

export default function StorySettingsModal({ 
    isOpen, 
    onClose, 
    onSettingsChange, 
    initialSettings = {} 
}: StorySettingsModalProps) {
    const [settings, setSettings] = useState({
        duration: 24,
        visibility: "followers",
        allowReactions: true,
        allowComments: true,
        showViewCount: true,
        allowScreenshots: true,
        notifyViewers: false,
        hideFromSearch: false,
        hideFromProfile: false,
        autoDelete: false,
        scheduledDelete: false,
        scheduledTime: "",
        customDuration: false,
        customDurationValue: 24,
        ...initialSettings
    });

    const [activeTab, setActiveTab] = useState<"general" | "privacy" | "advanced">("general");

    const handleSettingChange = (key: string, value: any) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        if (onSettingsChange) {
            onSettingsChange(settings);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-0 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                <Settings className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Story Settings</h2>
                                <p className="text-sm text-gray-400">Customize your story experience</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-700">
                        {[
                            { id: "general", label: "General", icon: Settings },
                            { id: "privacy", label: "Privacy", icon: Shield },
                            { id: "advanced", label: "Advanced", icon: Zap }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                                        activeTab === tab.id
                                            ? "text-purple-400 border-b-2 border-purple-400 bg-purple-400/5"
                                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {/* General Tab */}
                            {activeTab === "general" && (
                                <motion.div
                                    key="general"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Duration Settings */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-4">
                                            Story Duration
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {durationPresets.map((preset) => (
                                                <button
                                                    key={preset.value}
                                                    onClick={() => handleSettingChange("duration", preset.value)}
                                                    className={`flex flex-col items-start p-4 rounded-xl border transition-all ${
                                                        settings.duration === preset.value
                                                            ? "border-purple-400 bg-purple-400/10"
                                                            : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Clock className="w-4 h-4 text-purple-400" />
                                                        <span className="font-medium text-white">{preset.label}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400">{preset.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Visibility Settings */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-4">
                                            Visibility
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {visibilityLevels.map((level) => {
                                                const Icon = level.icon;
                                                return (
                                                    <button
                                                        key={level.id}
                                                        onClick={() => handleSettingChange("visibility", level.id)}
                                                        className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                                                            settings.visibility === level.id
                                                                ? "border-purple-400 bg-purple-400/10"
                                                                : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                                                        }`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${level.color}`} />
                                                        <div className="text-left">
                                                            <p className="font-medium text-white text-sm">{level.name}</p>
                                                            <p className="text-xs text-gray-400">{level.description}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Interaction Settings */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-4">
                                            Interactions
                                        </label>
                                        <div className="space-y-3">
                                            {interactionSettings.map((setting) => {
                                                const Icon = setting.icon;
                                                return (
                                                    <label key={setting.key} className="flex items-center space-x-3 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings[setting.key as keyof typeof settings] as boolean}
                                                            onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                                                            className="w-4 h-4 text-purple-400 bg-gray-700 border-gray-600 rounded focus:ring-purple-400 focus:ring-2"
                                                        />
                                                        <Icon className="w-5 h-5 text-gray-400" />
                                                        <div className="flex-1">
                                                            <p className="text-sm text-white">{setting.label}</p>
                                                            <p className="text-xs text-gray-400">{setting.description}</p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Privacy Tab */}
                            {activeTab === "privacy" && (
                                <motion.div
                                    key="privacy"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Privacy Settings */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-4">
                                            Privacy Controls
                                        </label>
                                        <div className="space-y-3">
                                            {privacySettings.map((setting) => {
                                                const Icon = setting.icon;
                                                return (
                                                    <label key={setting.key} className="flex items-center space-x-3 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings[setting.key as keyof typeof settings] as boolean}
                                                            onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                                                            className="w-4 h-4 text-purple-400 bg-gray-700 border-gray-600 rounded focus:ring-purple-400 focus:ring-2"
                                                        />
                                                        <Icon className="w-5 h-5 text-gray-400" />
                                                        <div className="flex-1">
                                                            <p className="text-sm text-white">{setting.label}</p>
                                                            <p className="text-xs text-gray-400">{setting.description}</p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Scheduled Delete */}
                                    {settings.scheduledDelete && (
                                        <div className="p-4 bg-gray-800/50 rounded-xl">
                                            <label className="block text-sm font-medium text-white mb-2">
                                                Delete at specific time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={settings.scheduledTime}
                                                onChange={(e) => handleSettingChange("scheduledTime", e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none"
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Advanced Tab */}
                            {activeTab === "advanced" && (
                                <motion.div
                                    key="advanced"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Custom Duration */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-4">
                                            Custom Duration
                                        </label>
                                        <div className="space-y-4">
                                            <label className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.customDuration}
                                                    onChange={(e) => handleSettingChange("customDuration", e.target.checked)}
                                                    className="w-4 h-4 text-purple-400 bg-gray-700 border-gray-600 rounded focus:ring-purple-400 focus:ring-2"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm text-white">Enable custom duration</p>
                                                    <p className="text-xs text-gray-400">Set any duration between 1-72 hours</p>
                                                </div>
                                            </label>
                                        
                                        {settings.customDuration && (
                                            <div className="p-4 bg-gray-800/50 rounded-xl">
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="72"
                                                        value={settings.customDurationValue}
                                                        onChange={(e) => handleSettingChange("customDurationValue", parseInt(e.target.value))}
                                                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none"
                                                    />
                                                    <span className="text-sm text-gray-400">hours</span>
                                                </div>
                                            </div>
                                        )}
                                        </div>
                                    </div>

                                    {/* Story Analytics */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-4">
                                            Analytics & Insights
                                        </label>
                                        <div className="space-y-3">
                                            <label className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.showViewCount}
                                                    onChange={(e) => handleSettingChange("showViewCount", e.target.checked)}
                                                    className="w-4 h-4 text-purple-400 bg-gray-700 border-gray-600 rounded focus:ring-purple-400 focus:ring-2"
                                                />
                                                <Eye className="w-5 h-5 text-gray-400" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-white">Show detailed analytics</p>
                                                    <p className="text-xs text-gray-400">View count, engagement rate, and demographics</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Export Settings */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-4">
                                            Export & Backup
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="flex items-center space-x-3 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-purple-400 transition-all">
                                                <Save className="w-5 h-5 text-purple-400" />
                                                <span className="text-sm text-white">Export Story</span>
                                            </button>
                                            <button className="flex items-center space-x-3 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-purple-400 transition-all">
                                                <Hash className="w-5 h-5 text-purple-400" />
                                                <span className="text-sm text-white">Save Template</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-900/50">
                        <div className="text-sm text-gray-400">
                            Settings will be applied to your next story
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all font-medium"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
