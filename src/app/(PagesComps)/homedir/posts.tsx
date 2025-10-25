"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
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

interface PostsProps {
  isVisible?: boolean;
  postId?: number;
}

export default function Posts({ isVisible = true, postId }: PostsProps) {
  const { theme } = useTheme();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 🎨 Theme styles
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


  // 🧠 Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = postId ? `/api/posts/${postId}` : "/api/posts";
      const res = await apiFetch(endpoint);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to load posts: ${res.status} ${text}`);
      }

      const data = await res.json();
      const fetchedPosts = Array.isArray(data) ? data : [data];

      setPosts(fetchedPosts.reverse());
      setError(null);
    } catch (err: any) {
      console.error("❌ Error loading posts:", err);
      setError(err.message || "Failed to load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) fetchPosts();
  }, [isVisible, postId]);

  // 🧩 Create post handler
  const handleCreatePost = async (content: string, userId: string) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    
      const text = await res.text();
    
      let data;
      try {
        data = JSON.parse(text);
        setPosts((prev) => [data, ...prev]);
      } catch (e) {
        console.error("❌ JSON Parse Error:", e);
        setError("Invalid server response");
      }
    
    } catch (err: any) {
      console.error("❌ Create post error:", err);
      setError(err.message || "Failed to create post");
    }
    
      
  };

  // 🖼️ UI
  if (!isVisible) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Error UI */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-400 dark:border-red-600 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span>⚠️</span>
            <strong className="text-red-600 dark:text-red-300">
              {error.includes("create")
                ? "Failed to create post"
                : "Unable to load posts"}
            </strong>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className={`flex justify-center items-center h-64 ${themeClasses.bg}`}>
          <div
            className={`animate-spin rounded-full h-10 w-10 border-b-2 ${
              theme === "gold" ? "border-yellow-400" : "border-cyan-400"
            }`}
          ></div>
        </div>
      )}

      {/* No Posts */}
      {!loading && posts.length === 0 && !error && (
        <div className={`text-center py-16 ${themeClasses.textMuted}`}>
          <div className="text-6xl mb-4">📝</div>
          <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
            No posts yet
          </h3>
          <p className="text-sm">Be the first to share something amazing!</p>
        </div>
      )}

      {/* Posts List */}
      {!loading &&
        posts.map((post) => (
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
          </motion.div>
        ))}
    </div>
  );
}