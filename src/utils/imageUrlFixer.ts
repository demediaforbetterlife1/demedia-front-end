/**
 * Enhanced image URL handling with better fallback logic
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://demedia-backend-production.up.railway.app";

export function fixImageUrl(url: string | null | undefined): string | null {
  if (!url || url === "null" || url === "undefined" || url.trim() === "") {
    return null;
  }

  const cleanUrl = url.trim();

  // Already absolute URL
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  // Data URL
  if (cleanUrl.startsWith("data:")) {
    return cleanUrl;
  }

  // Local assets
  if (cleanUrl.startsWith("/images/") || cleanUrl.startsWith("/assets/")) {
    return cleanUrl;
  }

  // Backend uploads
  if (cleanUrl.startsWith("/uploads/") || cleanUrl.startsWith("uploads/")) {
    const path = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
    return `${BACKEND_URL}${path}`;
  }

  // Any other relative path - assume it's on backend
  const path = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  return `${BACKEND_URL}${path}`;
}

export function getImageWithFallback(
  src: string | null | undefined,
  fallback: string = "/images/default-post.svg"
): string {
  const fixed = fixImageUrl(src);
  return fixed || fallback;
}