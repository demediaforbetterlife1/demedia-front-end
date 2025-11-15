"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { apiFetch, getAuthHeaders } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle } from "lucide-react";

type AuthorType = {
  id: number;
  name: string;
  username: string;
  profilePicture?: string | null;
};

type PostType = {
  id: number;
  content: string;
  likes: number;
  comments: number;
  liked?: boolean;
  imageUrl?: string | null;
  imageUrls?: string[];
  createdAt?: string;
  author?: AuthorType | null;
};

interface PostsProps {
  isVisible?: boolean;
  postId?: number;
}

export default function Posts({ isVisible = true, postId }: PostsProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
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

  // 🧩 جلب البوستات من الباك اند
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const endpoint = postId ? `/api/posts/${postId}` : "/api/posts";
      const res = await apiFetch(endpoint, { cache: "no-store" });

      if (!res.ok) throw new Error("Failed to fetch posts");
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
            content: p.content ?? "",
            likes: p.likes ?? p._count?.likes ?? 0,
            comments: p.comments ?? p._count?.comments ?? 0,
            liked: Boolean(p.liked || p.isLiked),
            imageUrl: p.imageUrl ?? null,
            imageUrls: p.imageUrls ?? [],
            createdAt: p.createdAt ?? p.created_at ?? null,
            author: p.author ?? p.user ?? null,
          }))
          .reverse()
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

  // ❤️ اللايك
  const handleLike = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );

    try {
      const res = await apiFetch(`/api/posts/${id}/like`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Like request failed");
      const data = await res.json();

      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, liked: data.liked ?? p.liked, likes: data.likes ?? p.likes }
            : p
        )
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // 👤 الانتقال لصفحة المستخدم (باستخدام username)
  const goToUser = (e: React.MouseEvent, author?: AuthorType | null) => {
    e.stopPropagation();
    if (!author?.username && !author?.id) return;
    // Use username if available, otherwise use id
    if (author.username) {
      router.push(`/profile/${author.username}`);
    } else if (author.id) {
      router.push(`/profile?userId=${author.id}`);
    }
  };

  // 📄 صفحة البوست
  const goToPost = (id: number) => router.push(`/posts/${id}`);

  // 💬 فتح محادثة مع المستخدم
  const handleChat = async (e: React.MouseEvent, author?: AuthorType | null) => {
    e.stopPropagation();
    if (!author?.id || !user?.id) return;
    
    if (author.id === parseInt(user.id)) {
      alert("You cannot chat with yourself!");
      return;
    }

    try {
      const response = await apiFetch("/api/chat/create-or-find", {
        method: "POST",
        headers: getAuthHeaders(user.id),
        body: JSON.stringify({ participantId: author.id })
      }, user.id);

      if (!response.ok) {
        throw new Error("Failed to create/find chat");
      }

      const chatData = await response.json();
      router.push(`/messeging/chat/${chatData.id}`);
    } catch (err) {
      console.error("Chat error:", err);
      alert("Failed to open chat. Please try again.");
    }
  };

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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto">
      {posts.map((post) => {
        const author = post.author;
        const profilePic = author?.profilePicture || "/default-avatar.png";
        const images =
          post.imageUrls && post.imageUrls.length > 0
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
            {/* 🧑‍ Header */}
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
                  {author?.name || "Unknown User"}
                </h3>
                <p className={`text-sm ${themeClasses.textMuted}`}>
                  @{author?.username ?? "user"} •{" "}
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleString()
                    : ""}
                </p>
              </div>
            </div>

            {/* 📝 Content */}
            <p
              className={`text-base mb-4 leading-relaxed ${themeClasses.text} font-light select-text`}
            >
              {post.content}
            </p>

            {/* 🖼️ Images */}
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
           {/* ❤️💬🔖 Actions */}
<div
  className="flex items-center justify-between pt-3 border-t mt-3"
  style={{ borderColor: themeClasses.accentColor + "40" }}
>
  <div className="flex items-center gap-6">
    {/* ❤️ Like */}
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.15 }}
      onClick={(e) => handleLike(e, post.id)}
      className={`flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${
        post.liked ? themeClasses.like : themeClasses.textMuted
      }`}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        fill={post.liked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="w-6 h-6"
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
      <span>{post.likes}</span>
    </motion.button>

    {/* 💬 Comment */}
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.15 }}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/posts/${post.id}#comments`);
      }}
      className={`flex items-center gap-2 text-sm font-semibold ${themeClasses.comment} transition-all duration-300`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 8h10M7 12h6m5 8a9 9 0 10-9-9c0 1.52.38 2.96 1.05 4.23L7 20l4.77-2.05A9.01 9.01 0 0018 20z"
        />
      </svg>
      <span>{post.comments}</span>
    </motion.button>

    {/* 🔖 Bookmark */}
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.15 }}
      onClick={(e) => {
        e.stopPropagation();
        // ممكن تضيف هنا دالة save لاحقًا
        alert("Bookmark feature coming soon!");
      }}
      className={`flex items-center gap-2 text-sm font-semibold ${themeClasses.textMuted} hover:${themeClasses.accent} transition-all duration-300`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v18l-7-4-7 4V5z"
        />
      </svg>
    </motion.button>

    {/* 💬 Chat */}
    {author && author.id !== parseInt(user?.id || "0") && (
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.15 }}
        onClick={(e) => handleChat(e, author)}
        className={`flex items-center gap-2 text-sm font-semibold ${themeClasses.textMuted} hover:text-green-500 transition-all duration-300`}
        title="Send message"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    )}
  </div>
</div>
          </motion.div>
        );
      })}
    </div>
  );
}