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
    name?: string;
    username?: string;
    profilePicture?: string;
  };
  author?: {
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
      let fetchedPosts;

      if (Array.isArray(data)) {
        fetchedPosts = data;
      } else if (data.data && Array.isArray(data.data)) {
        fetchedPosts = data.data;
      } else {
        fetchedPosts = [data];
      }

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

  useEffect(() => {
    const handlePostCreated = () => {
      setTimeout(() => {
        fetchPosts();
      }, 1000);
    };
    window.addEventListener("post:created", handlePostCreated);
    return () => window.removeEventListener("post:created", handlePostCreated);
  }, []);

  useEffect(() => {
    const handleFocus = () => fetchPosts();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleCreatePost = async (content: string, userId: string) => {
    try {
      if (!content.trim()) throw new Error("Post content cannot be empty.");
      if (!userId) throw new Error("Missing user ID.");

      setError(null);

      const res = await apiFetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, userId }),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error("❌ Failed to create post:", text);
        throw new Error(text || `Request failed with ${res.status}`);
      }

      let data: any;
      try {
        data = JSON.parse(text);
        setPosts((prev) => [data, ...prev]);
      } catch (e) {
        console.error("❌ JSON Parse Error:", e);
        setError("Invalid server response");
      }
    } catch (err: any) {
      setError("true");
      console.log(`something went wrong: ${err}`);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const res = await apiFetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to like post");

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
      console.error("Like error:", err);
    }
  };

  // 🖼️ UI
  if (!isVisible) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
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
          <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
            No posts yet
          </h3>
          <p className="text-sm mb-4">Be the first to share something amazing!</p>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            🔄 Refresh Posts
          </button>
        </div>
      )}

      {!loading &&
        posts.map((post) => {
          const profilePic =
            post.user?.profilePicture || post.author?.profilePicture || "/default-avatar.png";

          const displayName =
            post.user?.name || post.author?.name || "Anonymous";

          const username =
            post.user?.username || post.author?.username || "unknown";

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`${themeClasses.bg} border ${themeClasses.border} rounded-2xl p-5`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className={`font-semibold ${themeClasses.text}`}>
                      {displayName}
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

              <div
                className={`cursor-pointer ${themeClasses.text}`}
                onClick={() => router.push(`/posts/${post.id}`)}
              >
                {post.title && (
                  <h3 className={`font-semibold text-lg mb-2 ${themeClasses.text}`}>
                    {post.title}
                  </h3>
                )}

                {post.content && (
                  <p className="mb-3 whitespace-pre-wrap">{post.content}</p>
                )}

                {post.imageUrls && post.imageUrls.length > 0 && (
                  <div className="mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {post.imageUrls.slice(0, 4).map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                      {post.imageUrls.length > 4 && (
                        <div className="relative">
                          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500">
                              +{post.imageUrls.length - 4} more
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!post.imageUrls && post.imageUrl && (
                  <div className="mb-3">
                    <img
                      src={post.imageUrl}
                      alt="Post image"
                      className="w-full h-64 object-cover rounded-lg"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {post.videoUrl && (
                  <div className="mb-3">
                    <video
                      src={post.videoUrl}
                      controls
                      className="w-full h-64 rounded-lg"
                      poster={post.imageUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-3">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center hover:text-red-500 transition-colors"
                    >
                      <span className="mr-1">{post.liked ? "❤️" : "🤍"}</span>
                      {post.likes || 0}
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/posts/${post.id}#comments`)
                      }
                      className="flex items-center hover:text-blue-500 transition-colors"
                    >
                      <span className="mr-1">💬</span>
                      {post.comments || 0}
                    </button>
                  </div>

                  <span>
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
    </div>
  );
}