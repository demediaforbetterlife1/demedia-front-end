"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Globe, Users, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getModalThemeClasses } from "@/utils/enhancedThemeUtils";
import { apiFetch, getAuthHeaders } from "@/lib/api";

interface VisibilityModalProps {
  closeModal: () => void;
}

const visibilityOptions = [
  { id: "public", name: "Public", description: "Anyone can see your posts", icon: Globe, color: "text-green-500" },
  { id: "followers", name: "Followers", description: "Only your followers can see", icon: Users, color: "text-blue-500" },
  { id: "private", name: "Private", description: "Only you can see", icon: Lock, color: "text-purple-500" }
];

export default function VisibilityModal({ closeModal }: VisibilityModalProps) {
    const { user, updateUser } = useAuth(); // Changed from setUser to updateUser
    const [visibility, setVisibility] = useState(user?.privacy || "public");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        setIsSaving(true);
        setError("");

        try {
            const response = await apiFetch(`/api/user/${user?.id}`, {
                method: "PUT",
                headers: getAuthHeaders(user?.id),
                body: JSON.stringify({ privacy: visibility })
            }, user?.id);

            if (!response.ok) {
                throw new Error('Failed to update privacy settings');
            }

            const updatedUser = await response.json();
            
            // Use updateUser instead of setUser
            if (updateUser && updatedUser) {
                updateUser(updatedUser);
            }

            closeModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const { theme } = useTheme();
    const themeClasses = getModalThemeClasses(theme);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
            onClick={closeModal}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`${themeClasses.modal} rounded-3xl p-6 max-w-md w-full mx-4 border ${themeClasses.border} ${themeClasses.shadow}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-bold ${themeClasses.text}`}>Post Visibility</h2>
                    <button
                        onClick={closeModal}
                        className={`w-8 h-8 rounded-full ${themeClasses.hover} flex items-center justify-center transition-colors`}
                    >
                        <X className={`w-4 h-4 ${themeClasses.textSecondary}`} />
                    </button>
                </div>

                <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
                    Control who can see your future posts.
                </p>

                <div className="space-y-3">
                    {visibilityOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.id}
                                onClick={() => setVisibility(option.id)}
                                className={`flex items-center space-x-3 w-full p-4 rounded-xl border transition-all ${
                                    visibility === option.id
                                        ? "border-blue-500 bg-blue-500/10"
                                        : `${themeClasses.border} ${themeClasses.hover}`
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${visibility === option.id ? option.color : themeClasses.textSecondary}`} />
                                <div className="text-left">
                                    <p className={`font-medium ${themeClasses.text}`}>{option.name}</p>
                                    <p className={`text-xs ${themeClasses.textSecondary}`}>{option.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <div className="flex items-center justify-end space-x-3 mt-6">
                    <button
                        onClick={closeModal}
                        className={`px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}