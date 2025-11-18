import { ensureAbsoluteMediaUrl } from "./mediaUtils";

const extractUrls = (input?: any): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry?.url) return entry.url;
        if (entry?.imageUrl) return entry.imageUrl;
        return null;
      })
      .filter(Boolean) as string[];
  }

  if (typeof input === "string") {
    return [input];
  }

  return [];
};

export const normalizePost = (post: any) => {
  if (!post) return null;

  const imagesFromPost =
    extractUrls(post.images) ||
    extractUrls(post.media) ||
    extractUrls(post.imageUrls);

  const formattedImages = imagesFromPost
    .map((url) => ensureAbsoluteMediaUrl(url) || url)
    .filter(Boolean);

  const primaryImage =
    ensureAbsoluteMediaUrl(
      post.imageUrl ||
        post.coverImage ||
        post.thumbnail ||
        formattedImages[0] ||
        post.media?.[0]?.url
    ) || null;

  const videoUrl =
    ensureAbsoluteMediaUrl(
      post.videoUrl ||
        post.video?.url ||
        post.media?.find?.((item: any) => item?.type === "video")?.url
    ) || null;

  return {
    ...post,
    title: post.title ?? post.heading ?? "",
    content: post.content ?? post.caption ?? post.body ?? "",
    imageUrl: primaryImage,
    images: formattedImages,
    videoUrl,
    liked: Boolean(post.liked || post.isLiked),
    bookmarked: Boolean(post.bookmarked || post.isBookmarked),
    createdAt: post.createdAt || post.created_at || new Date().toISOString(),
    author: post.author || post.user || post.owner || null,
  };
};

