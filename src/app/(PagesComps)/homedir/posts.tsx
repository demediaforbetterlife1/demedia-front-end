"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck } from "lucide-react";
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
      case "iron":
        return {
          bg: "bg-gray-800",
          text: "text-gray-300",
          textMuted: "text-gray-400",
          border: "border-gray-600",
          hover: "hover:bg-gray-700",
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

  // 🔹 Fetch posts from database
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching posts from database...');
      const endpoint = postId ? `/api/posts/${postId}` : "/api/posts";
      const res = await apiFetch(endpoint);

      console.log('📊 Posts API response status:', res.status);
      console.log('📊 Posts API response ok:', res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Database connection error: ${res.status} ${errorText}`);
        
        // If it's a 500 error, the backend is having issues
        if (res.status === 500) {
          setError("Database connection issue. Please try again in a moment.");
          setPosts([]);
          return;
        }
        
        throw new Error(`Database error: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      console.log('✅ Posts data received from database:', data?.length || 0, 'posts');
      
      const fetchedPosts = Array.isArray(data) ? data : [data];
      
      // If we get empty data, it means no posts in database yet
      if (fetchedPosts.length === 0) {
        console.log('📝 No posts found in database');
        setPosts([]);
        setError(null); // Clear any previous errors
      } else {
        console.log('✅ Successfully loaded posts from database');
        setPosts(fetchedPosts.reverse());
        setError(null); // Clear any previous errors
      }
    } catch (err: any) {
      console.error("❌ Error loading posts from database:", err);
      
      // Provide more specific error messages
      if (err.message.includes('AbortError') || err.message.includes('aborted')) {
        setError("Request was cancelled. Please try again.");
      } else if (err.message.includes('Failed to fetch')) {
        setError("Cannot connect to database. Please check your connection and try again.");
      } else if (err.message.includes('Database')) {
        setError("Database connection failed. Please try again later.");
      } else {
        setError(err.message || "Failed to load posts from database");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) fetchPosts();
  }, [isVisible, postId]);

  // ✅ Create Post (with detailed error info)
  const handleCreatePost = async (content: string, userId: string) => {
    try {
      setError(null);

      const res = await apiFetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, userId }),
      });

      const text = await res.text();
      let backendResponse;
      try {
        backendResponse = JSON.parse(text);
      } catch {
        backendResponse = text;
      }

      if (!res.ok) {
        throw new Error(
          typeof backendResponse === "string"
            ? backendResponse
            : JSON.stringify(backendResponse, null, 2)
        );
      }

      setPosts((prev) => [backendResponse, ...prev]);
    } catch (err: any) {
      console.error("Create Post Error:", err);
      setError(err.message || "Failed to create post");
    }
  };

  // 🔘 UI
  if (!isVisible) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-400 dark:border-red-600 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-500">⚠️</span>
            <strong className="text-red-600 dark:text-red-300">Unable to load posts</strong>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button 
            onClick={() => fetchPosts()}
            className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {loading && (
        <div className={`flex justify-center items-center h-64 ${themeClasses.bg}`}>
          <div
            className={`animate-spin rounded-full h-10 w-10 border-b-2 ${
              theme === "gold" ? "border-yellow-400" : "border-cyan-400"
            }`}
          ></div>
        </div>
      )}

      {!loading && posts.length === 0 && !error && (
        <div className={`text-center py-16 ${themeClasses.textMuted}`}>
          <div className="text-6xl mb-4">📝</div>
          <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>No posts yet</h3>
          <p className="text-sm">Be the first to share something amazing!</p>
        </div>
      )}

      {posts.map((post) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${themeClasses.bg} border ${themeClasses.border} rounded-2xl p-5 iron-shimmer iron-glow post-card-hover`}
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
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
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