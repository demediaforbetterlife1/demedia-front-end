"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles, Eye, Clock, Users } from "lucide-react";
import { dataService } from "@/services/dataService";
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
  type: "image" | "video";
  visibility?: "public" | "followers" | "close_friends";
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
      case "light":
        return {
          bg: "bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-sm",
          card: "bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-lg",
          text: "text-gray-900",
          textSecondary: "text-gray-600",
          border: "border-gray-200",
          hover: "hover:bg-gray-50",
          gradient: "from-blue-500/10 to-purple-500/10",
        };
      case "super-light":
        return {
          bg: "bg-gray-50/80",
          card: "bg-white",
          text: "text-gray-800",
          textSecondary: "text-gray-600",
          border: "border-gray-200/50",
          hover:
            "hover:bg-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
          ring: "ring-blue-500/50",
          accent: "text-blue-600",
          gradient: "bg-gradient-to-br from-blue-500 to-purple-600",
        };
      case "super-light":
        return {
          bg: "bg-gradient-to-r from-white/95 via-sky-50/20 to-blue-50/40 backdrop-blur-xl",
          card: "bg-white/90 backdrop-blur-2xl border border-slate-200/40 shadow-xl shadow-blue-100/20",
          text: "text-slate-800",
          textSecondary: "text-slate-600",
          border: "border-slate-200/30",
          hover:
            "hover:bg-white/80 hover:shadow-2xl hover:shadow-blue-200/30 hover:-translate-y-2 hover:scale-105 transition-all duration-500",
          ring: "ring-blue-400/50",
          accent: "text-blue-700",
          gradient:
            "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600",
        };
      case "dark":
        return {
          bg: "bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm",
          card: "bg-gray-800/95 backdrop-blur-md border border-gray-700/60",
          text: "text-white",
          textSecondary: "text-gray-300",
          border: "border-gray-700/50",
          hover:
            "hover:bg-gray-700/60 hover:shadow-lg transition-all duration-300",
          ring: "ring-blue-500/50",
          accent: "text-blue-400",
          gradient: "bg-gradient-to-br from-blue-500 to-purple-600",
        };
      case "super-dark":
        return {
          bg: "bg-gradient-to-r from-black/90 via-slate-950/80 to-indigo-950/40 backdrop-blur-2xl",
          card: "bg-slate-950/60 backdrop-blur-3xl border border-slate-800/40 shadow-2xl shadow-black/60",
          text: "text-slate-100",
          textSecondary: "text-gray-400",
          border: "border-gray-800",
          hover: "hover:bg-gray-800",
          gradient: "from-cyan-400/20 to-purple-400/20",
        };
      case "gold":
        return {
          bg: "bg-gradient-to-br from-yellow-900/80 to-yellow-800/80",
          card: "bg-gradient-to-br from-yellow-800 to-yellow-700",
          text: "text-yellow-100",
          textSecondary: "text-yellow-200",
          border: "border-yellow-600/50",
          hover: "hover:bg-yellow-800/80 gold-shimmer",
          gradient: "from-yellow-400/30 to-amber-400/30",
        };
      default:
        return {
          bg: "bg-gray-900/80",
          card: "bg-gray-800",
          text: "text-white",
          textSecondary: "text-gray-300",
          border: "border-gray-700",
          hover: "hover:bg-gray-700",
          gradient: "from-cyan-500/20 to-purple-500/20",
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

      // Fetch stories from the API
      const response = await fetch(`/api/stories`, {
        headers: {
          "user-id": user.id.toString(),
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch stories");
      }

      const data = await response.json();

      // Filter stories based on Facebook-style logic:
      // 1. Show stories from people you follow (regardless of if they follow you back)
      // 2. Show stories from mutual followers
      // 3. Hide public stories from people you don't follow (they should appear around profile pic instead)
      
      const filteredStories = data.filter((story: any) => {
        if (!story || !story.id || !story.author) return false;
        
        // Always show your own stories
        if (story.author.id === user.id) return true;
        
        // Check if story is from someone you follow
        const isFollowing = story.author.isFollowing || false;
        
        // Check if it's a mutual follow
        const isMutual = story.author.isFollower && story.author.isFollowing;
        
        // Show story if:
        // - You follow them (regardless of if they follow you back)
        // - It's a mutual follow
        // Hide public stories from people you don't follow
        if (story.visibility === 'public' && !isFollowing) {
          return false; // Public stories from non-followed users don't appear in story bar
        }
        
        return isFollowing || isMutual;
      });

      // Filter out invalid stories
      const validStories = filteredStories.filter(
        (story: any) =>
          story &&
          story.id &&
          story.author &&
          story.author.name &&
          story.author.name !== "Unknown" &&
          story.author.name.trim() !== "",
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
      const type = file.type.startsWith("video/") ? "video" : "image";
      // Pass userId from AuthContext, not localStorage
      const newStory = await dataService.createStory(file, type, user?.id);

      setStories((prev) => [
        {
          ...newStory,
          id: parseInt(newStory.id),
          author: { ...newStory.author, id: parseInt(newStory.author.id) },
          visibility: "followers",
        } as Story,
        ...prev,
      ]);

      showNewPostNotification("You");

      e.target.value = "";
    } catch (err: any) {
      console.error("Error adding story:", err);
      setError(err.message || "Failed to add story");
    }
  };

  const handleStoryClick = async (story: Story, index: number) => {
    try {
      // Mark story as viewed - pass userId from AuthContext
      await dataService.viewStory(story.id.toString(), user?.id);
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, views: s.views + 1 } : s)),
      );

      // Open story viewer
      setCurrentStoryIndex(index);
      setShowStoryViewer(true);
    } catch (err) {
      console.error("Error viewing story:", err);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center mt-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
        <span className="ml-2 theme-text-muted">
          {t("stories.loading", "Loading stories...")}
        </span>
      </div>
    );

  if (error)
    return (
      <div className="text-center mt-4">
        <p className="text-red-400 mb-2">
          {t("stories.error", "Error loading stories")}: {error}
        </p>
        <button
          onClick={fetchStories}
          className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div
      className={`relative ${themeClasses.bg} backdrop-blur-xl rounded-2xl border ${themeClasses.border} shadow-xl overflow-hidden`}
    >
      {/* Premium Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <motion.div 
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h3 className={`text-base font-bold ${themeClasses.text}`}>
              {t("stories.title", "Stories")}
            </h3>
            <p className={`text-xs ${themeClasses.textSecondary}`}>
              Share your moments
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchStories}
          className={`p-2 rounded-xl ${themeClasses.hover} transition-all duration-200 hover:shadow-lg`}
          title={t("action.refresh")}
        >
          <svg
            className={`w-4 h-4 ${themeClasses.textSecondary}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </motion.button>
      </div>

      {/* Stories Scroll Container */}
      <div className="relative px-4 py-4">
        <div className="flex overflow-x-auto gap-4 scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Add Story Card - Redesigned for Better Responsiveness */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20
            }}
            className="flex-shrink-0 w-[100px] sm:w-[110px] cursor-pointer group"
            onClick={handleAddStory}
          >
            <div className="relative">
              {/* Animated Gradient Border */}
              <motion.div 
                animate={{ 
                  rotate: 360
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl opacity-75 group-hover:opacity-100 blur-sm transition-opacity duration-300"
              />
              
              {/* Main Card */}
              <div className={`relative h-[140px] sm:h-[150px] rounded-xl ${themeClasses.card} overflow-hidden shadow-xl border border-white/10 group-hover:border-white/20 transition-all duration-300`}>
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
                
                {/* Animated Mesh Background */}
                <motion.div
                  animate={{ 
                    backgroundPosition: ['0% 0%', '100% 100%']
                  }}
                  transition={{ 
                    duration: 10, 
                    repeat: Infinity, 
                    ease: "linear",
                    repeatType: "reverse"
                  }}
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
                    backgroundSize: '200% 200%'
                  }}
                />
                
                {/* Content Container */}
                <div className="relative h-full flex flex-col items-center justify-center p-3">
                  {/* Plus Icon Circle */}
                  <motion.div
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg mb-3 group-hover:shadow-cyan-500/50 transition-shadow duration-300"
                  >
                    <Plus className="w-6 h-6 text-white" strokeWidth={3} />
                  </motion.div>
                  
                  {/* Text */}
                  <div className="text-center">
                    <p className={`text-xs font-bold ${themeClasses.text} mb-0.5 group-hover:text-cyan-400 transition-colors duration-300`}>
                      {t("content.addStory", "Add Story")}
                    </p>
                    <p className={`text-[10px] ${themeClasses.textSecondary} group-hover:text-purple-400 transition-colors duration-300`}>
                      Share moment
                    </p>
                  </div>
                  
                  {/* Sparkle Effects */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute top-2 right-2"
                  >
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  </motion.div>
                  
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute bottom-2 left-2"
                  >
                    <Sparkles className="w-3 h-3 text-pink-400" />
                  </motion.div>
                </div>
                
                {/* Shimmer Effect on Hover */}
                <motion.div
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '200%' }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
              </div>
            </div>
          </motion.div>

          {/* Story Cards - Enhanced & Responsive */}
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 w-[100px] sm:w-[110px] cursor-pointer group"
              onClick={() => handleStoryClick(story, index)}
            >
              <div className="relative">
                {/* Gradient Ring - Animated */}
                <motion.div 
                  animate={{ 
                    rotate: 360
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity, 
                    ease: "linear"
                  }}
                  className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-xl opacity-75 group-hover:opacity-100 blur-sm transition-opacity duration-300"
                />
                
                {/* Story Card */}
                <div
                  className={`relative h-[140px] sm:h-[150px] rounded-xl ${themeClasses.card} overflow-hidden shadow-xl border border-white/10 group-hover:border-white/20 transition-all duration-300`}
                >
              transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center min-w-[80px] cursor-pointer group"
              onClick={() => handleStoryClick(story, index)}
            >
              <div className="relative">
                {/* Gradient Ring - Animated */}
                <motion.div 
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl opacity-75 group-hover:opacity-100 blur-sm"
                />
                
                {/* Story Circle */}
                <div
                  className={`relative w-16 h-16 rounded-2xl ${themeClasses.card} overflow-hidden shadow-xl border-2 border-white/10 group-hover:border-white/20 transition-all duration-300`}
                >
                  {story.content?.startsWith("http") ? (
                    <img
                      src={story.content}
                      alt="Story"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (story.author?.profilePicture) {
                          target.src = story.author.profilePicture;
                        } else {
                          target.style.display = "none";
                          target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-600"><span class="text-xl font-bold text-white">${story.author?.name?.charAt(0)?.toUpperCase() || "U"}</span></div>`;
                        }
                      }}
                    />
                  ) : story.author?.profilePicture ? (
                    <img
                      src={story.author.profilePicture}
                      alt={story.author?.name || "User"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-600">
                      <span className={`text-xl font-bold text-white`}>
                        {story.author?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* View Count Badge */}
                  {story.views > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5"
                    >
                      <Eye className="w-2.5 h-2.5 text-cyan-400" />
                      <span className="text-[9px] font-semibold text-white">{story.views}</span>
                    </motion.div>
                  )}

                  {/* Time Badge */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5"
                  >
                    <Clock className="w-2.5 h-2.5 text-purple-400" />
                    <span className="text-[9px] font-semibold text-white">
                      {(() => {
                        const now = new Date();
                        const created = new Date(story.createdAt);
                        const diffMs = now.getTime() - created.getTime();
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMins = Math.floor(diffMs / (1000 * 60));
                        
                        if (diffHours >= 24) return `${Math.floor(diffHours / 24)}d`;
                        if (diffHours > 0) return `${diffHours}h`;
                        if (diffMins > 0) return `${diffMins}m`;
                        return 'now';
                      })()}
                    </span>
                  </motion.div>

                  {/* Visibility Badge */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                  >
                    {story.visibility === "public" && (
                      <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    )}
                    {story.visibility === "followers" && (
                      <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center">
                        <Users className="w-2 h-2 text-white" />
                      </div>
                    )}
                    {story.visibility === "close_friends" && (
                      <div className="w-full h-full bg-purple-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Author Name */}
              <span
                className={`mt-2 text-xs font-semibold ${themeClasses.text} text-center max-w-[80px] truncate`}
              >
                {story.author?.name || "Unknown"}
              </span>
              
              {/* Username */}
              <span className={`text-[10px] ${themeClasses.textSecondary} truncate max-w-[80px]`}>
                @{story.author?.username || 'user'}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Scroll Indicators */}
        {stories.length > 4 && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
          </>
        )}
      </div>

      {/* Story Count Badge */}
      {stories.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pb-3"
        >
          <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${themeClasses.card} border ${themeClasses.border}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className={`text-xs font-medium ${themeClasses.textSecondary}`}>
                {stories.length} active {stories.length === 1 ? 'story' : 'stories'}
              </span>
            </div>
            <span className={`text-xs ${themeClasses.textSecondary}`}>
              Tap to view
            </span>
          </div>
        </motion.div>
      )}

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
          setStories((prev) => [
            {
              ...newStory,
              id: parseInt(newStory.id),
              author: {
                ...newStory.author,
                id: parseInt(newStory.author.id),
              },
              visibility: "followers",
            } as Story,
            ...prev,
          ]);
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
  );
}
