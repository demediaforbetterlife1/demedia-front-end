"use client";

import React, { useState, useEffect, useCallback } from "react";
import { postPhotoCache } from "@/services/storage/PostPhotoCache";

interface PostImageProps {
  postId: number | string;
  photoIndex?: number;
  src: string | null | undefined;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const DEFAULT_POST_IMAGE = "/images/default-post.svg";

/**
 * PostImage component - Ensures photos always display
 * 
 * Priority order:
 * 1. Base64 data URL from src prop (if valid)
 * 2. Cached photo from IndexedDB (by postId + photoIndex)
 * 3. Backend URL from src prop
 * 4. Fallback placeholder
 */
export default function PostImage({
  postId,
  photoIndex = 0,
  src,
  alt,
  className = "",
  fill = false,
  sizes,
  priority = false,
  onLoad,
  onError,
}: PostImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_POST_IMAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [attemptedSources, setAttemptedSources] = useState<Set<string>>(new Set());

  // Check if a string is a valid Base64 data URL with actual content
  const isValidBase64 = useCallback((url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    if (!url.startsWith('data:image/')) return false;
    
    const commaIndex = url.indexOf(',');
    // Must have comma and at least 100 chars of data after it
    return commaIndex > 0 && url.length > commaIndex + 100;
  }, []);

  // Check if URL is a valid http/https URL
  const isValidHttpUrl = useCallback((url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  }, []);

  // Load image from various sources
  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);

      // Priority 1: Check if src is already a valid Base64 data URL
      if (isValidBase64(src)) {
        console.log(`📸 PostImage [${postId}]: Using Base64 from src (${Math.round(src!.length / 1024)}KB)`);
        if (isMounted) {
          setImageSrc(src!);
          setIsLoading(false);
        }
        return;
      }

      // Priority 2: Try to get from local cache
      try {
        const cachedPhoto = await postPhotoCache.getPhotoForPost(postId, photoIndex);
        if (cachedPhoto && isValidBase64(cachedPhoto)) {
          console.log(`📸 PostImage [${postId}]: Using cached photo (${Math.round(cachedPhoto.length / 1024)}KB)`);
          if (isMounted) {
            setImageSrc(cachedPhoto);
            setIsLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn(`PostImage [${postId}]: Cache lookup failed:`, err);
      }

      // Priority 3: Try backend URL if valid
      if (isValidHttpUrl(src)) {
        console.log(`📸 PostImage [${postId}]: Trying backend URL:`, src?.substring(0, 50));
        if (isMounted) {
          setImageSrc(src!);
          setIsLoading(false);
        }
        return;
      }

      // Priority 4: Fallback to placeholder
      console.log(`📸 PostImage [${postId}]: No valid source, using placeholder`);
      if (isMounted) {
        setImageSrc(DEFAULT_POST_IMAGE);
        setIsLoading(false);
        setHasError(true);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [postId, photoIndex, src, isValidBase64, isValidHttpUrl]);

  // Handle image load error - try next source
  const handleError = useCallback(async () => {
    console.warn(`📸 PostImage [${postId}]: Failed to load:`, imageSrc?.substring(0, 50));
    
    // Mark this source as attempted
    setAttemptedSources(prev => new Set(prev).add(imageSrc));

    // If we failed on a backend URL, try cache
    if (isValidHttpUrl(imageSrc) && !attemptedSources.has('cache')) {
      try {
        const cachedPhoto = await postPhotoCache.getPhotoForPost(postId, photoIndex);
        if (cachedPhoto && isValidBase64(cachedPhoto)) {
          console.log(`📸 PostImage [${postId}]: Fallback to cached photo`);
          setImageSrc(cachedPhoto);
          setAttemptedSources(prev => new Set(prev).add('cache'));
          return;
        }
      } catch (err) {
        console.warn(`PostImage [${postId}]: Cache fallback failed:`, err);
      }
    }

    // Final fallback to placeholder
    setImageSrc(DEFAULT_POST_IMAGE);
    setHasError(true);
    onError?.();
  }, [postId, photoIndex, imageSrc, attemptedSources, isValidBase64, isValidHttpUrl, onError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Build style object
  const imgStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", objectFit: "cover" as const }
    : {};

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`}>
      {isLoading && (
        <div
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${fill ? "" : "w-full h-full"}`}
          style={imgStyle}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        style={imgStyle}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes}
      />
    </div>
  );
}
