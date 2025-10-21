"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/components/NotificationProvider";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

type PostType = {
  id: number;
  content: string;
  likes: number;
  comments: number;
  liked?: boolean;
  bookmarked?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  createdAt?: string;
  user?: {
    name?: string;
    username?: string;
    profilePicture?: string;
  };
};

// ✅ إضافة props اختيارية isVisible و postId
interface PostsProps {
  isVisible?: boolean;
  postId?: number;
}

export default function Posts({ isVisible = true, postId }: PostsProps) {
  const { theme } = useTheme();
  const { showError } = useNotifications();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Theme classes
  const themeClasses = (() => {
    switch (theme) {
      case "light":
        return {
          bg: "bg-white",
          text: "text-gray-900",
          textMuted: "text-gray-500",
          border: "border-gray-200",
          hover: "hover:bg-gray-100",
        };
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-white",
          textMuted: "text-gray-400",
          border: "border-gray-700",
          hover: "hover:bg-gray-800",
        };
      case "gold":
        return {
          bg: "bg-gray-900",
          text: "text-yellow-400",
          textMuted: "text-yellow-500",
          border: "border-yellow-700",
          hover: "hover:bg-yellow-800/30",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-white",
          textMuted: "text-gray-400",
          border: "border-gray-700",
          hover: "hover:bg-gray-800",
        };
    }
  })();

  // Fetch posts from DB
  useEffect(() => {
    if (!isVisible) return; // ⛔️ لو isVisible = false، متfetchش أي حاجة

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const endpoint = postId ? `/api/posts/${postId}` : "/api/posts";
        const res = await apiFetch(endpoint);

        if (!res.ok) throw new Error("Failed to load posts");

        const data = await res.json();
        setPosts(Array.isArray(data) ? data : [data]); // ⛔️ لو بيرجع بوست واحد خليه جوه array
      } catch (err: any) {
        console.error("Error loading posts:", err);
        setError("Failed to load posts");
        showError("Error", "Could not load posts from database");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [isVisible, postId]);

  const handleLike = async (postId: number) => {
    try {
      const res = await apiFetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, liked: data.liked, likes: data.likes } : p
        )
      );
    } catch (err) {
      console.error("Failed to like:", err);
    }
  };

  const handleBookmark = async (postId: number) => {
    try {
      const res = await apiFetch(`/api/posts/${postId}/bookmark`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, bookmarked: data.bookmarked } : p
        )
      );
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
  };

  const handleShare = async (postId: number) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const shareData = {
        title: "Check out this post on DeMedia",
        text: post.content,
        url: `${window.location.origin}/posts/${postId}`,
      };
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(shareData.url);
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  // ⛔️ لو isVisible = false رجع لا شيء
  if (!isVisible) return null;

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${themeClasses.bg}`}>
        <div
          className={`animate-spin rounded-full h-10 w-10 border-b-2 ${
            theme === "gold" ? "border-yellow-400" : "border-cyan-400"
          }`}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-10 ${themeClasses.textMuted}`}>
        Failed to load posts.
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={`text-center py-10 ${themeClasses.textMuted}`}>
        No posts yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {posts.map((post) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${themeClasses.bg} border ${themeClasses.border} rounded-2xl p-5`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className={`font-semibold ${themeClasses.text}`}>
                {post.user?.name || "Unknown User"}
              </h3>
              <p className={`text-sm ${themeClasses.textMuted}`}>
                @{post.user?.username || "user"}
              </p>
            </div>
            <p className={`text-xs ${themeClasses.textMuted}`}>
              {post.createdAt
                ? new Date(post.createdAt).toLocaleDateString()
                : ""}
            </p>
          </div>

          <div
            className={`cursor-pointer ${themeClasses.text}`}
            onClick={() => router.push(`/posts/${post.id}`)}
          >
            {post.content}
          </div>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="post"
              className="w-full rounded-xl mt-3"
            />
          )}
          {post.videoUrl && (
            <video
              src={post.videoUrl}
              controls
              className="w-full rounded-xl mt-3"
            />
          )}

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-5">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1 ${
                  post.liked
                    ? "text-pink-500"
                    : `${themeClasses.textMuted} hover:text-pink-400`
                } transition`}
              >
                <Heart size={18} fill={post.liked ? "currentColor" : "none"} />
                <span>{post.likes}</span>
              </button>

              <div
                onClick={() => router.push(`/posts/${post.id}`)}
                className={`${themeClasses.textMuted} hover:text-blue-400 cursor-pointer flex items-center gap-1`}
              >
                <MessageCircle size={18} />
                <span>{post.comments}</span>
              </div>

              <button
                onClick={() => handleShare(post.id)}
                className={`${themeClasses.textMuted} hover:text-green-400 flex items-center gap-1`}
              >
                <Share2 size={18} />
              </button>
            </div>

            <button
              onClick={() => handleBookmark(post.id)}
              className={`${
                post.bookmarked
                  ? "text-yellow-500"
                  : `${themeClasses.textMuted} hover:text-yellow-400`
              }`}
            >
              {post.bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}