"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/components/NotificationProvider";
import CommentModal from "@/components/CommentModal";
import { apiFetch } from "@/lib/api";

type PostType = {
  id: number;
  content: string;
  likes: number;
  comments: number;
  liked?: boolean;
  bookmarked?: boolean;
  user?: {
    id?: number;
    name?: string;
    username?: string;
    profilePicture?: string;
  };
  createdAt?: string;
  imageUrl?: string;
  videoUrl?: string;
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { showSuccess, showError } = useNotifications();
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const themeClasses = {
    dark: {
      bg: "bg-gray-900",
      text: "text-white",
      muted: "text-gray-400",
      border: "border-gray-700",
    },
    light: {
      bg: "bg-white",
      text: "text-gray-900",
      muted: "text-gray-500",
      border: "border-gray-200",
    },
    gold: {
      bg: "bg-gradient-to-br from-yellow-900 to-black",
      text: "text-yellow-300",
      muted: "text-yellow-600",
      border: "border-yellow-600",
    },
  }[theme as "dark" | "light" | "gold"] || themeClasses.dark;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/posts/${params.id}`);
        if (!res.ok) throw new Error("Post not found");
        const data = await res.json();
        setPost(data);
      } catch (e) {
        console.error(e);
        showError("Error", "Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchPost();
  }, [params.id]);

  const handleLike = async () => {
    if (!post) return;
    setPost((p) =>
      p ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    );
    try {
      const res = await apiFetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to like post");
      const data = await res.json();
      setPost((prev) => (prev ? { ...prev, liked: data.liked, likes: data.likes } : prev));
    } catch {
      showError("Error", "Couldn't update like status");
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    setPost((p) => (p ? { ...p, bookmarked: !p.bookmarked } : p));
    try {
      await apiFetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
    } catch {
      showError("Error", "Bookmark failed");
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "DeMedia Post", url });
      else {
        await navigator.clipboard.writeText(url);
        showSuccess("Copied", "Post link copied to clipboard");
      }
    } catch {}
  };

  const goToUser = () => {
    if (post?.user?.id) router.push(`/profile?id=${post.user.id}`);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-16 w-16 border-b-4 border-cyan-400 rounded-full"></div>
      </div>
    );

  if (!post)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Post not found</p>
      </div>
    );

  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      {/* Header */}
      <div
        className={`sticky top-0 z-10 p-4 flex items-center gap-2 border-b ${themeClasses.border} bg-opacity-70 backdrop-blur-md`}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`rounded-2xl border ${themeClasses.border} p-5 shadow-lg`}
        >
          {/* 🧑‍ User */}
          <div
            className="flex items-center gap-3 cursor-pointer mb-4"
            onClick={goToUser}
          >
            <img
              src={post.user?.profilePicture || "/default-avatar.png"}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-400"
              alt="User Avatar"
            />
            <div>
              <h3 className={`font-semibold ${themeClasses.text}`}>
                {post.user?.name || "Unknown User"}
              </h3>
              <p className={`text-sm ${themeClasses.muted}`}>
                @{post.user?.username || "user"}
              </p>
            </div>
          </div>

          {/* ✍️ Content */}
          <p className={`text-lg leading-relaxed ${themeClasses.text} mb-4`}>
            {post.content}
          </p>

          {/* 🖼 Media */}
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              className="w-full rounded-xl mb-4 object-cover max-h-96"
            />
          )}
          {post.videoUrl && (
            <video
              src={post.videoUrl}
              controls
              className="w-full rounded-xl mb-4 max-h-96"
            />
          )}

          {/* ❤️💬🔖 Interaction buttons */}
          <div className="flex items-center justify-between border-t pt-4 mt-4">
            <div className="flex items-center gap-6">
              {/* Like */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className={`flex items-center gap-2 font-medium ${
                  post.liked
                    ? "text-pink-500"
                    : "text-gray-400 hover:text-pink-400"
                }`}
                onClick={handleLike}
              >
                <Heart
                  size={22}
                  fill={post.liked ? "currentColor" : "none"}
                  strokeWidth={2}
                />
                {post.likes}
              </motion.button>

              {/* Comment */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 font-medium"
                onClick={() => setShowCommentModal(true)}
              >
                <MessageCircle size={22} />
                {post.comments}
              </motion.button>

              {/* Share */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-2 text-gray-400 hover:text-green-400 font-medium"
                onClick={handleShare}
              >
                <Share2 size={22} />
              </motion.button>
            </div>

            {/* Bookmark */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className={`${
                post.bookmarked
                  ? "text-yellow-400 hover:text-yellow-300"
                  : "text-gray-400 hover:text-yellow-400"
              }`}
              onClick={handleBookmark}
            >
              {post.bookmarked ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* 💬 Comments Modal */}
      {showCommentModal && (
        <CommentModal
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          postId={post.id}
          postContent={post.content}
          postAuthor={post.user?.name || "Unknown"}
        />
      )}
    </div>
  );
}