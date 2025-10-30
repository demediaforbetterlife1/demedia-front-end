"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { apiFetch } from "@/lib/api";
import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";

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
  bookmarked?: boolean;
  imageUrl?: string | null;
  createdAt?: string;
  author?: AuthorType | null;
};

type ThemeKey = "light" | "dark" | "gold" | "super-dark" | "super-light";

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);

  const allThemes: Record<
    ThemeKey,
    {
      bg: string;
      text: string;
      textMuted: string;
      accent: string;
      accentColor: string;
      like: string;
      comment: string;
    }
  > = {
    light: {
      bg: "bg-white",
      text: "text-gray-900",
      textMuted: "text-gray-600",
      accent: "text-blue-600",
      accentColor: "#2563eb",
      like: "text-red-500 hover:text-red-600",
      comment: "hover:text-blue-500",
    },
    dark: {
      bg: "bg-gray-900",
      text: "text-gray-100",
      textMuted: "text-gray-400",
      accent: "text-cyan-400",
      accentColor: "#22d3ee",
      like: "text-red-400 hover:text-red-500",
      comment: "hover:text-cyan-300",
    },
    gold: {
      bg: "bg-gradient-to-br from-gray-900 to-black border border-yellow-600/40 shadow-[0_0_15px_rgba(234,179,8,0.3)]",
      text: "text-yellow-300",
      textMuted: "text-yellow-600/70",
      accent: "text-yellow-400",
      accentColor: "#fbbf24",
      like: "text-red-400 hover:text-red-300",
      comment: "hover:text-yellow-300",
    },
    "super-dark": {
      bg: "bg-black border border-gray-800 shadow-xl",
      text: "text-white",
      textMuted: "text-gray-500",
      accent: "text-purple-400",
      accentColor: "#a78bfa",
      like: "text-red-500 hover:text-red-600",
      comment: "hover:text-purple-300",
    },
    "super-light": {
      bg: "bg-white border border-gray-200 shadow-md",
      text: "text-gray-900",
      textMuted: "text-gray-600",
      accent: "text-green-600",
      accentColor: "#16a34a",
      like: "text-red-500 hover:text-red-600",
      comment: "hover:text-green-500",
    },
  };

  const themeClasses = allThemes[(theme as ThemeKey) || "dark"];

  // 🧩 Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/posts/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        setPost({
          id: data.id,
          content: data.content ?? "",
          likes: data.likes ?? data._count?.likes ?? 0,
          comments: data.comments ?? data._count?.comments ?? 0,
          liked: data.liked ?? data.isLiked ?? false,
          bookmarked: data.bookmarked ?? false,
          imageUrl: data.imageUrl ?? null,
          createdAt: data.createdAt ?? data.created_at ?? null,
          author: data.author ?? data.user ?? null,
        });
      } catch (err) {
        console.error("❌ Fetch post error:", err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    setPost((p) => p && { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 });
    try {
      await apiFetch(`/api/posts/${post.id}/like`, { method: "POST" });
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    setPost((p) => p && { ...p, bookmarked: !p.bookmarked });
    try {
      await apiFetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  const goToUser = (author?: AuthorType | null) => {
    if (!author?.id) return;
    router.push(`/profile?id=${author.id}`);
  };

  if (loading || !post)
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="animate-spin h-12 w-12 rounded-full border-4 border-b-transparent"
          style={{ borderColor: themeClasses.accentColor }}
        ></div>
      </div>
    );

  const author = post.author;
  const profilePic = author?.profilePicture || "/default-avatar.png";

  return (
    <div
      className={`${themeClasses.bg} max-w-2xl mx-auto p-6 rounded-2xl mt-10 transition-all duration-300`}
    >
      {/* 🧑 Header */}
      <div
        className="flex items-center gap-4 mb-4 cursor-pointer group"
        onClick={() => goToUser(author)}
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
            {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
          </p>
        </div>
      </div>

      {/* 📝 Content */}
      <p className={`text-base mb-4 leading-relaxed ${themeClasses.text}`}>
        {post.content}
      </p>

      {/* 🖼️ Image */}
      {post.imageUrl && (
        <motion.img
          src={post.imageUrl}
          alt="Post"
          className="rounded-xl w-full object-cover max-h-96 mb-4"
          whileHover={{ scale: 1.02 }}
        />
      )}

      {/* ❤️💬🔖 Actions */}
      <div className="flex items-center justify-around border-t pt-3 mt-3 text-sm font-medium">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
            post.liked ? themeClasses.like : themeClasses.textMuted
          } hover:scale-105`}
        >
          <Heart
            size={20}
            className={post.liked ? "fill-current" : "stroke-current"}
          />
          {post.likes}
        </button>

        <button
          onClick={() => router.push(`/posts/${post.id}#comments`)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${themeClasses.comment} hover:scale-105`}
        >
          <MessageCircle size={20} />
          {post.comments}
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
            post.bookmarked ? themeClasses.accent : themeClasses.textMuted
          } hover:scale-105`}
        >
          <Bookmark
            size={20}
            className={post.bookmarked ? "fill-current" : "stroke-current"}
          />
        </button>

        <button
          onClick={() => navigator.share?.({ url: window.location.href })}
          className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${themeClasses.textMuted} hover:scale-105`}
        >
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
}