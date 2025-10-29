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
        const text = await res.text();
        throw new Error(`Failed to load posts: ${res.status} ${text}`);
      }

      const data = await res.json();
      const fetched = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [data];

      // Ensure posts have defaults to avoid undefined errors
      const normalized = fetched.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content || "",
        likes: typeof p.likes === "number" ? p.likes : p._count?.likes ?? 0,
        comments: typeof p.comments === "number" ? p.comments : p._count?.comments ?? 0,
        liked: typeof p.isLiked === "boolean" ? p.isLiked : Boolean(p.liked),
        bookmarked: Boolean(p.isBookmarked),
        imageUrl: p.imageUrl ?? null,
        imageUrls: p.imageUrls ?? p.imageUrls ?? [],
        videoUrl: p.videoUrl ?? null,
        createdAt: p.createdAt ?? p.created_at ?? null,
        user: p.user ?? p.author ?? p.owner ?? null,
        author: p.author ?? p.user ?? null,
      }));

      setPosts(normalized.reverse());
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

  // 🩶 Handle Like (optimistic + use server response if provided)
  const handleLike = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation(); // 🛑 prevent parent navigation
    try {
      // optimistic update: flip immediately
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: !p.liked,
                likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1,
              }
            : p
        )
      );

      const res = await apiFetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        // rollback optimistic if server failed
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  liked: !p.liked,
                  likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1,
                }
              : p
          )
        );
        const text = await res.text().catch(() => "");
        throw new Error(text || `Like failed (${res.status})`);
      }

      // use server's canonical response if provided
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (data && (typeof data.liked === "boolean" || typeof data.likes === "number")) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  liked: typeof data.liked === "boolean" ? data.liked : p.liked,
                  likes: typeof data.likes === "number" ? data.likes : p.likes,
                }
              : p
          )
        );
      }
    } catch (err: any) {
      console.error("❌ Like error:", err);
      // optionally show user-friendly message
      // alert(err.message || "Failed to like post");
    }
  };

  // 🧑‍💻 Navigate to user profile (try username, fallback to id, otherwise notify)
  const goToUser = (e: React.MouseEvent, author: any) => {
    e.stopPropagation();
    if (!author) {
      // nothing to open
      return;
    }
    const username = author.username;
    const id = author.id;

    try {
      if (username && username !== "unknown") {
        router.push(`/users/${encodeURIComponent(username)}`);
      } else if (id) {
        // fallback route — adjust if your app uses a different path for id-based profile
        router.push(`/users/id/${id}`);
      } else {
        // no way to open profile
        // you can replace alert with a toast in your UI system
        alert("Profile unavailable");
      }
    } catch (err) {
      console.error("Navigation error:", err);
      alert("Unable to open profile");
    }
  };

  // 💬 Navigate to post details
  const goToPost = (id: number) => {
    try {
      router.push(`/posts/${id}`);
    } catch (err) {
      console.error("Navigation error:", err);
    }
  };

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
          const author = post.user || post.author || null;
          const profilePic = author?.profilePicture || "/default-avatar.png";
          const username = author?.username ?? null;

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
                  onClick={(e) => goToUser(e, author)}
                  role="button"
                  aria-label={author?.username ? `Open ${author.username} profile` : "Open profile"}
                >
                  <img
                    src={profilePic}
                    alt={author?.name ? `${author.name} avatar` : "Profile"}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                    }}
                  />
                  <div>
                    <h3 className={`font-semibold ${themeClasses.text}`}>
                      {author?.name || "Unknown User"}
                    </h3>
                    <p className={`text-sm ${themeClasses.textMuted}`}>
                      @{username ?? "user"}
                    </p>
                  </div>
                </div>
                <p className={`text-xs ${themeClasses.textMuted}`}>
                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
                </p>
              </div>

              {/* 📝 Post Content */}
              <p className={`text-sm mb-3 ${themeClasses.text}`}>{post.content || ""}</p>

              {/* ❤️ Like & 💬 Comment */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => handleLike(e, post.id)}
                    className="flex items-center hover:text-red-500 transition-colors"
                    aria-pressed={post.liked ? "true" : "false"}
                    aria-label={post.liked ? "Unlike" : "Like"}
                  >
                    <span className="mr-1" aria-hidden>
                      {post.liked ? "❤️" : "🤍"}
                    </span>
                    <span>{post.likes ?? 0}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/posts/${post.id}#comments`);
                    }}
                    className="flex items-center hover:text-blue-500 transition-colors"
                  >
                    <span className="mr-1">💬</span>
                    <span>{post.comments ?? 0}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
    </div>
  );
}