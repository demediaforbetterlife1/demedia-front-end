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
      .filter((u): u is string => Boolean(u && typeof u === 'string' && u.trim().length > 0));
  }

  if (typeof input === "string") {
    return [input];
  }

  return [];
};

export const normalizePost = (post: any) => {
  if (!post) return null;

  // Helper to detect placeholder-y images we don't want to show if real images exist
  const isPlaceholder = (url?: string | null) => {
    if (!url) return true;
    const u = url.toLowerCase();
    return (
      u.includes('/uploads/placeholder.png') ||
      u.endsWith('/assets/images/default-post.svg') ||
      u.endsWith('/images/default-post.svg') ||
      u.endsWith('/images/default-placeholder.svg')
    );
  };

  // Gather possible image fields coming from different backend shapes
  const imgs = extractUrls(post.images);
  const mediaImgs = extractUrls(post.media);
  const imageUrls = extractUrls(post.imageUrls);
  const photos = extractUrls(post.photos);
  const attachments = extractUrls(post.attachments);
  const mediaUrls = extractUrls(post.mediaUrls);

  // Choose first non-empty source array (ordered by most explicit/common first)
  const imagesFromPost = [imageUrls, photos, imgs, mediaUrls, mediaImgs, attachments]
    .find(arr => Array.isArray(arr) && arr.length > 0) || [];

  console.log('normalizePost - images found:', {
    postId: post.id,
    imageUrls,
    photos,
    imgs,
    imagesFromPost,
    rawImageUrl: post.imageUrl
  });

  // Normalize and drop placeholders
  const formattedImages = imagesFromPost
    .map((url) => {
      // Don't normalize Base64 data URLs - keep them as-is
      if (url.startsWith('data:image/')) {
        console.log('normalizePost - keeping Base64 data URL');
        return url;
      }
      
      // Don't normalize local-photo:// URLs - keep them as-is
      if (url.startsWith('local-photo://')) {
        console.log('normalizePost - keeping local photo URL:', url);
        return url;
      }
      
      const normalized = ensureAbsoluteMediaUrl(url);
      console.log('normalizePost - normalizing image:', url, '->', normalized);
      return normalized || url;
    })
    .filter((u) => !!u && !isPlaceholder(u)) as string[];

  // Compute primary image preferring explicit fields, but skip placeholders
  const explicitCandidates = [post.imageUrl, post.coverImage, post.thumbnail, post.primaryImage]
    .filter((u) => !!u && !isPlaceholder(u));
  const primaryCandidate = explicitCandidates[0] || formattedImages[0] || post.media?.[0]?.url || null;
  
  // Don't normalize Base64 data URLs or local-photo:// URLs
  const primaryImage = (primaryCandidate?.startsWith('data:image/') || primaryCandidate?.startsWith('local-photo://'))
    ? primaryCandidate 
    : (ensureAbsoluteMediaUrl(primaryCandidate) || null);

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
    likes: post.likes ?? post.likesCount ?? 0,
    comments: post.comments ?? post.commentsCount ?? 0,
    liked: Boolean(post.liked || post.isLiked),
    bookmarked: Boolean(post.bookmarked || post.isBookmarked),
    createdAt: post.createdAt || post.created_at || new Date().toISOString(),
    author: post.author || post.user || post.owner || null,
  };
};

