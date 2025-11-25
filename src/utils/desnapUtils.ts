import { ensureAbsoluteMediaUrl } from "./mediaUtils";
import { DeSnap } from "@/types/desnap";

export const normalizeDeSnap = (deSnap: any): DeSnap | null => {
  if (!deSnap) return null;

  const author = deSnap.author || deSnap.user || {
    id: deSnap.userId || 0,
    name: "Unknown",
    username: "unknown",
  };

  return {
    ...deSnap,
    content: ensureAbsoluteMediaUrl(deSnap.content) || deSnap.content || "",
    thumbnail: ensureAbsoluteMediaUrl(deSnap.thumbnail) || deSnap.thumbnail || null,
    author,
    userId: deSnap.userId || author.id || 0,
    likes: deSnap.likes ?? deSnap._count?.likes ?? 0,
    comments: deSnap.comments ?? deSnap._count?.comments ?? 0,
    views: deSnap.views ?? 0,
    duration: deSnap.duration ?? 0,
    isLiked: Boolean(deSnap.isLiked || deSnap.liked),
    isBookmarked: Boolean(deSnap.isBookmarked || deSnap.bookmarked),
    createdAt: deSnap.createdAt || new Date().toISOString(),
    expiresAt: deSnap.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default 24 hours from now
    visibility: deSnap.visibility || 'public',
  };
};


