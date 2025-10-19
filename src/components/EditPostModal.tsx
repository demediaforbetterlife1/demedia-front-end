"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Image, Video, Hash, AtSign, MapPin, Calendar, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getModalThemeClasses } from "@/utils/enhancedThemeUtils";
import { notificationService } from "@/services/notificationService";

interface EditPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: {
        id: number;
        title?: string;
        content: string;
        imageUrl?: string;
        videoUrl?: string;
        images?: string[];
        videos?: string[];
        media?: {
            type: 'image' | 'video';
            url: string;
            thumbnail?: string;
        }[];
        hashtags?: string[];
        mentions?: string[];
        location?: string;
        privacySettings?: {
            visibility: 'public' | 'followers' | 'private';
            allowComments: boolean;
            allowLikes: boolean;
        };
    };
    onPostUpdated: (updatedPost: any) => void;
}

export default function EditPostModal({ isOpen, onClose, post, onPostUpdated }: EditPostModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState(post.title || '');
    const [content, setContent] = useState(post.content);
    const [hashtags, setHashtags] = useState<string[]>(post.hashtags || []);
    const [mentions, setMentions] = useState<string[]>(post.mentions || []);
    const [location, setLocation] = useState(post.location || '');
    const [privacySettings, setPrivacySettings] = useState(post.privacySettings || {
        visibility: 'public' as const,
        allowComments: true,
        allowLikes: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme();
    const themeClasses = getModalThemeClasses(theme);

    // Initialize form data when post changes
    useEffect(() => {
        if (post) {
            setTitle(post.title || '');
            setContent(post.content);
            setHashtags(post.hashtags || []);
            setMentions(post.mentions || []);
            setLocation(post.location || '');
            setPrivacySettings(post.privacySettings || {
                visibility: 'public',
                allowComments: true,
                allowLikes: true
            });
        }
    }, [post]);

    const handleHashtagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const value = e.currentTarget.value.trim();
            if (value && !hashtags.includes(value)) {
                setHashtags([...hashtags, value]);
                e.currentTarget.value = '';
            }
        }
    };

    const removeHashtag = (index: number) => {
        setHashtags(hashtags.filter((_, i) => i !== index));
    };

    const handleMentionInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const value = e.currentTarget.value.trim();
            if (value && !mentions.includes(value)) {
                setMentions([...mentions, value]);
                e.currentTarget.value = '';
            }
        }
    };

    const removeMention = (index: number) => {
        setMentions(mentions.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            setError('Post content is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/posts/${post.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-id': user?.id?.toString() || '',
                },
                body: JSON.stringify({
                    title: title.trim() || null,
                    content: content.trim(),
                    hashtags,
                    mentions,
                    location: location.trim() || null,
                    // Backend expects a string, not an object
                    privacySettings: privacySettings.visibility
                })
            });

            if (response.ok) {
                const updatedPost = await response.json();
                console.log('✅ Update response:', updatedPost);
                
                // Ensure the updated post has the correct structure
                const formattedPost = {
                    ...updatedPost,
                    id: updatedPost.id || post.id,
                    title: updatedPost.title || title,
                    content: updatedPost.content || content,
                    updatedAt: updatedPost.updatedAt || new Date().toISOString()
                };
                
                console.log('✅ Formatted post for update:', formattedPost);
                onPostUpdated(formattedPost);
                onClose();
                console.log('✅ Post updated successfully');
                notificationService.showNotification({
                    title: 'Post Updated',
                    body: 'Your post has been successfully updated',
                    tag: 'post_updated'
                });
            } else {
                const errorText = await response.text();
                console.error('Update failed:', response.status, errorText);
                
                // Try to parse error message
                let errorMessage = `Failed to update post (${response.status})`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                
                setError(errorMessage);
            }
        } catch (error) {
            console.error('Error updating post:', error);
            setError(`Network error: ${error instanceof Error ? error.message : 'Unable to connect to server'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                    className={`${themeClasses.bg} rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border ${themeClasses.border} flex flex-col overflow-hidden`}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${themeClasses.accentBg} rounded-full flex items-center justify-center`}>
                                <Save className={`w-5 h-5 ${themeClasses.textAccent}`} />
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold ${themeClasses.text}`}>Edit Post</h2>
                                <p className={`text-sm ${themeClasses.textSecondary}`}>Update your post content</p>
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
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                                Title (optional)
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Add a title to your post..."
                                className={`w-full p-3 rounded-lg border ${themeClasses.border} ${themeClasses.bg} ${themeClasses.text} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                maxLength={100}
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                                Content *
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's on your mind?"
                                className={`w-full p-3 rounded-lg border ${themeClasses.border} ${themeClasses.bg} ${themeClasses.text} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                                rows={4}
                                maxLength={2000}
                            />
                            <div className={`text-xs ${themeClasses.textSecondary} text-right mt-1`}>
                                {content.length}/2000 characters
                            </div>
                        </div>

                        {/* Hashtags */}
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                                Hashtags
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {hashtags.map((hashtag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                    >
                                        #{hashtag}
                                        <button
                                            onClick={() => removeHashtag(index)}
                                            className="hover:text-blue-600"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                onKeyDown={handleHashtagInput}
                                placeholder="Add hashtags (press Enter or Space)"
                                className={`w-full p-3 rounded-lg border ${themeClasses.border} ${themeClasses.bg} ${themeClasses.text} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                        </div>

                        {/* Mentions */}
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                                Mentions
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {mentions.map((mention, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                                    >
                                        @{mention}
                                        <button
                                            onClick={() => removeMention(index)}
                                            className="hover:text-green-600"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                onKeyDown={handleMentionInput}
                                placeholder="Add mentions (press Enter or Space)"
                                className={`w-full p-3 rounded-lg border ${themeClasses.border} ${themeClasses.bg} ${themeClasses.text} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                                Location
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Add location..."
                                className={`w-full p-3 rounded-lg border ${themeClasses.border} ${themeClasses.bg} ${themeClasses.text} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                        </div>

                        {/* Privacy Settings */}
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-3`}>
                                Privacy Settings
                            </label>
                            <div className="space-y-3">
                                <div>
                                    <label className={`block text-sm ${themeClasses.textSecondary} mb-2`}>
                                        Visibility
                                    </label>
                                    <select
                                        value={privacySettings.visibility}
                                        onChange={(e) => setPrivacySettings({
                                            ...privacySettings,
                                            visibility: e.target.value as 'public' | 'followers' | 'private'
                                        })}
                                        className={`w-full p-3 rounded-lg border ${themeClasses.border} ${themeClasses.bg} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    >
                                        <option value="public">Public</option>
                                        <option value="followers">Followers Only</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.allowComments}
                                            onChange={(e) => setPrivacySettings({
                                                ...privacySettings,
                                                allowComments: e.target.checked
                                            })}
                                            className="mr-2"
                                        />
                                        <span className={`text-sm ${themeClasses.textSecondary}`}>Allow Comments</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.allowLikes}
                                            onChange={(e) => setPrivacySettings({
                                                ...privacySettings,
                                                allowLikes: e.target.checked
                                            })}
                                            className="mr-2"
                                        />
                                        <span className={`text-sm ${themeClasses.textSecondary}`}>Allow Likes</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-500 text-red-700 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                        <span className="text-white text-xs">!</span>
                                    </div>
                                    {error}
                                </div>
                            </div>
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
                            disabled={!content.trim() || isSubmitting}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Update Post
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
