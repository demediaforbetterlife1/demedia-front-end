'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
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

// Use assets paths that exist in this project under public/assets/images
const DEFAULT_AVATAR = '/assets/images/default-avatar.svg';
const DEFAULT_POST_IMAGE = '/assets/images/default-post.svg';

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

  // Determine the appropriate fallback image
  const getFallbackImage = useCallback(() => {
    if (fallbackSrc) return fallbackSrc;
    if (alt.toLowerCase().includes('profile') || alt.toLowerCase().includes('avatar')) {
      return DEFAULT_AVATAR;
    }
    return DEFAULT_POST_IMAGE;
  }, [fallbackSrc, alt]);

  // Validate and clean the image URL using shared media util
  const getValidImageUrl = useCallback((url: string | null | undefined): string => {
    if (!url || url === 'null' || url === 'undefined') {
      return getFallbackImage();
    }

    // Explicitly handle local uploads
    if (url.startsWith('/local-uploads') || url.includes('local-uploads')) {
      return url.startsWith('/') ? url : `/${url}`;
    }

    // Use shared helper that handles relative paths (with/without leading slash)
    const normalized = ensureAbsoluteMediaUrl(url);
    return normalized || getFallbackImage();
  }, [getFallbackImage]);

  const handleImageError = useCallback(() => {
    console.log(`Image failed to load: ${src}`);
    setImageError(true);
    setIsLoading(false);
    onError?.();
  }, [src, onError]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const imageUrl = imageError ? getFallbackImage() : getValidImageUrl(src);

  const imageProps = {
    src: imageUrl,
    alt,
    className: `${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-200`,
    onError: handleImageError,
    onLoad: handleImageLoad,
    priority,
    ...(fill ? { fill: true } : { width: width || 400, height: height || 400 })
  };

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse rounded ${fill ? '' : 'w-full h-full'}`} />
      )}
      <Image {...imageProps} />
      {imageError && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-75">
          Failed to load
        </div>
      )}
    </div>
  );
}
