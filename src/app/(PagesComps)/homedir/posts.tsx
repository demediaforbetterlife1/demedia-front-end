"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { apiFetch } from "@/lib/api";
import { normalizePost } from "@/utils/postUtils";
import { ensureAbsoluteMediaUrl } from "@/utils/mediaUtils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import CommentModal from "@/components/CommentModal";
import MediaImage from "@/components/MediaImage";
import PostImage from "@/components/PostImage";

type AuthorType = {
  id: number;
  name: string;
  username: string;
  profilePicture?: string | null;
};

type PostType = {
  id: number;
  title?: string | null;
  content: string;
  likes: number;
  comments: number;
  liked?: boolean;
  imageUrl?: string | null;
  imageUrls?: string[];
  images?: string[];
  videoUrl?: string | null;
  createdAt?: string;
  author?: AuthorType | null;
};

interface PostsProps {
  isVisible?: boolean;
  postId?: number;
}

type ThemeClasses = {
  bg: string;
  text: string;
  textMuted: string;
  accent: string;
  accentColor: string;
  like: string;
  comment: string;
};

const RELATIVE_DIVISIONS = [
  { amount: 60, name: "seconds" },
  { amount: 60, name: "minutes" },
  { amount: 24, name: "hours" },
  { amount: 7, name: "days" },
  { amount: 4.34524, name: "weeks" },
  { amount: 12, name: "months" },
  { amount: Number.POSITIVE_INFINITY, name: "years" },
] as const;

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "";
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return "";

  const diff = Date.now() - target.getTime();
  let duration = diff / 1000;

  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
      return formatter.format(
        Math.round(duration * (diff > 0 ? -1 : 1)),
        division.name as Intl.RelativeTimeFormatUnit,
      );
    }
    duration /= division.amount;
  }

  return "";
}

export default function Posts({ isVisible = true, postId }: PostsProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const [shareStatus, setShareStatus] = useState<Record<number, string>>({});

  const allThemes: Record<string, ThemeClasses> = {
    light: {
      bg: "bg-white/90 backdrop-blur-md border border-gray-200 shadow hover:shadow-lg transition-all duration-300",
      text: "text-gray-900",
      textMuted: "text-gray-500",
      accent: "text-blue-600",
      accentColor: "#2563eb",
      like: "text-red-500 hover:text-red-600",
      comment: "hover:text-blue-500",
    },
    dark: {
      bg: "bg-gray-900/90 backdrop-blur-md border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300",
      text: "text-gray-100",
      textMuted: "text-gray-400",
      accent: "text-cyan-400",
      accentColor: "#22d3ee",
      like: "text-red-400 hover:text-red-500",
      comment: "hover:text-cyan-300",
    },
    gold: {
      bg: "bg-gradient-to-br from-gray-900 to-black/95 backdrop-blur-xl border border-yellow-600/40 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] transition-all duration-300",
      text: "text-yellow-300",
      textMuted: "text-yellow-600/70",
      accent: "text-yellow-400",
      accentColor: "#fbbf24",
      like: "text-red-400 hover:text-red-300",
      comment: "hover:text-yellow-300",
    },
    "super-dark": {
      bg: "bg-gradient-to-br from-gray-950/80 via-black/75 to-purple-950/70 backdrop-blur-2xl border border-purple-500/40 shadow-[0_8px_32px_rgba(168,85,247,0.12),0_0_0_1px_rgba(168,85,247,0.08)] hover:shadow-[0_16px_48px_rgba(168,85,247,0.25),0_0_64px_rgba(236,72,153,0.15)] hover:border-purple-400/60 transition-all duration-700 overflow-hidden relative",
      text: "text-white",
      textMuted: "text-gray-400",
      accent: "text-purple-400",
      accentColor: "#a78bfa",
      like: "text-red-400 hover:text-red-300",
      comment: "hover:text-purple-300",
    },
    "super-light": {
      bg: "bg-white/95 backdrop-blur-md border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300",
      text: "text-gray-900",
      textMuted: "text-gray-600",
      accent: "text-green-600",
      accentColor: "#16a34a",
      like: "text-red-500 hover:text-red-600",
      comment: "hover:text-green-500",
    },
  };

  type ThemeKey = keyof typeof allThemes;
  const themeClasses = allThemes[(theme as ThemeKey) || "dark"];

  const defaultPostImage = "/images/default-post.svg";
  const defaultAvatar = "/images/default-avatar.svg";

  const fetchPosts = useCallback(async () => {
    try {
      console.log("🚀 Starting to fetch posts...");
      setLoading(true);

      const res = await apiFetch(
        "/api/posts",
        {
          method: "GET",
          cache: "no-store",
        },
        user?.id,
      );

      console.log("📡 API Response status:", res.status);

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      console.log("📦 Raw data received:", data);

      let postsArray = [];
      if (data.posts && Array.isArray(data.posts)) {
        postsArray = data.posts;
      } else if (Array.isArray(data)) {
        postsArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        postsArray = data.data;
      }

      console.log("📋 Posts array:", postsArray.length, "posts");

      const normalizedPosts = postsArray
        .filter((post: any) => post && typeof post === "object")
        .map((post: any) => {
          console.log('📸 Post image data:', {
            id: post.id,
            imageUrl: post.imageUrl,
            imageUrls: post.imageUrls,
            images: post.images,
            hasImages: !!(post.imageUrl || post.imageUrls?.length || post.images?.length)
          });
          
          return {
            id: post.id,
            title: post.title || null,
            content: post.content || "",
            imageUrl: post.imageUrl || null,
            imageUrls: post.imageUrls || post.images || [],
            images: post.images || post.imageUrls || [],
            videoUrl: post.videoUrl || null,
            likes: post.likes || 0,
            comments: post.comments || 0,
            liked: post.liked || false,
            createdAt: post.createdAt || new Date().toISOString(),
            updatedAt: post.updatedAt || new Date().toISOString(),
            author: post.author ||
              post.user || {
                id: post.userId || 1,
                username: "Unknown",
                name: "Unknown User",
                profilePicture: null,
              },
          };
        }) as PostType[];

      console.log("✨ Normalized posts:", normalizedPosts.length);

      setPosts(normalizedPosts);
      console.log("✅ Posts set successfully!");
    } catch (err) {
      console.error("❌ Fetch posts error:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("🎯 UseEffect triggered - isVisible:", isVisible);
    if (isVisible) {
      fetchPosts();
    }
  }, [isVisible, fetchPosts]);

  useEffect(() => {
    const handlePostCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ post?: unknown }>;
      const newPostRaw = customEvent.detail?.post;
      if (!newPostRaw) return;
      const normalized = normalizePost(newPostRaw);
      if (!normalized) return;

      console.log("✅ New post created:", {
        id: normalized.id,
        isLocal: (normalized as any).isLocalPost,
        hasImages:
          normalized.imageUrls?.length || normalized.images?.length || 0,
      });

      setPosts((prev) => {
        const filtered = prev.filter((p) => p.id !== normalized.id);
        return [normalized as PostType, ...filtered];
      });
    };

    window.addEventListener("post:created", handlePostCreated as EventListener);
    return () => {
      window.removeEventListener(
        "post:created",
        handlePostCreated as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("demedia:bookmarks");
      if (stored) {
        const parsed = JSON.parse(stored) as number[];
        setBookmarkedPosts(new Set(parsed));
      }
    } catch (error) {
      console.warn("Failed to load bookmarks", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "demedia:bookmarks",
        JSON.stringify(Array.from(bookmarkedPosts)),
      );
    } catch (error) {
      console.warn("Failed to persist bookmarks", error);
    }
  }, [bookmarkedPosts]);

  const handleLike = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              liked: !p.liked,
              likes: p.liked ? (p.likes || 1) - 1 : (p.likes || 0) + 1,
            }
          : p,
      ),
    );

    try {
      const res = await apiFetch(
        `/api/posts/${id}/like`,
        {
          method: "POST",
          cache: "no-store",
        },
        user?.id,
      );
      if (!res.ok) throw new Error("Like request failed");
      const data = await res.json();

      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                liked: data.liked ?? p.liked,
                likes: data.likes ?? p.likes,
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const goToUser = (e: React.MouseEvent, author?: AuthorType | null) => {
    e.stopPropagation();
    if (!author?.id) return;
    router.push(`/profile?userId=${author.id}`);
  };

  const goToPost = (id: number) => router.push(`/post/${id}`);

  const toggleBookmark = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setBookmarkedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const showShareToast = useCallback((postId: number, message: string) => {
    setShareStatus((prev) => ({ ...prev, [postId]: message }));
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      setShareStatus((prev) => {
        const { [postId]: _ignored, ...rest } = prev;
        return rest;
      });
    }, 2200);
  }, []);

  const handleShare = useCallback(
    async (e: React.MouseEvent, post: PostType) => {
      e.stopPropagation();
      if (typeof window === "undefined") return;
      const url = `${window.location.origin}/post/${post.id}`;
      const title = post.title || "DeMedia Post";
      const text = post.content?.slice(0, 160) ?? "Check this out on DeMedia!";

      try {
        if (navigator.share) {
          await navigator.share({ title, text, url });
          showShareToast(post.id, "Shared ✨");
          return;
        }

        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          showShareToast(post.id, "Link copied");
          return;
        }

        console.info(url);
        showShareToast(post.id, "Share manually");
      } catch (error) {
        console.error("Share failed:", error);
        showShareToast(post.id, "Share cancelled");
      }
    },
    [showShareToast],
  );

  console.log("🎬 Render - Posts component state:", {
    isVisible,
    loading,
    postsLength: posts.length,
    posts: posts.slice(0, 2),
  });

  if (!isVisible) {
    console.log("❌ Posts not visible, returning null");
    return null;
  }

  if (loading) {
    console.log("⏳ Posts loading, showing skeleton");
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6 max-w-3xl mx-auto w-full">
        {Array.from({ length: 3 }).map((_, idx) => (
          <PostSkeleton key={idx} themeClasses={themeClasses} />
        ))}
      </div>
    );
  }

  console.log("🎯 Rendering posts section with", posts.length, "posts");

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-2 md:p-4 max-w-3xl mx-auto w-full">
      {posts.length === 0 && (
        <div>
          <p style={{ color: "red", padding: "20px" }}>DEBUG: No posts found</p>
          <EmptyState themeClasses={themeClasses} fetchPosts={fetchPosts} />
        </div>
      )}
      {posts.map((post) => {
        const author = post.author;
        const profilePic =
          ensureAbsoluteMediaUrl(author?.profilePicture) || defaultAvatar;

        // Collect all possible image sources - check multiple fields
        const rawImages = (
          Array.isArray(post.images) && post.images.length > 0
            ? post.images
            : post.imageUrls && post.imageUrls.length > 0
              ? post.imageUrls
              : post.imageUrl
                ? [post.imageUrl]
                : []
        ) as string[];

        console.log(`🔍 Post ${post.id} raw images:`, {
          count: rawImages.length,
          firstImagePreview: rawImages[0]?.substring(0, 80),
          isBase64: rawImages[0]?.startsWith('data:image/'),
        });

        // Filter and process images - prioritize Base64 data URLs for 100% frontend display
        const images = rawImages
          .filter((img): img is string => {
            // Filter out null/undefined/empty
            if (!img || typeof img !== 'string' || img.trim() === '') {
              return false;
            }
            
            // Filter out local storage references - they don't work across devices
            if (img.startsWith('local-storage://') || img.startsWith('local-photo://')) {
              return false;
            }
            
            // Filter out obvious placeholders and defaults
            const lowerImg = img.toLowerCase();
            if (lowerImg.includes('default-post.svg') || 
                lowerImg.includes('default-placeholder.svg') || 
                lowerImg.includes('default-avatar.svg') ||
                lowerImg.includes('default-cover.svg') ||
                lowerImg.endsWith('placeholder.png') ||
                lowerImg.endsWith('placeholder.jpg') ||
                lowerImg.endsWith('placeholder.svg')) {
              return false;
            }
            
            // PRIORITY: Base64 data URLs - these are 100% frontend and always work
            if (img.startsWith('data:image/')) {
              // Validate the Base64 has actual content (not truncated)
              const commaIndex = img.indexOf(',');
              if (commaIndex > 0 && img.length > commaIndex + 100) {
                console.log(`  ✅ Post ${post.id}: Valid Base64 image (${Math.round(img.length / 1024)}KB)`);
                return true;
              }
              console.log(`  ❌ Post ${post.id}: Base64 appears truncated or invalid`);
              return false;
            }
            
            // Keep valid URLs (http/https or relative paths)
            if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/')) {
              return true;
            }
            
            return false;
          })
          .slice(0, 4);

        console.log(`✨ Post ${post.id} final images: ${images.length} valid images`);

        const videoUrl = post.videoUrl
          ? ensureAbsoluteMediaUrl(post.videoUrl)
          : null;

        const hasMedia = videoUrl || images.length > 0;
        
        console.log(`🖼️ Post ${post.id} images:`, {
          rawImages,
          processedImages: images,
          hasImages: images.length > 0,
          videoUrl,
          hasMedia
        });
        
        const isBookmarked = bookmarkedPosts.has(post.id);
        const isExpanded = expandedPosts.has(post.id);
        const shouldClamp = (post.content?.length || 0) > 320;
        const relativeTime = formatRelativeTime(post.createdAt);

        return (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`group rounded-2xl md:rounded-3xl p-4 md:p-6 cursor-pointer relative ${themeClasses.bg} ${
              theme === "super-dark"
                ? "ring-1 ring-purple-500/20 hover:ring-purple-400/40 before:absolute before:inset-0 before:rounded-2xl md:before:rounded-3xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700 before:bg-gradient-to-br before:from-purple-500/5 before:via-transparent before:to-pink-500/5 before:pointer-events-none"
                : ""
            } min-h-0`}
            onClick={() => goToPost(post.id)}
          >
            {theme === "super-dark" && (
              <>
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-400/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div
                  className="absolute inset-0 rounded-2xl md:rounded-3xl opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: "32px 32px",
                  }}
                />
              </>
            )}
            
            <div className="flex flex-col gap-4">
              {/* Header Section */}
              <div
                className="flex items-start gap-3 group/header"
                onClick={(e) => goToUser(e, author)}
              >
                <div
                  className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl overflow-hidden ring-2 ring-transparent group-hover/header:ring-2 transition-all duration-300 shrink-0"
                  style={
                    {
                      "--tw-ring-color": themeClasses.accentColor,
                    } as React.CSSProperties
                  }
                >
                  <MediaImage
                    src={profilePic}
                    alt="User avatar"
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 48px, 56px"
                    fallbackSrc={defaultAvatar}
                    priority
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-semibold text-base md:text-lg ${themeClasses.text} truncate`}>
                      {author?.name || "Community Member"}
                    </h3>
                    <span className="text-xs text-white/70 uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-white/10 shrink-0">
                      {relativeTime || "Just now"}
                    </span>
                  </div>
                  <p className={`text-xs md:text-sm ${themeClasses.textMuted} truncate`}>
                    @{author?.username ?? "user"} ·{" "}
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleString()
                      : "Live"}
                  </p>
                </div>
              </div>

              {/* Title Section */}
              {post.title && (
                <h2
                  className={`text-xl md:text-2xl font-semibold ${themeClasses.text} break-words`}
                >
                  {post.title}
                </h2>
              )}

              {/* Content Section */}
              <div className="flex flex-col gap-2 md:gap-3">
                {post.content && (
                  <p
                    className={`text-sm md:text-base leading-relaxed ${themeClasses.text} font-light select-text break-words ${
                      !isExpanded && shouldClamp ? "line-clamp-3" : ""
                    }`}
                  >
                    {post.content}
                  </p>
                )}
                {shouldClamp && (
                  <button
                    className="self-start text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white transition-colors"
                    onClick={(e) => toggleExpanded(e, post.id)}
                  >
             {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>

              {/* Media Section - Only renders if media exists */}
              {hasMedia && (
                <div className="mt-2 md:mt-4 rounded-xl md:rounded-2xl overflow-hidden">
                  {videoUrl && (
                    <div className="relative w-full overflow-hidden rounded-xl md:rounded-2xl bg-black/60 aspect-video">
                      <video
                        src={videoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {images.length > 0 &&
                    (images.length === 1 ? (
                      <div className="relative w-full overflow-hidden rounded-xl md:rounded-2xl aspect-video">
                        <PostImage
                          postId={post.id}
                          photoIndex={0}
                          src={images[0] || defaultPostImage}
                          alt={post.title || "Post image"}
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                          fill
                          sizes="(max-width: 768px) 100vw, 800px"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {images.slice(0, 4).map((img, idx) => {
                          const isHero = idx === 0 && images.length > 1;
                          const remaining = images.length - 4;
                          return (
                            <div
                              key={`${post.id}-img-${idx}`}
                              className={`relative overflow-hidden rounded-xl md:rounded-2xl ${
                                isHero ? "col-span-2 row-span-2 aspect-video" : "aspect-square"
                              }`}
                            >
                              <PostImage
                                postId={post.id}
                                photoIndex={idx}
                                src={img || defaultPostImage}
                                alt={`Post image ${idx + 1}`}
                                className="object-cover transition-transform duration-700 hover:scale-105"
                                fill={!isHero}
                                sizes={isHero ? "(max-width: 768px) 100vw, 800px" : "(max-width: 768px) 50vw, 400px"}
                                priority={idx === 0}
                              />
                              {remaining > 0 && idx === 3 && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-lg font-semibold">
                                  +{remaining}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>
              )}

              {/* Tags Section */}
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-white/70">
                {post.comments > 0 && (
                  <span className="px-2 py-1 rounded-full bg-white/10">
                    {post.comments} Comments
                  </span>
                )}
                {post.likes > 0 && (
                  <span className="px-2 py-1 rounded-full bg-white/10">
                    {post.likes} Likes
                  </span>
                )}
                {videoUrl && (
                  <span className="px-2 py-1 rounded-full bg-white/10">
                    Video
                  </span>
                )}
              </div>

              {/* Actions Section */}
              <div className="flex flex-col gap-2 md:gap-3 pt-3 md:pt-4 border-t border-white/10">
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={(e) => handleLike(e, post.id)}
                    className={`flex items-center gap-1 md:gap-2 text-sm font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-full ${
                      theme === "super-dark"
                        ? `bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-purple-400/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]`
                        : "bg-white/5 backdrop-blur-sm"
                    } transition-all duration-300 ${post.liked ? themeClasses.like : themeClasses.textMuted}`}
                  >
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={post.liked ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="w-4 h-4 md:w-5 md:h-5"
                      animate={{
                        scale: post.liked ? [1, 1.4, 1] : 1,
                        rotate: post.liked ? [0, -10, 10, 0] : 0,
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21C12 21 4 13.667 4 8.667C4 5.4 6.4 3 9.667 3C11.389 3 13 4.067 13.833 5.533C14.667 4.067 16.278 3 18 3C21.267 3 23.667 5.4 23.667 8.667C23.667 13.667 16 21 16 21H12Z"
                      />
                    </motion.svg>
                    <span>{post.likes || 0}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                      setShowCommentModal(true);
                    }}
                    className={`flex items-center gap-1 md:gap-2 text-sm font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-full ${
                      theme === "super-dark"
                        ? "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-purple-400/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        : "bg-white/5 backdrop-blur-sm"
                    } ${themeClasses.comment} transition-all duration-300`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="w-4 h-4 md:w-5 md:h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 8h10M7 12h6m5 8a9 9 0 10-9-9c0 1.52.38 2.96 1.05 4.23L7 20l4.77-2.05A9.01 9.01 0 0018 20z"
                      />
                    </svg>
                    <span>{post.comments || 0}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={(e) => toggleBookmark(e, post.id)}
                    className={`flex items-center gap-1 md:gap-2 text-sm font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-full ${
                      theme === "super-dark"
                        ? "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-purple-400/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        : "bg-white/5 backdrop-blur-sm"
                    } transition-all duration-300 ${isBookmarked ? themeClasses.accent : themeClasses.textMuted}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={isBookmarked ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="w-4 h-4 md:w-5 md:h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v18l-7-4-7 4V5z"
                      />
                    </svg>
                    <span>{isBookmarked ? "Saved" : "Save"}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={(e) => handleShare(e, post)}
                    className={`flex items-center gap-1 md:gap-2 text-sm font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-full ${
                      theme === "super-dark"
                        ? "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-purple-400/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        : "bg-white/5 backdrop-blur-sm"
                    } text-white/80 hover:text-white transition-all duration-300`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="w-4 h-4 md:w-5 md:h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M7 9l5-5m0 0l5 5m-5-5v12"
                      />
                    </svg>
                    <span>Share</span>
                  </motion.button>
                </div>
                {shareStatus[post.id] && (
                  <span className="text-xs text-white/70">
                    {shareStatus[post.id]}
                  </span>
                )}
              </div>
            </div>
          </motion.article>
        );
      })}

      {showCommentModal && selectedPost && (
        <CommentModal
          isOpen={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setSelectedPost(null);
          }}
          postId={selectedPost.id}
          postContent={selectedPost.content}
          postAuthor={selectedPost.author?.name || "Unknown"}
        />
      )}
    </div>
  );
}

function PostSkeleton({ themeClasses }: { themeClasses: ThemeClasses }) {
  return (
    <div
      className={`rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/5 shadow-inner ${themeClasses.bg}`}
    >
      <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="w-1/3 h-3 md:h-4 bg-white/20 rounded animate-pulse" />
          <div className="w-1/4 h-2 md:h-3 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2 md:space-y-3">
        <div className="w-3/4 h-3 md:h-4 bg-white/15 rounded animate-pulse" />
        <div className="w-full h-3 md:h-4 bg-white/10 rounded animate-pulse" />
        <div className="w-2/3 h-3 md:h-4 bg-white/10 rounded animate-pulse" />
      </div>
    </div>
  );
}

function EmptyState({
  themeClasses,
  fetchPosts,
}: {
  themeClasses: ThemeClasses;
  fetchPosts: () => Promise<void>;
}) {
  return (
    <div
      className={`rounded-2xl md:rounded-3xl p-6 md:p-10 text-center border border-dashed border-white/10 ${themeClasses.bg}`}
    >
      <div className="text-2xl md:text-3xl mb-3 md:mb-4">🚀</div>
      <p className={`text-base md:text-lg ${themeClasses.text} mb-2`}>
        Everything is ready for the next big story.
      </p>
      <p className={`${themeClasses.textMuted} mb-4 md:mb-6 text-sm md:text-base`}>
        Be the first to share something with the community.
      </p>
      <button
        className="px-4 py-2 md:px-6 md:py-3 rounded-full bg-white/10 text-white/90 hover:bg-white/20 transition-colors text-xs md:text-sm tracking-[0.3em]"
        onClick={fetchPosts}
      >
        Refresh Feed
      </button>
    </div>
  );
}