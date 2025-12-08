"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
 * 1. Base64 data URL from src prop (if valid) - HIGHEST PRIORITY for frontend-only display
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
  const attemptedSourcesRef = useRef<Set<string>>(new Set());
  const lastSrcRef = useRef<string | null | undefined>(null);

  // Check if a string is a valid Base64 data URL with actual content
  const isValidBase64 = useCallback((url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    if (!url.startsWith('data:image/')) return false;
    
    const commaIndex = url.indexOf(',');
    // Must have comma and at least 50 chars of data after it (reduced threshold)
    return commaIndex > 0 && url.length > commaIndex + 50;
  }, []);

  // Check if URL is a valid http/https URL
  const isValidHttpUrl = useCallback((url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  }, []);

  // Load image from various sources
  useEffect(() => {
    // Skip if src hasn't changed
    if (src === lastSrcRef.current) return;
    lastSrcRef.current = src;
    
    let isMounted = true;
    attemptedSourcesRef.current = new Set();

    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);

      // PRIORITY 1: Check if src is already a valid Base64 data URL
      // This is the most reliable for frontend-only display
      if (isValidBase64(src)) {
        const sizeKB = Math.round(src!.length / 1024);
        console.log(`📸 PostImage [${postId}][${photoIndex}]: Using Base64 from src (${sizeKB}KB)`);
        if (isMounted) {
          setImageSrc(src!);
          setIsLoading(false);
          
          // Also cache it for future use
          try {
            await postPhotoCache.storePhotosForPost(postId, [src!]);
          } catch (e) {
            // Ignore cache errors
          }
        }
        return;
      }

      // PRIORITY 2: Try to get from local IndexedDB cache
      try {
        const cachedPhoto = await postPhotoCache.getPhotoForPost(postId, photoIndex);
        if (cachedPhoto && isValidBase64(cachedPhoto)) {
          const sizeKB = Math.round(cachedPhoto.length / 1024);
          console.log(`📸 PostImage [${postId}][${photoIndex}]: Using cached photo (${sizeKB}KB)`);
          if (isMounted) {
            setImageSrc(cachedPhoto);
            setIsLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn(`PostImage [${postId}]: Cache lookup failed:`, err);
      }

      // PRIORITY 3: Try backend URL if valid (http/https or relative path)
      if (isValidHttpUrl(src)) {
        console.log(`📸 PostImage [${postId}][${photoIndex}]: Trying URL:`, src?.substring(0, 80));
        if (isMounted) {
          setImageSrc(src!);
          setIsLoading(false);
        }
        return;
      }

      // PRIORITY 4: Fallback to placeholder
      console.log(`📸 PostImage [${postId}][${photoIndex}]: No valid source, using placeholder. src was:`, src?.substring(0, 50));
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
    console.warn(`📸 PostImage [${postId}][${photoIndex}]: Failed to load:`, imageSrc?.substring(0, 80));
    
    // Mark this source as attempted
    attemptedSourcesRef.current.add(imageSrc);

    // If we failed on a URL, try cache as fallback
    if (isValidHttpUrl(imageSrc) && !attemptedSourcesRef.current.has('cache')) {
      try {
        const cachedPhoto = await postPhotoCache.getPhotoForPost(postId, photoIndex);
        if (cachedPhoto && isValidBase64(cachedPhoto)) {
          console.log(`📸 PostImage [${postId}][${photoIndex}]: Fallback to cached photo`);
          setImageSrc(cachedPhoto);
          attemptedSourcesRef.current.add('cache');
          return;
        }
      } catch (err) {
        console.warn(`PostImage [${postId}]: Cache fallback failed:`, err);
      }
    }

    // Final fallback to placeholder
    if (imageSrc !== DEFAULT_POST_IMAGE) {
      setImageSrc(DEFAULT_POST_IMAGE);
    }
    setHasError(true);
    onError?.();
  }, [postId, photoIndex, imageSrc, isValidBase64, isValidHttpUrl, onError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
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
