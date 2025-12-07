"use client";

import React, { useState, useCallback } from "react";
import { ensureAbsoluteMediaUrl } from "@/utils/mediaUtils";

interface MediaImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  onError?: () => void;
  onLoad?: () => void;
}

// Use assets paths that exist in this project under public/images
const DEFAULT_AVATAR = "/images/default-avatar.svg";
const DEFAULT_POST_IMAGE = "/images/default-post.svg";

// Backend URL for constructing absolute URLs
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://demedia-backend.fly.dev";

// Validate that a URL is actually loadable
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url === "null" || url === "undefined") return false;
  if (url.trim() === "") return false;

  // Check if it's a valid URL format
  try {
    // Absolute URLs
    if (url.startsWith("http://") || url.startsWith("https://")) {
      new URL(url);
      return true;
    }
    // Relative URLs (local paths)
    if (url.startsWith("/")) {
      return true;
    }
    // Data URLs (Base64)
    if (url.startsWith("data:")) {
      return true;
    }
    // Blob URLs (from localStorage/IndexedDB)
    if (url.startsWith("blob:")) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

export default function MediaImage({
  src,
  alt,
  className = "",
  fallbackSrc,
  width,
  height,
  fill = false,
  priority = false,
  sizes,
  onError,
  onLoad,
}: MediaImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptedSrc, setAttemptedSrc] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Reset state when src changes
  React.useEffect(() => {
    if (src !== attemptedSrc) {
      console.log("MediaImage: Source changed", {
        old: attemptedSrc,
        new: src,
        alt,
      });
      setImageError(false);
      setIsLoading(true);
      setAttemptedSrc(src || null);
      setDebugInfo("");
    }
  }, [src, attemptedSrc, alt]);

  // Determine the appropriate fallback image
  const getFallbackImage = useCallback(() => {
    if (fallbackSrc) return fallbackSrc;
    if (
      alt.toLowerCase().includes("profile") ||
      alt.toLowerCase().includes("avatar")
    ) {
      return DEFAULT_AVATAR;
    }
    return DEFAULT_POST_IMAGE;
  }, [fallbackSrc, alt]);

  // Validate and clean the image URL
  const getValidImageUrl = useCallback(
    (url: string | null | undefined): string => {
      // If URL is invalid, return fallback immediately
      if (!isValidImageUrl(url)) {
        const message = `Invalid image URL: ${url}, using fallback`;
        console.warn(`MediaImage (${alt}):`, message);
        setDebugInfo(message);
        return getFallbackImage();
      }

      // Explicitly handle local uploads
      if (url!.startsWith("/local-uploads") || url!.includes("local-uploads")) {
        const localUrl = url!.startsWith("/") ? url! : `/${url}`;
        console.log(`MediaImage (${alt}): Using local upload URL:`, localUrl);
        return localUrl;
      }

      // PRIORITY: Handle Base64 data URLs - these are 100% frontend and always work
      if (url!.startsWith("data:")) {
        console.log(`MediaImage (${alt}): Using Base64 data URL (100% frontend storage)`);
        return url!;
      }

      // Handle blob URLs (from localStorage/IndexedDB)
      if (url!.startsWith("blob:")) {
        console.log(`MediaImage (${alt}): Using blob URL from storage`);
        return url!;
      }

      // Use shared helper that handles relative paths (with/without leading slash)
      const normalized = ensureAbsoluteMediaUrl(url);
      if (!normalized) {
        const message = `Failed to normalize URL: ${url}, using fallback`;
        console.warn(`MediaImage (${alt}):`, message);
        setDebugInfo(message);
        return getFallbackImage();
      }

      console.log(`MediaImage (${alt}): Normalized URL:`, {
        original: url,
        normalized,
      });
      return normalized;
    },
    [getFallbackImage, alt],
  );

  const handleImageError = useCallback(() => {
    const srcPreview = src?.substring(0, 100) || 'null';
    const message = `Image failed to load: ${srcPreview}...`;
    console.warn(`MediaImage (${alt}):`, message, "switching to fallback");
    console.warn(`MediaImage (${alt}): Full src length:`, src?.length || 0);
    setDebugInfo(message);
    setImageError(true);
    setIsLoading(false);
    onError?.();
  }, [src, onError, alt]);

  // Determine the final image URL to use
  const imageUrl = imageError ? getFallbackImage() : getValidImageUrl(src);

  const handleImageLoad = useCallback(() => {
    console.log(`MediaImage (${alt}): Successfully loaded:`, imageUrl);
    setIsLoading(false);
    onLoad?.();
  }, [onLoad, alt, imageUrl]);

  // Build style object for img tag
  const imgStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", objectFit: "cover" as const }
    : { width: width || "auto", height: height || "auto" };

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`}>
      {isLoading && !imageError && (
        <div
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${fill ? "" : "w-full h-full"}`}
          style={imgStyle}
        />
      )}
      {imageError && debugInfo && process.env.NODE_ENV === "development" && (
        <div className="absolute top-0 left-0 bg-red-500/80 text-white text-xs p-1 rounded max-w-full truncate z-10">
          {debugInfo}
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoading && !imageError ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        style={imgStyle}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes}
        title={process.env.NODE_ENV === "development" ? imageUrl : alt}
      />
    </div>
  );
}