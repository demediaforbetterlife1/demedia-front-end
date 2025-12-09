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
 * 3. Backend URL from src prop (http/https URLs)
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
    
    // Direct Base64 data URL
    if (url.startsWith('data:image/')) {
      const commaIndex = url.indexOf(',');
      return commaIndex > 0 && url.length > commaIndex + 50;
    }
    
    return false;
  }, []);
  
  // Extract Base64 data URL if it's embedded in a malformed URL
  const extractBase64 = useCallback((url: string | null | undefined): string | null => {
    if (!url || typeof url !== 'string') return null;
    
    // If it already starts with data:image/, return as-is
    if (url.startsWith('data:image/')) {
      return url;
    }
    
    // Check if Base64 is embedded in a malformed URL (e.g., https://server/data:image/...)
    if (url.includes('data:image/')) {
      const base64Start = url.indexOf('data:image/');
      if (base64Start > 0) {
        const extracted = url.substring(base64Start);
        console.log(`📸 Extracted Base64 from malformed URL`);
        return extracted;
      }
    }
    
    return null;
  }, []);

  // Check if URL is a valid http/https URL that's likely to work
  const isValidHttpUrl = useCallback((url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    // Skip local storage references - they don't work
    if (url.startsWith('local-storage://') || url.startsWith('local-photo://')) {
      return false;
    }
    
    // Skip blob URLs that might be stale
    if (url.startsWith('blob:')) {
      return false;
    }
    
    // Valid http/https URLs or relative paths
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

      // Debug: Log what we received
      console.log(`📸 PostImage [${postId}][${photoIndex}]: Received src:`, {
        type: typeof src,
        length: src?.length || 0,
        preview: src?.substring(0, 100),
        isBase64: src?.startsWith('data:image/'),
        containsBase64: src?.includes('data:image/'),
        isHttp: src?.startsWith('http'),
        isRelative: src?.startsWith('/'),
      });

      // PRIORITY 0: Try to extract Base64 from malformed URL (e.g., https://server/data:image/...)
      const extractedBase64 = extractBase64(src);
      if (extractedBase64 && isValidBase64(extractedBase64)) {
        const sizeKB = Math.round(extractedBase64.length / 1024);
        console.log(`📸 PostImage [${postId}][${photoIndex}]: ✅ Using extracted Base64 (${sizeKB}KB)`);
        if (isMounted) {
          setImageSrc(extractedBase64);
          setIsLoading(false);
          
          // Also cache it for future use
          try {
            await postPhotoCache.storePhotosForPost(postId, [extractedBase64]);
          } catch (e) {
            // Ignore cache errors
          }
        }
        return;
      }

      // PRIORITY 1: Check if src is already a valid Base64 data URL
      // This is the most reliable for frontend-only display
      if (isValidBase64(src)) {
        const sizeKB = Math.round(src!.length / 1024);
        console.log(`📸 PostImage [${postId}][${photoIndex}]: ✅ Using Base64 from src (${sizeKB}KB)`);
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
          console.log(`📸 PostImage [${postId}][${photoIndex}]: ✅ Using cached photo (${sizeKB}KB)`);
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
        console.log(`📸 PostImage [${postId}][${photoIndex}]: Trying backend URL:`, src?.substring(0, 80));
        if (isMounted) {
          setImageSrc(src!);
          setIsLoading(false);
        }
        return;
      }

      // PRIORITY 4: Fallback to placeholder
      console.log(`📸 PostImage [${postId}][${photoIndex}]: ❌ No valid source found, using placeholder`);
      console.log(`   - src was: "${src?.substring(0, 100)}"`);
      console.log(`   - isValidBase64: ${isValidBase64(src)}`);
      console.log(`   - isValidHttpUrl: ${isValidHttpUrl(src)}`);
      
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

  // If we have an error and the image is the default placeholder, show a nicer "no image" state
  const showNoImageState = hasError && imageSrc === DEFAULT_POST_IMAGE;

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`}>
      {isLoading && !showNoImageState && (
        <div
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${fill ? "" : "w-full h-full"}`}
          style={imgStyle}
        />
      )}
      {showNoImageState ? (
        // Show a styled "no image" placeholder instead of the broken image icon
        <div 
          className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl ${fill ? "w-full h-full" : ""}`}
          style={imgStyle}
        >
          <svg 
            className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <span className="text-sm text-gray-500 dark:text-gray-400">Image not available</span>
        </div>
      ) : (
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
      )}
    </div>
  );
}
