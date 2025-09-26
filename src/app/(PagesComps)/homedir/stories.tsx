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

interface Story {
    id: string;
    content: string;
    author: {
        id: string;
        name: string;
        username: string;
        profilePicture?: string;
    };
    createdAt: string;
    expiresAt: string;
    views: number;
    type: 'image' | 'video';
}

export default function Stories() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
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
            
            const userInterests = user?.interests || [];
            const data = userInterests.length > 0 
                ? await contentService.getPersonalizedStories(userInterests)
                : await dataService.getStories();
            
            setStories(data);
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
            
            setStories(prev => [newStory, ...prev]);
            
            showNewPostNotification('You');
            
            e.target.value = '';
        } catch (err: any) {
            console.error('Error adding story:', err);
            setError(err.message || 'Failed to add story');
        }
    };

    const handleStoryClick = async (story: Story) => {
        try {
            await dataService.viewStory(story.id);
            setStories(prev => 
                prev.map(s => 
                    s.id === story.id 
                        ? { ...s, views: s.views + 1 }
                        : s
                )
            );
        } catch (err) {
            console.error('Error viewing story:', err);
        }
    };

    if (loading) return <p className="theme-text-muted text-center mt-4">{t('stories.loading', 'Loading stories...')}</p>;
    if (error) return <p className="theme-text-muted text-center mt-4 text-red-400">{t('stories.error', 'Error loading stories')}: {error}</p>;

    return (
        <div className="flex overflow-x-auto gap-4 p-4">
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

            {stories.map((story) => (
                <motion.div
                    key={story.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center min-w-[70px] cursor-pointer"
                    onClick={() => handleStoryClick(story)}
                >
                    <div className="w-16 h-16 rounded-full theme-bg-secondary flex items-center justify-center theme-text-muted font-bold border-2 border-cyan-400 relative overflow-hidden">
                        {story.author?.profilePicture ? (
                            <img 
                                src={story.author.profilePicture} 
                                alt={story.author?.name || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            (story.author?.name?.charAt(0)?.toUpperCase() || 'U')
                        )}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/20 to-purple-400/20" />
                        {story.views > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white">✓</span>
                            </div>
                        )}
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
            />
        </div>
    );
}
