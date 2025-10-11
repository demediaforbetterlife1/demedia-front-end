"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, AlertTriangle, Shield, Eye, MessageCircle, User, FileText } from "lucide-react";

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
                    className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                                <Flag className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report Post</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">by @{postAuthor}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Why are you reporting this post?
                            </h3>
                            <div className="space-y-3">
                                {reportReasons.map((reason) => (
                                    <button
                                        key={reason.id}
                                        onClick={() => setSelectedReason(reason.id)}
                                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                            selectedReason === reason.id
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <reason.icon className={`w-5 h-5 mt-0.5 ${reason.color}`} />
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {reason.label}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Additional details (optional)
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Provide more context about why you're reporting this post..."
                                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                    rows={3}
                                    maxLength={500}
                                />
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                    {details.length}/500 characters
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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
