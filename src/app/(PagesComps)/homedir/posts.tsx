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

  // 🔹 Fetch posts
  const fetchPosts = async () => {
  try {
    setLoading(true);
    setError(null);

    const endpoint = postId ? `/api/posts/${postId}` : "/api/posts";
    const res = await apiFetch(endpoint);

    // ✅ جربنا نحصل على نص الخطأ من السيرفر
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server error: ${res.status} ${errorText}`);
    }

    const data = await res.json();

    // 🔧 تأكد أن البيانات Array
    const fetchedPosts = Array.isArray(data) ? data : [data];
    setPosts(fetchedPosts.reverse());
  } catch (err: any) {
    console.error("Error loading posts:", err);
    setError(err.message || "Failed to load posts");
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    if (isVisible) fetchPosts();
  }, [isVisible, postId]);

  // ✅ Handle creating a post dynamically
  const handleCreatePost = async (content: string, userId: string) => {
    try {
      setError(null);
      const res = await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content, userId }),
        headers: { "Content-Type": "application/json" },
      });

      const text = await res.text();
      let backendResponse;
      try { backendResponse = JSON.parse(text); } catch { backendResponse = text; }

      if (!res.ok) {
        throw new Error(JSON.stringify(backendResponse));
      }

      // Add the new post to the list
      setPosts((prev) => [backendResponse, ...prev]);
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    }
  };

  // 🔘 UI
  if (!isVisible) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      {error && (
        <div className="bg-red-100 text-red-800 border border-red-400 p-3 rounded mb-4">
          <strong>Error:</strong> {error}
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
        <div className={`text-center py-10 ${themeClasses.textMuted}`}>
          No posts yet.
        </div>
      )}

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