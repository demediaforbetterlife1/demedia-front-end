/**
 * Utility functions for handling media URLs and validation
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://demedia-backend.fly.dev";

/**
 * Checks if a URL is reachable
 */
export async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      mode: "cors",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Validates that a URL string is actually usable
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (typeof url !== "string") return false;
  if (url === "null" || url === "undefined") return false;
  if (url.trim() === "") return false;

  // Check for obviously broken URLs
  const lower = url.toLowerCase();
  if (lower === "n/a" || lower === "none" || lower === "unknown") return false;

  return true;
}

const needsPrefix = (url: string) => {
  return url && !url.startsWith("http") && !url.startsWith("data:");
};

export function ensureAbsoluteMediaUrl(url?: string | null): string | null {
  // Early validation
  if (!isValidUrl(url)) {
    return null;
  }

  const cleanUrl = url!.trim();

  // Already absolute (http/https or data URL)
  if (!needsPrefix(cleanUrl)) {
    return cleanUrl;
  }

  // If it's a local upload, return as is (just ensure it starts with /)
  if (
    cleanUrl.startsWith("/local-uploads") ||
    cleanUrl.startsWith("local-uploads")
  ) {
    return cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  }

  // If it's a local asset (images, icons, etc from public folder), keep it local
  if (
    cleanUrl.startsWith("/images/") ||
    cleanUrl.startsWith("/icons/") ||
    cleanUrl.startsWith("/assets/")
  ) {
    return cleanUrl;
  }

  // For uploads path, prepend backend URL
  if (cleanUrl.startsWith("/uploads/") || cleanUrl.startsWith("uploads/")) {
    const normalized = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
    return `${BACKEND_URL}${normalized}`;
  }

  // For any other relative path without a clear indicator, assume it's from backend uploads
  const normalized = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  return `${BACKEND_URL}${normalized}`;
}

/**
 * Enhanced video URL processing with multiple fallback options
 */
export function getVideoUrlWithFallbacks(url?: string | null): string[] {
  if (!isValidUrl(url)) {
    return [];
  }

  const cleanUrl = url!.trim();
  const urls: string[] = [];

  // Add the processed URL first
  const processedUrl = ensureAbsoluteMediaUrl(cleanUrl);
  if (processedUrl) {
    urls.push(processedUrl);
  }

  // If not already absolute, try different combinations
  if (!cleanUrl.startsWith("http")) {
    // Try with backend URL
    if (!cleanUrl.startsWith("/")) {
      urls.push(`${BACKEND_URL}/${cleanUrl}`);
      urls.push(`${BACKEND_URL}/uploads/${cleanUrl}`);
    } else {
      urls.push(`${BACKEND_URL}${cleanUrl}`);
    }

    // Try without backend URL (for local development)
    urls.push(cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`);
  }

  // Add cache buster versions
  const cacheBustedUrls = urls.map((u) => appendCacheBuster(u));

  // Return unique URLs
  return [...new Set([...urls, ...cacheBustedUrls])];
}

export function appendCacheBuster(url: string): string {
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${Date.now()}`;
}

/**
 * Validates and normalizes a media URL
 */
export function normalizeMediaUrl(
  url: string | null | undefined,
): string | null {
  if (!url || url === "null" || url === "undefined" || url.trim() === "") {
    return null;
  }

  const cleanUrl = url.trim();

  // If it's already a full URL, return as is
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  // If it's a local upload, return as is
  if (
    cleanUrl.startsWith("/local-uploads") ||
    cleanUrl.startsWith("local-uploads")
  ) {
    return cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  }

  // If it starts with /uploads, prepend the backend URL
  if (cleanUrl.startsWith("/uploads")) {
    return `${BACKEND_URL}${cleanUrl}`;
  }

  // If it's a relative path starting with /, treat it as a local asset
  if (cleanUrl.startsWith("/")) {
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
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
  ];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some((ext) => lowerUrl.includes(ext));
}

/**
 * Checks if a URL is likely to be a video
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const videoExtensions = [
    ".mp4",
    ".webm",
    ".ogg",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
  ];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext));
}

/**
 * Gets the appropriate fallback image based on context
 */
export function getFallbackImage(
  context: "profile" | "post" | "cover" | "default" = "default",
): string {
  switch (context) {
    case "profile":
      return "/images/default-avatar.svg";
    case "cover":
      return "/images/default-cover.svg";
    case "post":
      return "/images/default-post.svg";
    default:
      return "/images/default-placeholder.svg";
  }
}

/**
 * Creates a media URL with error handling
 */
export function createMediaUrl(
  url: string | null | undefined,
  fallbackContext: "profile" | "post" | "cover" | "default" = "default",
): string {
  const normalizedUrl = normalizeMediaUrl(url);
  return normalizedUrl || getFallbackImage(fallbackContext);
}

/**
 * Validates video format support
 */
export function isVideoFormatSupported(url: string): boolean {
  if (!url) return false;

  const video = document.createElement("video");
  const formats = ["video/mp4", "video/webm", "video/ogg"];

  const extension = url.toLowerCase().split(".").pop();
  const mimeTypes = {
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    ogv: "video/ogg",
  };

  const mimeType = extension
    ? mimeTypes[extension as keyof typeof mimeTypes]
    : null;
  if (!mimeType) return false;

  return video.canPlayType(mimeType) !== "";
}

/**
 * Get video metadata without loading the full video
 */
export function getVideoMetadata(url: string): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };

    video.src = url;
  });
}

/**
 * Test video URL and provide diagnostics
 */
export async function testVideoUrl(url: string): Promise<{
  accessible: boolean;
  playable: boolean;
  error?: string;
  alternatives: string[];
}> {
  const result = {
    accessible: false,
    playable: false,
    error: undefined as string | undefined,
    alternatives: [] as string[],
  };

  try {
    // Test URL accessibility
    result.accessible = await isUrlReachable(url);

    if (!result.accessible) {
      result.error = "URL not accessible";
      result.alternatives = getVideoUrlWithFallbacks(url);
      return result;
    }

    // Test video playability
    await getVideoMetadata(url);
    result.playable = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    result.alternatives = getVideoUrlWithFallbacks(url);
  }

  return result;
}
