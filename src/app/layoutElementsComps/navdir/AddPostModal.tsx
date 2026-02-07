"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getModalThemeClasses } from "@/utils/enhancedThemeUtils";
import { contentModerationService } from "@/services/contentModeration";
import { apiFetch } from "@/lib/api";
import { normalizePost } from "@/utils/postUtils";
import { filesToBase64 } from "@/utils/imageToBase64";
import {
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Users,
  UserCheck,
  Globe,
  Lock,
  Settings,
  Smile,
  MapPin,
  Calendar,
} from "lucide-react";

interface AddPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorId: number;
}

interface PrivacySettings {
  visibility: "public" | "friends" | "followers" | "private";
  allowComments: boolean;
  allowMessages: boolean;
  allowSharing: boolean;
  allowReactions: boolean;
}

export default function AddPostModal({
  isOpen,
  onClose,
  authorId: _authorId,
}: AddPostModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  // const themeClasses = getModalThemeClasses(theme);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    visibility: "public",
    allowComments: true,
    allowMessages: true,
    allowSharing: true,
    allowReactions: true,
  });
  // const [selectedAudience, setSelectedAudience] = useState<string[]>([]);
  // const [showAudienceSelector, setShowAudienceSelector] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [currentMention, setCurrentMention] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [location, setLocation] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Fetch suggested users for mentions
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const response = await fetch(`/api/suggestions/users`, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Automatically sends httpOnly cookies
        });
        if (response.ok) {
          const users = await response.json();
          setSuggestedUsers(users);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch suggested users:", error);
      }
    };
    fetchSuggestedUsers();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Check each image for content moderation
      for (const file of newFiles) {
        console.log("AddPostModal: Checking image moderation for:", file.name);
        const moderationResult =
          await contentModerationService.moderateImage(file);

        if (!moderationResult.isApproved) {
          console.log(
            "AddPostModal: Image moderation failed:",
            moderationResult.reason,
          );
          setError(
            `Image not approved: ${moderationResult.reason}. ${moderationResult.suggestions?.join(". ")}`,
          );
          return;
        }

        console.log("AddPostModal: Image moderation passed for:", file.name);
      }

      setImages([...images, ...newFiles]);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setVideos([...videos, ...Array.from(e.target.files)]);
    }
  };

  const removeImage = (index: number) =>
    setImages(images.filter((_, i) => i !== index));
  const removeVideo = (index: number) =>
    setVideos(videos.filter((_, i) => i !== index));

  const handleHashtagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentHashtag.trim()) {
      const hashtag = currentHashtag.startsWith("#")
        ? currentHashtag
        : `#${currentHashtag}`;
      if (!hashtags.includes(hashtag)) {
        setHashtags([...hashtags, hashtag]);
      }
      setCurrentHashtag("");
    }
  };

  const handleMentionAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentMention.trim()) {
      const mention = currentMention.startsWith("@")
        ? currentMention
        : `@${currentMention}`;
      if (!mentions.includes(mention)) {
        setMentions([...mentions, mention]);
      }
      setCurrentMention("");
    }
  };

  const removeHashtag = (index: number) =>
    setHashtags(hashtags.filter((_, i) => i !== index));
  const removeMention = (index: number) =>
    setMentions(mentions.filter((_, i) => i !== index));

  // const handleAudienceToggle = (userId: string) => {
  //   setSelectedAudience((prev) =>
  //     prev.includes(userId)
  //       ? prev.filter((id) => id !== userId)
  //       : [...prev, userId],
  //   );
  // };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe className="w-4 h-4" />;
      case "friends":
        return <Users className="w-4 h-4" />;
      case "followers":
        return <UserCheck className="w-4 h-4" />;
      case "private":
        return <Lock className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "Public";
      case "friends":
        return "Friends Only";
      case "followers":
        return "Followers Only";
      case "private":
        return "Private";
      default:
        return "Public";
    }
  };

  const handleSubmit = async () => {
    if (!title && !content && images.length === 0 && videos.length === 0) {
      setError("⚠️ Please add some content to your post");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get userId from AuthContext - it comes from database, not localStorage
      const userId = user?.id;
      
      // Enhanced authentication debugging
      console.log("🔐 Post creation authentication check:", {
        userId: userId,
        userType: typeof userId,
        hasUser: !!user,
        userSetupComplete: user?.isSetupComplete,
        cookieToken: document.cookie.includes('token'),
        localStorageToken: !!localStorage.getItem('token')
      });
      if (!userId) {
        setError("⚠️ Please log in to create a post");
        return;
      }

      if (content.trim()) {
        const moderationResult =
          await contentModerationService.moderateText(content);
        if (!moderationResult.isApproved) {
          setError(`❌ Content not approved: ${moderationResult.reason}`);
          setLoading(false);
          return;
        }
      }

      const maxFileSize = 10 * 1024 * 1024;
      const oversizedFiles = [...images, ...videos].filter(
        (f) => f.size > maxFileSize,
      );
      if (oversizedFiles.length > 0) {
        setError("⚠️ Some files are too large (max 10MB).");
        return;
      }

      // Convert images to Base64 data URLs (100% frontend storage)
      console.log("📦 AddPostModal: Converting", images.length, "images to Base64");
      let imageUrls: string[] = [];
      
      if (images.length > 0) {
        try {
          // Convert all images to Base64 data URLs
          // Use slightly lower quality (0.7) to keep file sizes manageable
          // Max width 1000px to balance quality and size
          imageUrls = await filesToBase64(images, 1000, 0.7);
          console.log("✅ AddPostModal: All images converted to Base64. Count:", imageUrls.length);
          
          // Log sizes for debugging and validate
          let totalSizeKB = 0;
          imageUrls.forEach((url, i) => {
            const sizeKB = Math.round(url.length / 1024);
            totalSizeKB += sizeKB;
            console.log(`📸 Image ${i + 1}: ${sizeKB}KB (Base64)`);
            
            // Validate the Base64 data URL
            if (!url.startsWith('data:image/')) {
              console.error(`❌ Image ${i + 1} is not a valid Base64 data URL`);
            }
          });
          
          console.log(`📊 Total images size: ${totalSizeKB}KB`);
          
          // Warn if total size is very large (over 5MB)
          if (totalSizeKB > 5000) {
            console.warn("⚠️ Total image size is large, this may cause issues");
          }
        } catch (err) {
          console.error("❌ AddPostModal: Failed to convert images:", err);
          setError(`❌ Failed to process images: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setLoading(false);
          return;
        }
      }
      
      console.log("✅ AddPostModal: All images processed. Count:", imageUrls.length);

      // Videos still upload to backend (for now, focusing on photos)
      const videoUrls: string[] = [];
      // TODO: Implement local video storage similar to photos

      console.log("Creating post with data:", {
        title: title || null,
        content,
        userId: typeof userId === "string" ? parseInt(userId) : userId,
        imageUrls,
        videoUrls,
        imageCount: imageUrls.length,
        videoCount: videoUrls.length,
      });

      const postData = {
        title: title || null,
        content,
        userId: typeof userId === "string" ? parseInt(userId) : userId,
        privacySettings,
        hashtags,
        mentions,
        location,
        scheduledDate:
          isScheduled && scheduleDate
            ? new Date(scheduleDate).toISOString()
            : null,
        imageUrls,
        imageUrl: imageUrls[0] || null,
        videoUrls,
        videoUrl: videoUrls[0] || null,
      };

      // Verify user authentication before making the request
      if (!userId) {
        setError("❌ User not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      // Check if we have a valid token
      const token = document.cookie.includes('token') || localStorage.getItem('token');
      if (!token) {
        setError("❌ Authentication token missing. Please log in again.");
        setLoading(false);
        return;
      }

      console.log("🔐 Authentication check passed:", {
        userId: userId,
        hasToken: !!token,
        userType: typeof userId
      });

      // Use apiFetch which handles cookies automatically via credentials: 'include'
      const res = await apiFetch(
        `/api/posts`,
        {
          method: "POST",
          body: JSON.stringify(postData),
        },
        userId, // Pass userId to apiFetch for proper authentication
      );

      const responseText = await res.text();
      console.log("📡 Post creation response:", {
        status: res.status,
        statusText: res.statusText,
        responseLength: responseText.length
      });

      if (!res.ok) {
        let errorMessage = `❌ Post creation failed (${res.status})`;
        
        // Provide specific error messages based on status code
        switch (res.status) {
          case 401:
            errorMessage = "❌ Authentication failed. Please log in again.";
            // Optionally trigger logout or token refresh
            break;
          case 403:
            errorMessage = "❌ You don't have permission to create posts.";
            break;
          case 413:
            errorMessage = "❌ Post content is too large. Please reduce image sizes.";
            break;
          case 429:
            errorMessage = "❌ Too many posts. Please wait before posting again.";
            break;
          case 500:
            errorMessage = "❌ Server error. Please try again later.";
            break;
          default:
            errorMessage = `❌ Post creation failed: ${responseText.substring(0, 100)}`;
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      try {
        const newPost = JSON.parse(responseText);
        const normalizedPost = normalizePost(newPost) || newPost;

        // Store photos in local cache for reliable retrieval
        if (imageUrls.length > 0 && newPost.id) {
          try {
            const { postPhotoCache } = await import('@/services/storage/PostPhotoCache');
            await postPhotoCache.storePhotosForPost(newPost.id, imageUrls);
            console.log(`✅ Cached ${imageUrls.length} photos for post ${newPost.id}`);
          } catch (cacheErr) {
            console.warn('Failed to cache photos locally:', cacheErr);
            // Continue anyway - photos are still in backend
          }
        }

        alert("✅ Post created successfully!");

        // Dispatch event to refresh posts list with the Base64 images included
        const postWithImages = {
          ...normalizedPost,
          imageUrls: imageUrls.length > 0 ? imageUrls : normalizedPost.imageUrls,
          images: imageUrls.length > 0 ? imageUrls : normalizedPost.images,
          imageUrl: imageUrls[0] || normalizedPost.imageUrl,
        };
        
        window.dispatchEvent(
          new CustomEvent("post:created", {
            detail: { post: postWithImages },
          }),
        );

        onClose();
      } catch {
        setError(`⚠️ JSON parse error: ${responseText}`);
      }
    } catch (err: unknown) {
      // 🔥 Show full error message in UI
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div className="min-h-screen theme-bg-primary flex items-center justify-center p-4">
      <motion.div
        className="theme-bg-secondary rounded-3xl w-[800px] max-w-[95%] max-h-[90vh] overflow-y-auto theme-shadow flex flex-col border theme-border"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b theme-border">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Create Post
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Privacy Settings Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-full theme-bg-primary/50">
                {getVisibilityIcon(privacySettings.visibility)}
                <span className="text-sm font-medium theme-text-primary">
                  {getVisibilityText(privacySettings.visibility)}
                </span>
              </div>
              <button
                onClick={() => setShowPrivacySettings(!showPrivacySettings)}
                className="flex items-center space-x-2 px-3 py-2 rounded-full theme-bg-primary/50 hover:theme-bg-primary transition-colors"
              >
                <Settings size={16} />
                <span className="text-sm theme-text-secondary">Privacy</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsScheduled(!isScheduled)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors ${
                  isScheduled
                    ? "theme-bg-accent/20 text-cyan-400"
                    : "theme-bg-primary/50 theme-text-secondary hover:theme-bg-primary"
                }`}
              >
                <Calendar size={16} />
                <span className="text-sm">Schedule</span>
              </button>
            </div>
          </div>

          {/* Privacy Settings Panel */}
          {showPrivacySettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl theme-bg-primary/30 border theme-border space-y-4"
            >
              <h3 className="font-semibold theme-text-primary">
                Privacy Settings
              </h3>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">
                  Who can see this post?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["public", "friends", "followers", "private"].map(
                    (visibility) => (
                      <button
                        key={visibility}
                        onClick={() =>
                          setPrivacySettings((prev) => ({
                            ...prev,
                            visibility: visibility as
                              | "public"
                              | "friends"
                              | "followers"
                              | "private",
                          }))
                        }
                        className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                          privacySettings.visibility === visibility
                            ? "theme-bg-accent/20 text-cyan-400 border border-cyan-400/30"
                            : "theme-bg-primary/50 hover:theme-bg-primary"
                        }`}
                      >
                        {getVisibilityIcon(visibility)}
                        <span className="text-sm">
                          {getVisibilityText(visibility)}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Interaction Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={privacySettings.allowComments}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          allowComments: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm theme-text-secondary">
                      Allow Comments
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={privacySettings.allowReactions}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          allowReactions: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm theme-text-secondary">
                      Allow Reactions
                    </span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={privacySettings.allowMessages}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          allowMessages: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm theme-text-secondary">
                      Allow Messages
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={privacySettings.allowSharing}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          allowSharing: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm theme-text-secondary">
                      Allow Sharing
                    </span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* Schedule Settings */}
          {isScheduled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl theme-bg-primary/30 border theme-border"
            >
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                Schedule for:
              </label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full p-3 rounded-lg theme-bg-primary theme-text-primary border theme-border focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </motion.div>
          )}

          {/* Title & Content */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Add a title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-xl theme-bg-primary theme-text-primary placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 border theme-border text-lg"
            />
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-xl theme-bg-primary theme-text-primary placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none h-32 border theme-border text-base"
            />
          </div>

          {/* Hashtags and Mentions */}
          <div className="space-y-4">
            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                Hashtags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="flex items-center space-x-1 px-3 py-1 bg-cyan-400/20 text-cyan-400 rounded-full text-sm"
                  >
                    <span>{hashtag}</span>
                    <button onClick={() => removeHashtag(index)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add hashtags (press Enter)"
                value={currentHashtag}
                onChange={(e) => setCurrentHashtag(e.target.value)}
                onKeyPress={handleHashtagAdd}
                className="w-full p-3 rounded-lg theme-bg-primary theme-text-primary placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 border theme-border"
              />
            </div>

            {/* Mentions */}
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                Mentions
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {mentions.map((mention, index) => (
                  <span
                    key={index}
                    className="flex items-center space-x-1 px-3 py-1 bg-purple-400/20 text-purple-400 rounded-full text-sm"
                  >
                    <span>{mention}</span>
                    <button onClick={() => removeMention(index)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Mention people (press Enter)"
                value={currentMention}
                onChange={(e) => setCurrentMention(e.target.value)}
                onKeyPress={handleMentionAdd}
                className="w-full p-3 rounded-lg theme-bg-primary theme-text-primary placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 border theme-border"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                Location (optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 theme-text-muted" />
                <input
                  type="text"
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 p-3 rounded-lg theme-bg-primary theme-text-primary placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 border theme-border"
                />
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center space-x-2 px-6 py-3 theme-bg-primary/60 rounded-xl theme-text-secondary hover:theme-bg-primary transition-colors border theme-border"
              >
                <ImageIcon size={20} />
                <span>Add Images</span>
              </button>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center space-x-2 px-6 py-3 theme-bg-primary/60 rounded-xl theme-text-secondary hover:theme-bg-primary transition-colors border theme-border"
              >
                <VideoIcon size={20} />
                <span>Add Videos</span>
              </button>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center space-x-2 px-6 py-3 theme-bg-primary/60 rounded-xl theme-text-secondary hover:theme-bg-primary transition-colors border theme-border"
              >
                <Smile size={20} />
                <span>Emoji</span>
              </button>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <input
              ref={videoInputRef}
              type="file"
              multiple
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
            />

            {/* Media Preview */}
            {(images.length > 0 || videos.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold theme-text-primary">
                  Media Preview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="relative group rounded-xl overflow-hidden shadow-lg"
                    >
                      <img
                        src={URL.createObjectURL(img)}
                        alt="preview"
                        className="w-full h-40 sm:h-32 object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 bg-red-500 rounded-full p-2 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Image {i + 1}
                      </div>
                    </div>
                  ))}
                  {videos.map((vid, i) => (
                    <div
                      key={i}
                      className="relative group rounded-xl overflow-hidden bg-black shadow-lg"
                    >
                      <video
                        src={URL.createObjectURL(vid)}
                        className="w-full h-40 sm:h-32 object-cover hover:scale-105 transition-transform duration-300"
                        controls
                        preload="metadata"
                      />
                      <button
                        onClick={() => removeVideo(i)}
                        className="absolute top-2 right-2 bg-red-500 rounded-full p-2 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                        title="Remove video"
                      >
                        <X size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Video {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-6 py-3 bg-red-500/10 border-l-4 border-red-500">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t theme-border">
          <div className="flex justify-between items-center">
            <div className="text-sm theme-text-muted">
              {content.length}/5000 characters
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl theme-bg-primary/50 theme-text-secondary hover:theme-bg-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  (!title &&
                    !content &&
                    images.length === 0 &&
                    videos.length === 0)
                }
                className="px-8 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Creating..."
                  : isScheduled
                    ? "Schedule Post"
                    : "Post"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
