"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

type PostType = {
  id: number;
  title?: string;
  content: string;
  likes: number;
  comments: number;
  liked?: boolean;
  bookmarked?: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  createdAt?: string;
  user?: {
    id?: number;
    name?: string;
    username?: string;
    profilePicture?: string;
  };
  author?: {
    id?: number;
    name?: string;
    username?: string;
    profilePicture?: string;
  };
};

interface PostsProps {
  isVisible?: boolean;
  postId?: number;
}

export default function Posts({ isVisible = true, postId }: PostsProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎨 Theme setup
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
          bg: "bg-gray-900 gold-glow",
          text: "text-yellow-400",
          textMuted: "text-yellow-500",
          border: "border-yellow-700",
          hover: "hover:bg-yellow-800/30 gold-shimmer",
        };
      case "super-dark":
        return {
          bg: "bg-black/90 super-dark-glow",
          text: "text-white",
          textMuted: "text-gray-500",
          border: "border-gray-800",
          hover: "hover:bg-gray-900/80",
        };
      case "super-light":
        return {
          bg: "bg-white/90 super-light-glow",
          text: "text-gray-900",
          textMuted: "text-gray-600",
          border: "border-gray-200",
          hover: "hover:bg-gray-100/70",
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

  // 📥 Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = postId ? `/api/posts/${postId}` : "/api/posts";
      const res = await apiFetch(endpoint);

      if (!res.ok) {
        throw new Error(`Failed to load posts: ${res.status}`);
      }

      const data = await res.json();
      const fetched = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [data];

      setPosts(fetched.reverse());
    } catch (err: any) {
      console.error("❌ Fetch error:", err);
      setError(err.message || "Failed to load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // 🌀 Load posts
  useEffect(() => {
    if (isVisible) fetchPosts();
  }, [isVisible, postId]);

  useEffect(() => {
    const handleRefresh = () => setTimeout(fetchPosts, 800);
    window.addEventListener("post:created", handleRefresh);
    return () => window.removeEventListener("post:created", handleRefresh);
  }, []);

  // 🩶 Handle Like
  const handleLike = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation(); // 🛑 prevent navigation
    try {
      const res = await apiFetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Like request failed");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: !p.liked,
                likes: p.liked ? p.likes - 1 : p.likes + 1,
              }
            : p
        )
      );
    } catch (err) {
      console.error("❌ Like error:", err);
    }
  };

  // 🧑‍💻 Navigate to user profile
  const goToUser = (e: React.MouseEvent, username?: string) => {
    e.stopPropagation();
    if (!username) return;
    router.push(`/users/${username}`);
  };

  // 💬 Navigate to post details
  const goToPost = (id: number) => router.push(`/posts/${id}`);

  // 💡 UI
  if (!isVisible) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* ⚠️ Error */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-400 dark:border-red-600 p-4 rounded-lg">
          <strong className="block mb-2">⚠️ {error}</strong>
          <button
            onClick={fetchPosts}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ⏳ Loading */}
      {loading && (
        <div className={`flex justify-center items-center h-64 ${themeClasses.bg}`}>
          <div
            className={`animate-spin rounded-full h-10 w-10 border-b-2 ${
              theme === "gold" ? "border-yellow-400" : "border-cyan-400"
            }`}
          ></div>
        </div>
      )}

      {/* 📭 Empty */}
      {!loading && posts.length === 0 && !error && (
        <div className={`text-center py-16 ${themeClasses.textMuted}`}>
          <div className="text-6xl mb-4">📝</div>
          <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
            No posts yet
          </h3>
          <p className="text-sm mb-4">Be the first to share something!</p>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      )}

      {/* 🧾 Posts List */}
      {!loading &&
        posts.map((post) => {
          const author = post.user || post.author;
          const profilePic = author?.profilePicture || "/default-avatar.png";
          const username = author?.username || "unknown";

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => goToPost(post.id)}
              className={`${themeClasses.bg} border ${themeClasses.border} rounded-2xl p-5 cursor-pointer ${themeClasses.hover}`}
            >
              {/* 👤 User Info */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={(e) => goToUser(e, username)}
                >
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className={`font-semibold ${themeClasses.text}`}>
                      {author?.name || "Unknown User"}
                    </h3>
                    <p className={`text-sm ${themeClasses.textMuted}`}>
                      @{username}
                    </p>
                  </div>
                </div>
                <p className={`text-xs ${themeClasses.textMuted}`}>
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString()
                    : ""}
                </p>
              </div>

              {/* 📝 Post Content */}
              <p className={`text-sm mb-3 ${themeClasses.text}`}>
                {post.content || ""}
              </p>

              {/* ❤️ Like & 💬 Comment */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => handleLike(e, post.id)}
                    className="flex items-center hover:text-red-500 transition-colors"
                  >
                    <span className="mr-1">{post.liked ? "❤️" : "🤍"}</span>
                    {post.likes || 0}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/posts/${post.id}#comments`);
                    }}
                    className="flex items-center hover:text-blue-500 transition-colors"
                  >
                    <span className="mr-1">💬</span>
                    {post.comments || 0}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
    </div>
  );
}