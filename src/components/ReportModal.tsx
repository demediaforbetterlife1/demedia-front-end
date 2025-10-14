"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, AlertTriangle, Shield, Eye, MessageCircle, User, FileText } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: number;
    postAuthor: string;
    onReportSubmitted: (reason: string, details: string) => void;
}

const reportReasons = [
    {
        id: 'spam',
        label: 'Spam',
        description: 'Repetitive, unwanted, or promotional content',
        icon: AlertTriangle,
        color: 'text-orange-500'
    },
    {
        id: 'harassment',
        label: 'Harassment or Bullying',
        description: 'Targeted abuse, threats, or intimidation',
        icon: Shield,
        color: 'text-red-500'
    },
    {
        id: 'inappropriate',
        label: 'Inappropriate Content',
        description: 'Offensive, explicit, or inappropriate material',
        icon: Eye,
        color: 'text-purple-500'
    },
    {
        id: 'false_info',
        label: 'False Information',
        description: 'Misleading, false, or deceptive content',
        icon: FileText,
        color: 'text-yellow-500'
    },
    {
        id: 'violence',
        label: 'Violence or Dangerous Content',
        description: 'Content promoting violence or dangerous activities',
        icon: AlertTriangle,
        color: 'text-red-600'
    },
    {
        id: 'other',
        label: 'Other',
        description: 'Something else that violates our guidelines',
        icon: Flag,
        color: 'text-gray-500'
    }
];

export default function ReportModal({ isOpen, onClose, postId, postAuthor, onReportSubmitted }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { theme } = useTheme();

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-white',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-50',
                    accent: 'text-red-500',
                    accentBg: 'bg-red-50'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-50',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-100',
                    hover: 'hover:bg-gray-100',
                    accent: 'text-red-500',
                    accentBg: 'bg-red-50'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    accent: 'text-red-400',
                    accentBg: 'bg-red-900/20'
                };
            case 'super-dark':
                return {
                    bg: 'bg-gray-900',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800',
                    hover: 'hover:bg-gray-800',
                    accent: 'text-red-400',
                    accentBg: 'bg-red-900/30'
                };
            case 'gold':
                return {
                    bg: 'bg-gradient-to-br from-yellow-900 to-yellow-800',
                    text: 'text-yellow-100',
                    textSecondary: 'text-yellow-200',
                    border: 'border-yellow-600/50',
                    hover: 'hover:bg-yellow-800/80 gold-shimmer',
                    accent: 'text-red-300',
                    accentBg: 'bg-red-900/40'
                };
            default:
                return {
                    bg: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    accent: 'text-red-400',
                    accentBg: 'bg-red-900/20'
                };
        }
    };

    const themeClasses = getThemeClasses();

    const handleSubmit = async () => {
        if (!selectedReason) return;

        setIsSubmitting(true);
        try {
            await onReportSubmitted(selectedReason, details);
            onClose();
            setSelectedReason('');
            setDetails('');
        } catch (error) {
            console.error('Error submitting report:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                    className={`${themeClasses.bg} rounded-2xl w-full max-w-md shadow-2xl border ${themeClasses.border}`}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${themeClasses.accentBg} rounded-full flex items-center justify-center`}>
                                <Flag className={`w-5 h-5 ${themeClasses.accent}`} />
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold ${themeClasses.text}`}>Report Post</h2>
                                <p className={`text-sm ${themeClasses.textSecondary}`}>by @{postAuthor}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 ${themeClasses.hover} rounded-full transition-colors`}
                        >
                            <X className={`w-5 h-5 ${themeClasses.textSecondary}`} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                                Why are you reporting this post?
                            </h3>
                            <div className="space-y-3">
                                {reportReasons.map((reason) => (
                                    <button
                                        key={reason.id}
                                        onClick={() => setSelectedReason(reason.id)}
                                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                            selectedReason === reason.id
                                                ? `${themeClasses.accentBg} border-red-500`
                                                : `${themeClasses.border} ${themeClasses.hover}`
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <reason.icon className={`w-5 h-5 mt-0.5 ${reason.color}`} />
                                            <div>
                                                <div className={`font-medium ${themeClasses.text}`}>
                                                    {reason.label}
                                                </div>
                                                <div className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                                                    {reason.description}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Additional Details */}
                        {selectedReason && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3"
                            >
                                <label className={`block text-sm font-medium ${themeClasses.textSecondary}`}>
                                    Additional details (optional)
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Provide more context about why you're reporting this post..."
                                    className={`w-full p-3 rounded-lg border ${themeClasses.border} ${themeClasses.bg} ${themeClasses.text} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none`}
                                    rows={3}
                                    maxLength={500}
                                />
                                <div className={`text-xs ${themeClasses.textSecondary} text-right`}>
                                    {details.length}/500 characters
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`flex items-center justify-between p-6 border-t ${themeClasses.border}`}>
                        <button
                            onClick={onClose}
                            className={`px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedReason || isSubmitting}
                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
