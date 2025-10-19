"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { IoAdd } from "react-icons/io5";
import { Plus, Sparkles, Eye, Clock } from "lucide-react";
import { dataService } from "@/services/dataService";
import { contentService } from "@/services/contentService";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import CreateStoryModal from "@/app/layoutElementsComps/navdir/CreateStoryModal";
import StoryViewerModal from "@/app/layoutElementsComps/navdir/StoryViewerModal";

interface Story {
    id: number;
    content: string;
    author: {
        id: number;
        name: string;
        username: string;
        profilePicture?: string;
    };
    createdAt: string;
    expiresAt: string;
    views: number;
    type: 'image' | 'video';
    visibility?: 'public' | 'followers' | 'close_friends';
}

export default function Stories() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
    const [showStoryViewer, setShowStoryViewer] = useState(false);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showNewPostNotification } = useNotifications();
    const { user } = useAuth();
    const { t } = useI18n();
    const { theme } = useTheme();

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-white/80',
                    card: 'bg-white',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200',
                    hover: 'hover:bg-gray-50',
                    gradient: 'from-blue-500/10 to-purple-500/10'
                };
            case 'super-light':
                return {
                    bg: 'bg-gray-50/80',
                    card: 'bg-white',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-100',
                    hover: 'hover:bg-gray-100',
                    gradient: 'from-blue-400/10 to-purple-400/10'
                };
            case 'dark':
                return {
                    bg: 'bg-gray-900/80',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    gradient: 'from-cyan-500/20 to-purple-500/20'
                };
            case 'super-dark':
                return {
                    bg: 'bg-black/80',
                    card: 'bg-gray-900',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800',
                    hover: 'hover:bg-gray-800',
                    gradient: 'from-cyan-400/20 to-purple-400/20'
                };
            case 'gold':
                return {
                    bg: 'bg-gradient-to-br from-yellow-900/80 to-yellow-800/80',
                    card: 'bg-gradient-to-br from-yellow-800 to-yellow-700',
                    text: 'text-yellow-100',
                    textSecondary: 'text-yellow-200',
                    border: 'border-yellow-600/50',
                    hover: 'hover:bg-yellow-800/80 gold-shimmer',
                    gradient: 'from-yellow-400/30 to-amber-400/30'
                };
            default:
                return {
                    bg: 'bg-gray-900/80',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    gradient: 'from-cyan-500/20 to-purple-500/20'
                };
        }
    };

    const themeClasses = getThemeClasses();

    useEffect(() => {
        fetchStories();
    }, [user?.interests]);

    const fetchStories = async () => {
        try {
            setLoading(true);
            setError("");
            
            if (!user?.id) {
                setError("User not authenticated");
                return;
            }
            
            // Fetch stories from followed users only
            const response = await fetch(`/api/stories/followed?userId=${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-id': user.id.toString(),
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to fetch stories");
            }
            
            const data = await response.json();
            
            // Filter out invalid stories (backend already filters for followed users only)
            const validStories = data.filter((story: any) => 
                story && 
                story.id && 
                story.author && 
                story.author.name && 
                story.author.name !== "Unknown" &&
                story.author.name.trim() !== ""
            );
            
            setStories(validStories);
        } catch (err: any) {
            console.error("Failed to fetch stories:", err);
            setError(err.message || "Failed to load stories");
        } finally {
            setLoading(false);
        }
    };

    const handleAddStory = () => {
        setShowCreateStoryModal(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            const newStory = await dataService.createStory(file, type);
            
            setStories(prev => [{ 
                ...newStory, 
                id: parseInt(newStory.id), 
                author: { ...newStory.author, id: parseInt(newStory.author.id) },
                visibility: 'followers' 
            } as Story, ...prev]);
            
            showNewPostNotification('You');
            
            e.target.value = '';
        } catch (err: any) {
            console.error('Error adding story:', err);
            setError(err.message || 'Failed to add story');
        }
    };

    const handleStoryClick = async (story: Story, index: number) => {
        try {
            // Mark story as viewed
            await dataService.viewStory(story.id.toString());
            setStories(prev => 
                prev.map(s => 
                    s.id === story.id 
                        ? { ...s, views: s.views + 1 }
                        : s
                )
            );
            
            // Open story viewer
            setCurrentStoryIndex(index);
            setShowStoryViewer(true);
        } catch (err) {
            console.error('Error viewing story:', err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
            <span className="ml-2 theme-text-muted">{t('stories.loading', 'Loading stories...')}</span>
        </div>
    );
    
    if (error) return (
        <div className="text-center mt-4">
            <p className="text-red-400 mb-2">{t('stories.error', 'Error loading stories')}: {error}</p>
            <button 
                onClick={fetchStories}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
            >
                Retry
            </button>
        </div>
    );

    return (
        <div className={`relative ${themeClasses.bg} backdrop-blur-xl rounded-xl border ${themeClasses.border} shadow-md`}>
            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <h3 className={`text-sm font-semibold ${themeClasses.text}`}>Stories</h3>
                </div>
                <button
                    onClick={fetchStories}
                    className={`p-1.5 rounded-full ${themeClasses.hover} transition-all duration-200 hover:scale-105`}
                    title="Refresh stories"
                >
                    <svg className={`w-3 h-3 ${themeClasses.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
            <div className="flex overflow-x-auto gap-3 px-3 pb-3 scrollbar-hide">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center min-w-[60px] cursor-pointer"
                    onClick={handleAddStory}
                >
                    <div className={`w-12 h-12 rounded-full ${themeClasses.card} flex items-center justify-center border-2 border-dashed border-cyan-400 relative group shadow-md`}>
                        <Plus className="w-4 h-4 text-cyan-400" />
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${themeClasses.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>
                    <span className={`mt-1 text-xs font-medium ${themeClasses.textSecondary} text-center`}>
                        {t('stories.add', 'Add')}
                    </span>
                </motion.div>

            {stories.map((story, index) => (
                <motion.div
                    key={story.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center min-w-[60px] cursor-pointer"
                    onClick={() => handleStoryClick(story, index)}
                >
                    <div className={`w-12 h-12 rounded-full ${themeClasses.card} flex items-center justify-center border-2 border-cyan-400 relative overflow-hidden shadow-md`}>
                        {story.content?.startsWith('http') ? (
                            <img 
                                src={story.content} 
                                alt="Story"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (story.author?.profilePicture) {
                                        target.src = story.author.profilePicture;
                                    } else {
                                        target.style.display = 'none';
                                        target.parentElement!.innerHTML = story.author?.name?.charAt(0)?.toUpperCase() || 'U';
                                    }
                                }}
                            />
                        ) : story.author?.profilePicture ? (
                            <img 
                                src={story.author.profilePicture} 
                                alt={story.author?.name || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className={`text-lg font-bold ${themeClasses.text}`}>
                                {story.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        )}
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${themeClasses.gradient}`} />
                        
                        {/* View indicator */}
                        {story.views > 0 && (
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                                <Eye className="w-2 h-2 text-white" />
                            </div>
                        )}
                        
                        {/* Time indicator */}
                        <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                            <Clock className="w-2 h-2 text-white" />
                        </div>
                        
                        {/* Visibility indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border border-white shadow-md">
                            {story.visibility === 'public' && <div className="w-full h-full bg-green-500 rounded-full" />}
                            {story.visibility === 'followers' && <div className="w-full h-full bg-blue-500 rounded-full" />}
                            {story.visibility === 'close_friends' && <div className="w-full h-full bg-purple-500 rounded-full" />}
                        </div>
                    </div>
                    <span className={`mt-1 text-xs font-medium ${themeClasses.textSecondary} text-center truncate max-w-[50px]`}>
                        {story.author?.name || 'Unknown'}
                    </span>
                </motion.div>
            ))}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
            />

            <CreateStoryModal
                isOpen={showCreateStoryModal}
                onClose={() => setShowCreateStoryModal(false)}
                onStoryCreated={(newStory) => {
                    setStories(prev => [{ 
                        ...newStory, 
                        id: parseInt(newStory.id), 
                        author: { ...newStory.author, id: parseInt(newStory.author.id) },
                        visibility: 'followers' 
                    } as Story, ...prev]);
                    setShowCreateStoryModal(false);
                }}
            />

            <StoryViewerModal
                isOpen={showStoryViewer}
                onClose={() => setShowStoryViewer(false)}
                stories={stories}
                currentStoryIndex={currentStoryIndex}
                onStoryChange={(index) => setCurrentStoryIndex(index)}
            />
            </div>
        </div>
    );
}
