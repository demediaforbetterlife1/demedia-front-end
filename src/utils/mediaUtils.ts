/**
 * Utility functions for handling media URLs and validation
 */

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://demedia-backend.fly.dev';

const needsPrefix = (url: string) => {
  return url && !url.startsWith("http") && !url.startsWith("data:");
};

export function ensureAbsoluteMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (!needsPrefix(url)) return url;
  // If it's a local upload, return as is (just ensure it starts with /)
  if (url.startsWith('/local-uploads') || url.startsWith('local-uploads')) {
    return url.startsWith('/') ? url : `/${url}`;
  }
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `${BACKEND_URL}${normalized}`;
}

export function appendCacheBuster(url: string): string {
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${Date.now()}`;
}

/**
 * Validates and normalizes a media URL
 */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
    return null;
  }

  const cleanUrl = url.trim();

  // If it's already a full URL, return as is
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  // If it's a local upload, return as is
  if (cleanUrl.startsWith('/local-uploads') || cleanUrl.startsWith('local-uploads')) {
    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  }

  // If it starts with /uploads, prepend the backend URL
  if (cleanUrl.startsWith('/uploads')) {
    return `${BACKEND_URL}${cleanUrl}`;
  }

  // If it's a relative path starting with /, treat it as a local asset
  if (cleanUrl.startsWith('/')) {
    return cleanUrl;
  }

  // If it doesn't start with /, assume it's a relative path from uploads
  return `${BACKEND_URL}/uploads/${cleanUrl}`;
}

/**
 * Checks if a URL is likely to be an image
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * Checks if a URL is likely to be a video
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * Gets the appropriate fallback image based on context
 */
export function getFallbackImage(context: 'profile' | 'post' | 'cover' | 'default' = 'default'): string {
  switch (context) {
    case 'profile':
      return '/images/default-avatar.svg';
    case 'cover':
      return '/images/default-cover.svg';
    case 'post':
      return '/images/default-post.svg';
    default:
      return '/images/default-placeholder.svg';
  }
}

/**
 * Creates a media URL with error handling
 */
export function createMediaUrl(
  url: string | null | undefined,
  fallbackContext: 'profile' | 'post' | 'cover' | 'default' = 'default'
): string {
  const normalizedUrl = normalizeMediaUrl(url);
  return normalizedUrl || getFallbackImage(fallbackContext);
}
