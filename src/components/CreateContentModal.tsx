"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    FileText, 
    Video, 
    Plus,
    Sparkles
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import CreateDeSnapModal from './CreateDeSnapModal';
import AddPostModal from '@/app/layoutElementsComps/navdir/AddPostModal';
import { useAuth } from '@/contexts/AuthContext';

interface CreateContentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateContentModal({ isOpen, onClose }: CreateContentModalProps) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [showPostModal, setShowPostModal] = useState(false);
    const [showDeSnapModal, setShowDeSnapModal] = useState(false);

    const handleClose = () => {
        setShowPostModal(false);
        setShowDeSnapModal(false);
        onClose();
    };

    const handlePostClick = () => {
        setShowPostModal(true);
        // Don't close the main modal immediately, let the post modal handle it
    };

    const handleDeSnapClick = () => {
        setShowDeSnapModal(true);
        // Don't close the main modal immediately, let the desnap modal handle it
    };

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-white',
                    text: 'text-gray-900',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-50',
                    shadow: 'shadow-lg'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-50',
                    text: 'text-gray-800',
                    border: 'border-gray-100',
                    hover: 'hover:bg-gray-100',
                    shadow: 'shadow-md'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-900',
                    text: 'text-white',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-800',
                    shadow: 'shadow-2xl'
                };
            case 'super-dark':
                return {
                    bg: 'bg-black',
                    text: 'text-gray-100',
                    border: 'border-gray-800',
                    hover: 'hover:bg-gray-900',
                    shadow: 'shadow-2xl'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    text: 'text-white',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-800',
                    shadow: 'shadow-2xl'
                };
        }
    };

    const themeClasses = getThemeClasses();

    if (!isOpen) return null;

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className={`relative ${themeClasses.bg} ${themeClasses.border} ${themeClasses.shadow} rounded-2xl p-6 mx-4 max-w-sm w-full`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-white" />
                                </div>
                                <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                                    Create Content
                                </h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className={`p-2 rounded-full ${themeClasses.hover} transition-colors`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Options */}
                        <div className="space-y-4">
                            {/* Post Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handlePostClick}
                                className={`w-full p-4 rounded-xl ${themeClasses.border} border-2 ${themeClasses.hover} transition-all duration-200 group`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className={`font-semibold ${themeClasses.text}`}>
                                            Create Post
                                        </h3>
                                        <p className={`text-sm opacity-70 ${themeClasses.text}`}>
                                            Share your thoughts, images, and stories
                                        </p>
                                    </div>
                                    <Sparkles className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </motion.button>

                            {/* DeSnap Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDeSnapClick}
                                className={`w-full p-4 rounded-xl ${themeClasses.border} border-2 ${themeClasses.hover} transition-all duration-200 group`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                        <Video className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className={`font-semibold ${themeClasses.text}`}>
                                            Create DeSnap
                                        </h3>
                                        <p className={`text-sm opacity-70 ${themeClasses.text}`}>
                                            Share temporary videos and moments
                                        </p>
                                    </div>
                                    <Sparkles className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </motion.button>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className={`text-xs text-center opacity-60 ${themeClasses.text}`}>
                                Choose what you'd like to create
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Post Modal */}
            {showPostModal && user && (
                <AddPostModal
                    isOpen={showPostModal}
                    onClose={() => {
                        setShowPostModal(false);
                        onClose(); // Close the main modal when post modal closes
                    }}
                    authorId={Number(user.id)}
                />
            )}

            {/* DeSnap Modal */}
            {showDeSnapModal && (
                <CreateDeSnapModal
                    isOpen={showDeSnapModal}
                    onClose={() => {
                        setShowDeSnapModal(false);
                        onClose(); // Close the main modal when desnap modal closes
                    }}
                />
            )}
        </>
    );
}
