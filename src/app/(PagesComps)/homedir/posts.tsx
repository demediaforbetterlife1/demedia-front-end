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
  imageUrls?: string[];
  createdAt?: string;
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

  // 🎨 الثيمات
  const allThemes = {
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
      bg: "bg-black/95 backdrop-blur-md border border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300",
      text: "text-white",
      textMuted: "text-gray-500",
      accent: "text-purple-400",
      accentColor: "#a78bfa",
      like: "text-red-500 hover:text-red-600",
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
  } as const;

  type ThemeKey = keyof typeof allThemes;
  const themeClasses = allThemes[(theme as ThemeKey) || "dark"];

  // 🧩 جلب البوستات
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const endpoint = postId ? `/api/posts/${postId}` : "/api/posts";
      const res = await apiFetch(endpoint, { cache: "no-store" });
      const data = await res.json();

      const fetched = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [data];

      setPosts(
        fetched.map((p: any) => ({
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
        })).reverse()
      );
    } catch (err) {
      console.error("❌ Fetch posts error:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) fetchPosts();
  }, [isVisible, postId]);

  // ❤️ التعامل مع اللايك
  const handleLike = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
            : p
        )
      );

      const res = await apiFetch(`/api/posts/${id}/like`, {
        method: "POST",
        cache: "no-store",
      });

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
            : p
        )
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // 👤 الذهاب لصفحة المستخدم
  const goToUser = (e: React.MouseEvent, author: any) => {
    e.stopPropagation();
    if (!author) return;
    const username = author.username;
    const id = author.id;
    if (username) router.push(`/profile/${username}`);
    else if (id) router.push(`/profile/id/${id}`);
  };

  // 📄 الذهاب لصفحة البوست
  const goToPost = (id: number) => router.push(`/posts/${id}`);

  // 🌀 واجهة التحميل
  if (!isVisible) return null;
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="animate-spin h-12 w-12 rounded-full border-4 border-b-transparent"
          style={{ borderColor: themeClasses.accentColor }}
        ></div>
      </div>
    );

  // 🧱 عرض البوستات
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto">
      {posts.map((post) => {
        const author = post.author || {};
        const profilePic = author.profilePicture || "/default-avatar.png";
        const images =
  Array.isArray(post.imageUrls) && post.imageUrls.length > 0
    ? post.imageUrls
    : post.imageUrl
    ? [post.imageUrl]
    : [];

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => goToPost(post.id)}
            className={`${themeClasses.bg} rounded-2xl p-6 cursor-pointer overflow-hidden`}
          >
            {/* Header */}
            <div
              className="flex items-center gap-4 mb-4 cursor-pointer group"
              onClick={(e) => goToUser(e, author)}
            >
              <img
                src={profilePic}
                alt="User avatar"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-2 transition-all duration-300"
                style={{ ["--tw-ring-color" as any]: themeClasses.accentColor }}
              />
              <div>
                <h3 className={`font-bold text-lg ${themeClasses.text}`}>
                  {author.name || "Unknown User"}
                </h3>
                <p className={`text-sm ${themeClasses.textMuted}`}>
                  @{author.username ?? "user"} •{" "}
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleString()
                    : ""}
                </p>
              </div>
            </div>

            {/* Content */}
            <p
              className={`text-base mb-4 leading-relaxed ${themeClasses.text} font-light select-text`}
            >
              {post.content}
            </p>

            {/* Images */}
            {images.length > 0 && (
              <div className="mb-4 rounded-xl overflow-hidden">
                {images.length === 1 ? (
                  <img
                    src={images[0]}
                    alt="Post image"
                    className="w-full h-auto object-cover max-h-96"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Post image ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div
              className="flex items-center justify-between pt-2 border-t"
              style={{ borderColor: themeClasses.accentColor + "40" }}
            >
              <div className="flex items-center gap-6">
                <button
                  onClick={(e) => handleLike(e, post.id)}
                  className={`flex items-center gap-1 text-sm font-medium ${post.liked ? themeClasses.like : themeClasses.textMuted}`}
                >
                  <span className="text-xl">
                    {post.liked ? "❤️" : "🤍"}
                  </span>
                  {post.likes}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/posts/${post.id}#comments`);
                  }}
                  className={`flex items-center gap-1 text-sm font-medium ${themeClasses.comment}`}
                >
                  💬 {post.comments}
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}