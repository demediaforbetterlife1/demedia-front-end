'use client';

import React, { useState, useCallback } from 'react';
import { ensureAbsoluteMediaUrl } from '@/utils/mediaUtils';

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
const DEFAULT_AVATAR = '/images/default-avatar.svg';
const DEFAULT_POST_IMAGE = '/images/default-post.svg';

// Validate that a URL is actually loadable
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url === 'null' || url === 'undefined') return false;
  if (url.trim() === '') return false;

  // Check if it's a valid URL format
  try {
    // Absolute URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url);
      return true;
    }
    // Relative URLs (local paths)
    if (url.startsWith('/')) {
      return true;
    }
    // Data URLs
    if (url.startsWith('data:')) {
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
  className = '',
  fallbackSrc,
  width,
  height,
  fill = false,
  priority = false,
  onError,
  onLoad
}: MediaImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptedSrc, setAttemptedSrc] = useState<string | null>(null);

  // Reset state when src changes
  React.useEffect(() => {
    if (src !== attemptedSrc) {
      setImageError(false);
      setIsLoading(true);
      setAttemptedSrc(src || null);
    }
  }, [src, attemptedSrc]);

  // Determine the appropriate fallback image
  const getFallbackImage = useCallback(() => {
    if (fallbackSrc) return fallbackSrc;
    if (alt.toLowerCase().includes('profile') || alt.toLowerCase().includes('avatar')) {
      return DEFAULT_AVATAR;
    }
    return DEFAULT_POST_IMAGE;
  }, [fallbackSrc, alt]);

  // Validate and clean the image URL
  const getValidImageUrl = useCallback((url: string | null | undefined): string => {
    // If URL is invalid, return fallback immediately
    if (!isValidImageUrl(url)) {
      console.warn(`Invalid image URL: ${url}, using fallback`);
      return getFallbackImage();
    }

    // Explicitly handle local uploads
    if (url!.startsWith('/local-uploads') || url!.includes('local-uploads')) {
      return url!.startsWith('/') ? url! : `/${url}`;
    }

    // Use shared helper that handles relative paths (with/without leading slash)
    const normalized = ensureAbsoluteMediaUrl(url);
    if (!normalized) {
      console.warn(`Failed to normalize URL: ${url}, using fallback`);
      return getFallbackImage();
    }

    return normalized;
  }, [getFallbackImage]);

  const handleImageError = useCallback(() => {
    console.warn(`Image failed to load: ${src}, switching to fallback`);
    setImageError(true);
    setIsLoading(false);
    onError?.();
  }, [src, onError]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Determine the final image URL to use
  const imageUrl = imageError ? getFallbackImage() : getValidImageUrl(src);

  // Build style object for img tag
  const imgStyle: React.CSSProperties = fill
    ? { width: '100%', height: '100%', objectFit: 'cover' as const }
    : { width: width || 'auto', height: height || 'auto' };

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {isLoading && !imageError && (
        <div
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${fill ? '' : 'w-full h-full'}`}
          style={imgStyle}
        />
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoading && !imageError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        style={imgStyle}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}
