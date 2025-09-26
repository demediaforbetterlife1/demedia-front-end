"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Globe, Users, Lock, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

interface CreateStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStoryCreated?: (story: any) => void;
}

const visibilityOptions = [
    {
        id: "public",
        name: "Public",
        description: "Anyone can see your story",
        icon: Globe,
        color: "text-green-500"
    },
    {
        id: "followers",
        name: "Followers",
        description: "Only your followers can see",
        icon: Users,
        color: "text-blue-500"
    },
    {
        id: "close_friends",
        name: "Close Friends",
        description: "Only close friends can see",
        icon: Lock,
        color: "text-purple-500"
    }
];

export default function CreateStoryModal({ isOpen, onClose, onStoryCreated }: CreateStoryModalProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState("followers");
    const [duration, setDuration] = useState(24);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            setError("Please enter some content for your story");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch("/api/stories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`,
                    "user-id": user?.id?.toString() || "",
                },
                body: JSON.stringify({
                    userId: user?.id,
                    content: content.trim(),
                    visibility,
                    durationHours: duration
                })
            });

            if (!response.ok) {
                throw new Error("Failed to create story");
            }

            const newStory = await response.json();
            
            if (onStoryCreated) {
                onStoryCreated(newStory);
            }

            // Reset form
            setContent("");
            setVisibility("followers");
            setDuration(24);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create story");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // For now, we'll just use the file name as content
        // In a real app, you'd upload the file to a storage service
        setContent(file.name);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="theme-bg-secondary theme-text-primary rounded-2xl p-6 max-w-md w-full theme-shadow border theme-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold theme-text-primary">Create Story</h2>
                        <button
                            onClick={onClose}
                            className="text-2xl hover:opacity-70 transition-opacity theme-text-muted hover:theme-text-primary"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Content Input */}
                        <div>
                            <label className="block text-sm font-medium theme-text-primary mb-2">
                                Story Content
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's happening?"
                                className="w-full px-4 py-3 rounded-xl theme-bg-primary border theme-border text-sm outline-none theme-text-primary resize-none"
                                rows={4}
                                maxLength={500}
                            />
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs theme-text-muted">
                                    {content.length}/500 characters
                                </span>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 text-xs theme-text-muted hover:theme-text-primary transition"
                                >
                                    <Camera size={14} />
                                    Add Photo/Video
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {/* Visibility Settings */}
                        <div>
                            <label className="block text-sm font-medium theme-text-primary mb-3">
                                Who can see this story?
                            </label>
                            <div className="space-y-2">
                                {visibilityOptions.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <label
                                            key={option.id}
                                            className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition ${
                                                visibility === option.id
                                                    ? 'theme-bg-tertiary ring-2 ring-cyan-400'
                                                    : 'theme-bg-primary hover:theme-bg-tertiary'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="visibility"
                                                value={option.id}
                                                checked={visibility === option.id}
                                                onChange={(e) => setVisibility(e.target.value)}
                                                className="sr-only"
                                            />
                                            <Icon size={20} className={option.color} />
                                            <div className="flex-1">
                                                <p className="font-medium theme-text-primary">
                                                    {option.name}
                                                </p>
                                                <p className="text-sm theme-text-muted">
                                                    {option.description}
                                                </p>
                                            </div>
                                            {visibility === option.id && (
                                                <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs">✓</span>
                                                </div>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Duration Settings */}
                        <div>
                            <label className="block text-sm font-medium theme-text-primary mb-2">
                                Story Duration
                            </label>
                            <div className="flex items-center space-x-3">
                                <Clock size={16} className="theme-text-muted" />
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="flex-1 px-3 py-2 rounded-lg theme-bg-primary border theme-border text-sm outline-none theme-text-primary"
                                >
                                    <option value={1}>1 hour</option>
                                    <option value={6}>6 hours</option>
                                    <option value={12}>12 hours</option>
                                    <option value={24}>24 hours</option>
                                    <option value={48}>48 hours</option>
                                </select>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-red-400 text-sm text-center py-2">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 px-4 theme-bg-primary theme-text-primary rounded-lg hover:theme-bg-tertiary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !content.trim()}
                                className="flex-1 py-2 px-4 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Creating..." : "Create Story"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}