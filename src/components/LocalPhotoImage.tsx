"use client";

import { useState, useEffect } from 'react';
import MediaImage from './MediaImage';
import { photoStorageService } from '@/services/storage';
import { ensureAbsoluteMediaUrl } from '@/utils/mediaUtils';

interface LocalPhotoImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

/**
 * Component that handles both local photos (from browser storage) and remote photos
 */
export default function LocalPhotoImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  sizes,
  fallbackSrc,
  priority,
}: LocalPhotoImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const resolveSrc = async () => {
      try {
        setLoading(true);
        setError(false);

        // Check if this is a local photo reference
        if (src.startsWith('local-photo://')) {
          const photoId = src.replace('local-photo://', '');
          console.log('📸 Loading local photo:', photoId);
          
          const url = await photoStorageService.getPhotoUrl(photoId);
          
          if (mounted) {
            console.log('✅ Local photo loaded:', photoId, url);
            setResolvedSrc(url);
            setLoading(false);
          }
        } else {
          // Regular backend URL
          const url = ensureAbsoluteMediaUrl(src);
          if (mounted) {
            setResolvedSrc(url);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('❌ Failed to load photo:', src, err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    resolveSrc();

    return () => {
      mounted = false;
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`${className} bg-gray-800/50 animate-pulse flex items-center justify-center`}>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error || !resolvedSrc) {
    return (
      <MediaImage
        src={fallbackSrc || '/images/default-post.svg'}
        alt={alt}
        className={className}
        fill={fill}
        width={width}
        height={height}
        sizes={sizes}
        fallbackSrc={fallbackSrc}
        priority={priority}
      />
    );
  }

  return (
    <MediaImage
      src={resolvedSrc}
      alt={alt}
      className={className}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      fallbackSrc={fallbackSrc}
      priority={priority}
    />
  );
}
