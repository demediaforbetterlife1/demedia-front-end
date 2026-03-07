"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  onError?: () => void;
  onLoad?: () => void;
}

// Use assets paths that exist in this project under public/images
const DEFAULT_AVATAR = "/images/default-avatar.svg";
const DEFAULT_POST_IMAGE = "/images/default-post.svg";

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
    // Data URLs
    if (url.startsWith("data:")) {
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
  onError,
  onLoad,
}: MediaImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
        console.warn(`MediaImage (${alt}): Invalid URL:`, url);
        return getFallbackImage();
      }

      // Handle base64 data URLs
      if (url!.startsWith("data:")) {
        return url!;
      }

      // Handle local paths
      if (url!.startsWith("/images/") || url!.startsWith("/assets/")) {
        return url!;
      }

      // Use shared helper that handles relative paths
      const normalized = ensureAbsoluteMediaUrl(url);
      if (!normalized) {
        console.warn(`MediaImage (${alt}): Failed to normalize:`, url);
        return getFallbackImage();
      }

      return normalized;
    },
    [getFallbackImage, alt],
  );

  // Update current src when src prop changes
  useEffect(() => {
    const newSrc = imageError ? getFallbackImage() : getValidImageUrl(src);
    if (newSrc !== currentSrc) {
      setCurrentSrc(newSrc);
      setIsLoading(true);
      setImageError(false);
      setRetryCount(0);
    }
  }, [src, imageError, getFallbackImage, getValidImageUrl, currentSrc]);

  const handleImageError = useCallback(() => {
    console.warn(`MediaImage (${alt}): Failed to load:`, currentSrc);
    
    // Try to retry with cache busting if it's not already a fallback
    if (!imageError && retryCount < 2 && currentSrc && !currentSrc.includes('/images/default-')) {
      const cacheBustedUrl = currentSrc.includes('?') 
        ? `${currentSrc}&t=${Date.now()}` 
        : `${currentSrc}?t=${Date.now()}`;
      
      console.log(`MediaImage (${alt}): Retrying with cache buster:`, cacheBustedUrl);
      setCurrentSrc(cacheBustedUrl);
      setRetryCount(prev => prev + 1);
      return;
    }

    // Final fallback
    if (!imageError) {
      setImageError(true);
      setIsLoading(false);
      setCurrentSrc(getFallbackImage());
      onError?.();
    }
  }, [currentSrc, imageError, onError, alt, getFallbackImage, retryCount]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setImageError(false);
    onLoad?.();
  }, [onLoad]);

  // Build style object for img tag
  const imgStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", objectFit: "cover" as const }
    : { width: width || "auto", height: height || "auto" };

  if (!currentSrc) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        style={imgStyle}
      />
    );
  }

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`}>
      {isLoading && (
        <div
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${fill ? "" : "w-full h-full"}`}
          style={imgStyle}
        />
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        style={imgStyle}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading={priority ? "eager" : "lazy"}
        crossOrigin="anonymous"
      />
    </div>
  );
}

export default function MediaImage({
  src,
  alt,
  className = "",
  fallbackSrc,
  width,
  height,
  fill = false,
  priority = false,
  onError,
  onLoad,
}: MediaImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

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
        console.warn(`MediaImage (${alt}): Invalid URL:`, url);
        return getFallbackImage();
      }

      // Handle base64 data URLs
      if (url!.startsWith("data:")) {
        return url!;
      }

      // Handle local paths
      if (url!.startsWith("/images/") || url!.startsWith("/assets/")) {
        return url!;
      }

      // Use shared helper that handles relative paths
      const normalized = ensureAbsoluteMediaUrl(url);
      if (!normalized) {
        console.warn(`MediaImage (${alt}): Failed to normalize:`, url);
        return getFallbackImage();
      }

      return normalized;
    },
    [getFallbackImage, alt],
  );

  // Update current src when src prop changes
  useEffect(() => {
    const newSrc = imageError ? getFallbackImage() : getValidImageUrl(src);
    if (newSrc !== currentSrc) {
      setCurrentSrc(newSrc);
      setIsLoading(true);
      setImageError(false);
    }
  }, [src, imageError, getFallbackImage, getValidImageUrl, currentSrc]);

  const handleImageError = useCallback(() => {
    console.warn(`MediaImage (${alt}): Failed to load:`, currentSrc);
    if (!imageError) {
      setImageError(true);
      setIsLoading(false);
      setCurrentSrc(getFallbackImage());
      onError?.();
    }
  }, [currentSrc, imageError, onError, alt, getFallbackImage]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Build style object for img tag
  const imgStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", objectFit: "cover" as const }
    : { width: width || "auto", height: height || "auto" };

  if (!currentSrc) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        style={imgStyle}
      />
    );
  }

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`}>
      {isLoading && (
        <div
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${fill ? "" : "w-full h-full"}`}
          style={imgStyle}
        />
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        style={imgStyle}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading={priority ? "eager" : "lazy"}
        crossOrigin="anonymous"
      />
    </div>
  );
}
