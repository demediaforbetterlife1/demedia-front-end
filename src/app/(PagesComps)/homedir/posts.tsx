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

  // 🎨 Theme Styles
  // 🎨 Theme Styles
const allThemes = {
  light: {
    bg: "bg-white shadow-md hover:shadow-lg transition-shadow",
    text: "text-gray-900",
    textMuted: "text-gray-500",
    border: "border-gray-200",
    hover: "hover:bg-gray-50",
  },
  dark: {
    bg: "bg-gray-900 shadow-lg hover:shadow-xl transition-all",
    text: "text-gray-100",
    textMuted: "text-gray-400",
    border: "border-gray-700",
    hover: "hover:bg-gray-800",
  },
  gold: {
    bg: "bg-gray-900 border border-yellow-700 shadow-gold hover:shadow-yellow-500/20 transition",
    text: "text-yellow-400",
    textMuted: "text-yellow-500",
    border: "border-yellow-700",
    hover: "hover:bg-yellow-800/20",
  },
  "super-dark": {
    bg: "bg-black border border-gray-800 shadow-xl hover:shadow-2xl transition-all",
    text: "text-white",
    textMuted: "text-gray-500",
    border: "border-gray-800",
    hover: "hover:bg-gray-900/70",
  },
  "super-light": {
    bg: "bg-white border border-gray-200 shadow-md hover:shadow-xl transition-all",
    text: "text-gray-900",
    textMuted: "text-gray-600",
    border: "border-gray-200",
    hover: "hover:bg-gray-100",
  },
} as const;

type ThemeKey = keyof typeof allThemes;
const themeClasses = allThemes[(theme as ThemeKey) || "dark"];
  // 📥 Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = postId ? `/api/posts/${postId}` : "/api/posts";
      const res = await apiFetch(endpoint);
      const data = await res.json();

      const fetched = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [data];

      setPosts(
        fetched
          .map((p: any) => ({
            id: p.id,
            content: p.content || "",
            likes: p._count?.likes ?? p.likes ?? 0,
            comments: p._count?.comments ?? p.comments ?? 0,
            liked: Boolean(p.liked || p.isLiked),
            bookmarked: Boolean(p.bookmarked || p.isBookmarked),
            imageUrl: p.imageUrl ?? null,
            imageUrls: p.imageUrls ?? [],
            createdAt: p.createdAt ?? p.created_at ?? null,
            author: p.user ?? p.author ?? null,
          }))
          .reverse()
      );
    } catch (err: any) {
      console.error("❌ Fetch error:", err);
      setError("Failed to load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) fetchPosts();
  }, [isVisible, postId]);

  // 🩶 Like Post
  const handleLike = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                liked: !p.liked,
                likes: p.liked ? p.likes - 1 : p.likes + 1,
              }
            : p
        )
      );

      const res = await apiFetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: {
          "Authorization": localStorage.getItem("token") || "",
          "user-id": localStorage.getItem("userId") || "",
        },
      });

      if (!res.ok) throw new Error("Failed to like post");
      const data = await res.json();

      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                liked: data.liked ?? p.liked,
                likes: data.likes ?? p.likes,
              }
            : p
        )
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // 👤 Navigate to user profile
  const goToUser = (e: React.MouseEvent, author: any) => {
    e.stopPropagation();
    if (!author) return;

    const username = author.username;
    const id = author.id;
    if (username) router.push(`/profile/${username}`);
    else if (id) router.push(`/profile/id/${id}`);
    else alert("User profile unavailable");
  };

  const goToPost = (id: number) => router.push(`/posts/${id}`);

  // 💡 UI
  if (!isVisible) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-b-transparent border-cyan-400"></div>
        </div>
      )}

      {!loading &&
        posts.map((post) => {
          const author = post.author || {};
          const profilePic = author.profilePicture || "/default-avatar.png";

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => goToPost(post.id)}
              className={`${themeClasses.bg} ${themeClasses.border} rounded-2xl p-5 cursor-pointer ${themeClasses.hover}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={(e) => goToUser(e, author)}
                >
                  <img
                    src={profilePic}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-cyan-400 transition"
                  />
                  <div>
                    <h3 className={`font-semibold ${themeClasses.text}`}>
                      {author.name || "Unknown User"}
                    </h3>
                    <p className={`text-sm ${themeClasses.textMuted}`}>
                      @{author.username ?? "user"}
                    </p>
                  </div>
                </div>
                <p className={`text-xs ${themeClasses.textMuted}`}>
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString()
                    : ""}
                </p>
              </div>

              {/* Content */}
              <p
                className={`text-sm mb-3 leading-relaxed ${themeClasses.text}`}
              >
                {post.content || ""}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-6">
                  <button
                    onClick={(e) => handleLike(e, post.id)}
                    className={`flex items-center transition-colors ${
                      post.liked ? "text-red-500" : themeClasses.textMuted
                    } hover:text-red-400`}
                  >
                    <span className="text-lg mr-1">
                      {post.liked ? "❤️" : "🤍"}
                    </span>
                    <span>{post.likes ?? 0}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/posts/${post.id}#comments`);
                    }}
                    className={`flex items-center hover:text-blue-400 transition-colors ${themeClasses.textMuted}`}
                  >
                    <span className="mr-1 text-lg">💬</span>
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