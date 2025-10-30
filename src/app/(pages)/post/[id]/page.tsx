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
import { useI18n } from "@/contexts/I18nContext";
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
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { showSuccess, showError } = useNotifications();

  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);

  // Theme classes
  type ThemeClasses = {
    bg: string;
    bgSecondary: string;
    bgTertiary: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    hover: string;
    shadow: string;
  };

  const getThemeClasses = (): ThemeClasses => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          bgSecondary: "bg-gray-800",
          bgTertiary: "bg-gray-700",
          text: "text-white",
          textSecondary: "text-gray-300",
          textMuted: "text-gray-400",
          border: "border-gray-700",
          hover: "hover:bg-gray-700",
          shadow: "shadow-2xl",
        };
      case "super-dark":
        return {
          bg: "bg-black",
          bgSecondary: "bg-gray-900",
          bgTertiary: "bg-gray-800",
          text: "text-white",
          textSecondary: "text-gray-200",
          textMuted: "text-gray-500",
          border: "border-gray-800",
          hover: "hover:bg-gray-800",
          shadow: "shadow-2xl",
        };
      case "light":
        return {
          bg: "bg-white",
          bgSecondary: "bg-gray-50",
          bgTertiary: "bg-gray-100",
          text: "text-gray-900",
          textSecondary: "text-gray-700",
          textMuted: "text-gray-500",
          border: "border-gray-200",
          hover: "hover:bg-gray-100",
          shadow: "shadow-lg",
        };
      case "super-light":
        return {
          bg: "bg-white",
          bgSecondary: "bg-gray-50",
          bgTertiary: "bg-gray-100",
          text: "text-black",
          textSecondary: "text-gray-800",
          textMuted: "text-gray-600",
          border: "border-gray-300",
          hover: "hover:bg-gray-50",
          shadow: "shadow-md",
        };
      case "gold":
        return {
          bg: "bg-gray-900",
          bgSecondary: "bg-yellow-900/20",
          bgTertiary: "bg-yellow-800/30",
          text: "text-yellow-400",
          textSecondary: "text-yellow-300",
          textMuted: "text-yellow-500",
          border: "border-yellow-700",
          hover: "hover:bg-yellow-800/30",
          shadow: "shadow-2xl shadow-yellow-500/20",
        };
      default:
        return {
          bg: "bg-gray-900",
          bgSecondary: "bg-gray-800",
          bgTertiary: "bg-gray-700",
          text: "text-white",
          textSecondary: "text-gray-300",
          textMuted: "text-gray-400",
          border: "border-gray-700",
          hover: "hover:bg-gray-700",
          shadow: "shadow-2xl",
        };
    }
  };

  const themeClasses = getThemeClasses();

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFetch(`/api/posts/${params.id}`);
        if (response.ok) {
          const postData = await response.json();
          setPost(postData);
        } else {
          setError("Post not found");
        }
      } catch (err: unknown) {
        console.error("Failed to fetch post:", err);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchPost();
  }, [params.id]);

  // Actions
  const handleLike = async (postId: number) => {
    if (!post) return;
    const previousLiked = post.liked;
    const previousLikes = post.likes;

    setPost({ ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 });

    try {
      const response = await apiFetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!response.ok) throw new Error("Like failed");
      const data = await response.json();
      setPost((prev) => (prev ? { ...prev, liked: data.liked, likes: data.likes } : prev));
    } catch (err) {
      console.error(err);
      setPost({ ...post, liked: previousLiked, likes: previousLikes });
      showError("Like Failed", "Failed to like post");
    }
  };

  const handleBookmark = async (postId: number) => {
    if (!post) return;
    const previousBookmarked = post.bookmarked;
    setPost({ ...post, bookmarked: !post.bookmarked });

    try {
      const response = await apiFetch(`/api/posts/${postId}/bookmark`, { method: "POST" });
      if (!response.ok) throw new Error("Bookmark failed");
      const data = await response.json();
      setPost((prev) => (prev ? { ...prev, bookmarked: data.bookmarked } : prev));
    } catch (err) {
      console.error(err);
      setPost({ ...post, bookmarked: previousBookmarked });
      showError("Bookmark Failed", "Failed to bookmark post");
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const shareData = { title: "Check out this post", text: post.content, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        showSuccess("Link Copied!", "Post link copied to clipboard");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = () => setShowCommentModal(true);

  const goToUser = (e: React.MouseEvent, username?: string) => {
    e.stopPropagation();
    if (!username) return;
    router.push(`/profile/${username}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-16 w-16 border-b-4 ${theme === "gold" ? "border-yellow-400" : "border-cyan-400"}`}></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>Post Not Found</h1>
          <p className={`${themeClasses.textMuted} mb-6`}>{error || "The post doesn't exist."}</p>
          <button onClick={() => router.push("/home")} className={`px-6 py-3 ${theme === "gold" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-cyan-500 hover:bg-cyan-600"} text-white rounded-lg transition-colors`}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${themeClasses.bgSecondary} border-b ${themeClasses.border} backdrop-blur-lg`}>
        <div className="flex items-center justify-between p-4">
          <button onClick={() => router.back()} className={`flex items-center gap-2 ${theme === "gold" ? "text-yellow-400 hover:text-yellow-300" : "text-cyan-400 hover:text-cyan-300"} transition-colors`}>
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className={`text-lg font-semibold ${themeClasses.text}`}>Post</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-2xl mx-auto p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`${themeClasses.bgSecondary} rounded-2xl ${themeClasses.shadow} p-6`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => goToUser(e, post.user?.username)}>
              <img src={post.user?.profilePicture || "/default-avatar.png"} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-gray-300" />
              <div>
                <h3 className={`font-semibold ${themeClasses.text}`}>{post.user?.name || "Unknown User"}</h3>
                <p className={`text-sm ${themeClasses.textMuted}`}>@{post.user?.username || "user"}</p>
              </div>
            </div>
            <button className={`p-2 rounded-full ${themeClasses.hover} transition-colors`}>
              <MoreHorizontal size={16} className={themeClasses.textMuted} />
            </button>
          </div>

          {/* Content */}
          <p className={`${themeClasses.textSecondary} text-lg mb-4`}>{post.content}</p>

          {/* Media */}
          {post.imageUrl && <img src={post.imageUrl} className="w-full rounded-xl max-h-96 object-cover mb-4" alt="post media" />}
          {post.videoUrl && <video src={post.videoUrl} controls className="w-full rounded-xl max-h-96 mb-4" />}

          {/* Actions */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-500">
            <div className="flex gap-6">
              <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:scale-105 ${post.liked ? "bg-pink-50 text-pink-500" : "hover:bg-pink-50 hover:text-pink-500"}`}>
                <Heart size={20} fill={post.liked ? "currentColor" : "none"} />
                <span className="text-sm font-medium">{post.likes}</span>
              </button>
              <button onClick={handleComment} className="flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:scale-105 hover:bg-blue-50 hover:text-blue-500">
                <MessageCircle size={20} />
                <span className="text-sm font-medium">{post.comments}</span>
              </button>
              <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:scale-105 hover:bg-green-50 hover:text-green-500">
                <Share2 size={20} />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
            <button onClick={() => handleBookmark(post.id)} className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:scale-105 ${post.bookmarked ? "bg-yellow-50 text-yellow-500" : "hover:bg-yellow-50 hover:text-yellow-500"}`}>
              {post.bookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && post && (
        <CommentModal
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          postId={post.id}
          postContent={post.content}
          postAuthor={post.user?.name || "Unknown User"}
        />
      )}
    </div>
  );
}