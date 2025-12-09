"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
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

// Check if a string is a valid Base64 data URL
const isBase64DataUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith("data:image/");
};

// Validate that a URL is actually loadable
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url === "null" || url === "undefined") return false;
  if (url.trim() === "") return false;

  // Check if it's a valid URL format
  try {
    // PRIORITY: Base64 data URLs - always valid if they start with data:image/
    if (url.startsWith("data:image/")) {
      // Validate it has actual content after the header (reduced threshold for small images)
      const commaIndex = url.indexOf(",");
      if (commaIndex > 0 && url.length > commaIndex + 10) {
        return true;
      }
      return false;
    }
    // Absolute URLs
    if (url.startsWith("http://") || url.startsWith("https://")) {
      new URL(url);
      return true;
    }
    // Relative URLs (local paths)
    if (url.startsWith("/")) {
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
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const lastSrcRef = useRef<string | null | undefined>(null);

  // Reset state when src changes
  useEffect(() => {
    // Skip if src hasn't changed
    if (src === lastSrcRef.current) return;
    lastSrcRef.current = src;
    
    const isBase64 = isBase64DataUrl(src);
    console.log("MediaImage: Source changed", {
      new: src?.substring(0, 60),
      alt,
      isBase64,
      srcLength: src?.length || 0,
    });
    setImageError(false);
    setIsLoading(true);
    setDebugInfo("");
    
    // For Base64 images, use them directly without any processing
    if (isBase64 && src) {
      setProcessedSrc(src);
    } else {
      setProcessedSrc(null);
    }
  }, [src, alt]);

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
      // PRIORITY: Handle Base64 data URLs FIRST - these are 100% frontend and always work
      if (url && url.startsWith("data:image/")) {
        // Validate the Base64 data URL has actual content
        const commaIndex = url.indexOf(",");
        if (commaIndex > 0 && url.length > commaIndex + 100) {
          console.log(`MediaImage (${alt}): Using Base64 data URL (${Math.round(url.length / 1024)}KB)`);
          return url;
        } else {
          console.warn(`MediaImage (${alt}): Base64 data URL appears truncated or invalid`);
        }
      }

      // If URL is invalid, return fallback immediately
      if (!isValidImageUrl(url)) {
        const message = `Invalid image URL: ${url?.substring(0, 50)}, using fallback`;
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

      // Handle blob URLs (from localStorage/IndexedDB)
      if (url!.startsWith("blob:")) {
        console.log(`MediaImage (${alt}): Using blob URL from storage`);
        return url!;
      }

      // Use shared helper that handles relative paths (with/without leading slash)
      const normalized = ensureAbsoluteMediaUrl(url);
      if (!normalized) {
        const message = `Failed to normalize URL: ${url?.substring(0, 50)}, using fallback`;
        console.warn(`MediaImage (${alt}):`, message);
        setDebugInfo(message);
        return getFallbackImage();
      }

      console.log(`MediaImage (${alt}): Normalized URL:`, {
        original: url?.substring(0, 50),
        normalized: normalized?.substring(0, 50),
      });
      return normalized;
    },
    [getFallbackImage, alt],
  );

  const handleImageError = useCallback(() => {
    const srcPreview = src?.substring(0, 100) || 'null';
    const isBase64 = isBase64DataUrl(src);
    const message = `Image failed to load: ${srcPreview}...`;
    console.warn(`MediaImage (${alt}):`, message, "switching to fallback");
    console.warn(`MediaImage (${alt}): Full src length:`, src?.length || 0, "isBase64:", isBase64);
    setDebugInfo(message);
    setImageError(true);
    setIsLoading(false);
    onError?.();
  }, [src, onError, alt]);

  // Determine the final image URL to use
  // For Base64 images that were pre-processed, use them directly
  const imageUrl = imageError 
    ? getFallbackImage() 
    : (processedSrc || getValidImageUrl(src));

  const handleImageLoad = useCallback(() => {
    console.log(`MediaImage (${alt}): Successfully loaded:`, imageUrl);
    setIsLoading(false);
    onLoad?.();
  }, [onLoad, alt, imageUrl]);

  // Build style object for img tag
  const imgStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", objectFit: "cover" as const }
    : { width: width || "auto", height: height || "auto" };

  // Check if we're showing the fallback due to an error
  const showingFallback = imageError && imageUrl === getFallbackImage();

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