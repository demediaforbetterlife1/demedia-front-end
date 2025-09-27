"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { IoAdd } from "react-icons/io5";
import { dataService } from "@/services/dataService";
import { contentService } from "@/services/contentService";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
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
        <div className="relative bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
                <h3 className="text-base sm:text-lg font-semibold theme-text-primary">Stories</h3>
                <button
                    onClick={fetchStories}
                    className="p-1.5 sm:p-2 rounded-full theme-bg-tertiary/60 hover:theme-bg-tertiary transition-all duration-200 hover:scale-105"
                    title="Refresh stories"
                >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 theme-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
            <div className="flex overflow-x-auto gap-3 sm:gap-4 px-3 sm:px-4 pb-4 scrollbar-hide">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center min-w-[70px] cursor-pointer"
                    onClick={handleAddStory}
                >
                <div className="w-16 h-16 rounded-full theme-bg-secondary flex items-center justify-center theme-text-muted font-bold border-2 border-dashed border-cyan-400 relative group">
                    <IoAdd size={24} className="text-cyan-400" />
                    <div className="absolute inset-0 rounded-full bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="mt-1 text-sm theme-text-secondary">{t('stories.add', 'Add Story')}</span>
            </motion.div>

            {stories.map((story, index) => (
                <motion.div
                    key={story.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center min-w-[70px] cursor-pointer"
                    onClick={() => handleStoryClick(story, index)}
                >
                    <div className="w-16 h-16 rounded-full theme-bg-secondary flex items-center justify-center theme-text-muted font-bold border-2 border-cyan-400 relative overflow-hidden">
                        {story.content?.startsWith('http') ? (
                            <img 
                                src={story.content} 
                                alt="Story"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to author avatar if image fails
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
                            <span className="text-lg font-bold">
                                {story.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        )}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/20 to-purple-400/20" />
                        {story.views > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white">✓</span>
                            </div>
                        )}
                        {/* Visibility indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border border-white">
                            {story.visibility === 'public' && <div className="w-full h-full bg-green-500 rounded-full" />}
                            {story.visibility === 'followers' && <div className="w-full h-full bg-blue-500 rounded-full" />}
                            {story.visibility === 'close_friends' && <div className="w-full h-full bg-purple-500 rounded-full" />}
                        </div>
                    </div>
                    <span className="mt-1 text-sm theme-text-secondary truncate max-w-[60px]">
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
