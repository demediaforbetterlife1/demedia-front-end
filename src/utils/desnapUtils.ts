import { ensureAbsoluteMediaUrl } from "./mediaUtils";

export const normalizeDeSnap = (deSnap: any) => {
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
  };
};

