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
        console.log('🔍 LocalPhotoImage: Resolving src:', src?.substring(0, 50) + '...');
        setLoading(true);
        setError(false);

        // Check if this is a Base64 data URL (starts with data:image/)
        if (src.startsWith('data:image/')) {
          console.log('📸 LocalPhotoImage: Using Base64 data URL directly');
          if (mounted) {
            setResolvedSrc(src);
            setLoading(false);
          }
          return;
        }

        // Check if this is a local photo reference (legacy)
        if (src.startsWith('local-photo://')) {
          const photoId = src.replace('local-photo://', '');
          console.log('📸 LocalPhotoImage: Loading local photo:', photoId);
          
          try {
            // Initialize storage service if needed
            await photoStorageService.initialize();
            console.log('✅ LocalPhotoImage: Storage initialized');
            
            const url = await photoStorageService.getPhotoUrl(photoId);
            
            if (mounted) {
              console.log('✅ LocalPhotoImage: Local photo loaded:', photoId, url);
              setResolvedSrc(url);
              setLoading(false);
            }
          } catch (storageErr) {
            console.error('❌ LocalPhotoImage: Storage error:', storageErr);
            if (mounted) {
              setError(true);
              setLoading(false);
            }
          }
        } else {
          // Regular backend URL
          console.log('🌐 LocalPhotoImage: Using backend URL');
          const url = ensureAbsoluteMediaUrl(src);
          if (mounted) {
            console.log('✅ LocalPhotoImage: Backend URL resolved');
            setResolvedSrc(url);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('❌ LocalPhotoImage: Failed to load photo:', err);
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
        <div className="text-gray-400 text-sm">Loading photo...</div>
      </div>
    );
  }

  if (error || !resolvedSrc) {
    console.warn('⚠️ LocalPhotoImage: Showing fallback for:', src);
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
