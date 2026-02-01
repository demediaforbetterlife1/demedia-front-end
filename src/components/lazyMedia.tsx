/**
 * Lazy-loaded Media Components
 * 
 * This file provides utilities for lazy-loading images and videos
 * to improve performance and reduce initial page load time.
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 6.1-6.3
 */

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// ============================================
// Image Components
// ============================================

interface LazyImageProps {
  /**
   * Image source URL
   */
  src: string;

  /**
   * Alternative text for accessibility
   */
  alt: string;

  /**
   * Image width
   */
  width?: number;

  /**
   * Image height
   */
  height?: number;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Blur placeholder data URL
   */
  blurDataURL?: string;

  /**
   * Priority loading (disables lazy loading)
   * @default false
   */
  priority?: boolean;

  /**
   * Callback when image loads
   */
  onLoad?: () => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;

  /**
   * Responsive sizes
   */
  sizes?: string;
}

/**
 * LazyImage Component
 * 
 * A wrapper around Next.js Image component with lazy loading enabled.
 * Shows a blur placeholder while the image loads.
 * 
 * Validates: Requirements 6.1, 6.3
 * 
 * @example
 * ```tsx
 * <LazyImage
 *   src="/images/post.jpg"
 *   alt="Post image"
 *   width={400}
 *   height={300}
 *   blurDataURL="data:image/..."
 * />
 * ```
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  blurDataURL,
  priority = false,
  onLoad,
  onError,
  sizes,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (err: any) => {
    const error = new Error(`Failed to load image: ${src}`);
    setError(error);
    onError?.(error);
  };

  if (error) {
    return (
      <div
        className={`bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Image failed to load</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        onLoadingComplete={handleLoadingComplete}
        onError={handleError}
        sizes={sizes}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {isLoading && blurDataURL && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${blurDataURL})` }}
        />
      )}
    </div>
  );
};

// ============================================
// Video Components
// ============================================

interface LazyVideoProps {
  /**
   * Video source URL
   */
  src: string;

  /**
   * Poster image URL
   */
  poster?: string;

  /**
   * Video width
   */
  width?: number;

  /**
   * Video height
   */
  height?: number;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Enable controls
   * @default true
   */
  controls?: boolean;

  /**
   * Enable autoplay
   * @default false
   */
  autoPlay?: boolean;

  /**
   * Enable muted
   * @default false
   */
  muted?: boolean;

  /**
   * Enable loop
   * @default false
   */
  loop?: boolean;

  /**
   * Callback when video plays
   */
  onPlay?: () => void;

  /**
   * Callback when video pauses
   */
  onPause?: () => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;

  /**
   * Use intersection observer for autoplay
   * @default true
   */
  useIntersectionObserver?: boolean;
}

/**
 * LazyVideo Component
 * 
 * A video component with lazy loading support using Intersection Observer.
 * Videos only play when they enter the viewport.
 * 
 * Validates: Requirements 6.2
 * 
 * @example
 * ```tsx
 * <LazyVideo
 *   src="/videos/demo.mp4"
 *   poster="/images/poster.jpg"
 *   width={640}
 *   height={360}
 *   controls
 *   useIntersectionObserver
 * />
 * ```
 */
export const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  width,
  height,
  className = '',
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  onPlay,
  onPause,
  onError,
  useIntersectionObserver = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!useIntersectionObserver || !videoRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (autoPlay && videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error('Failed to autoplay video:', err);
            });
          }
        } else {
          setIsInView(false);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(videoRef.current);

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [useIntersectionObserver, autoPlay]);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const error = new Error(`Failed to load video: ${src}`);
    setError(error);
    onError?.(error);
  };

  if (error) {
    return (
      <div
        className={`bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Video failed to load</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      width={width}
      height={height}
      controls={controls}
      autoPlay={autoPlay && isInView}
      muted={muted}
      loop={loop}
      loading="lazy"
      onPlay={onPlay}
      onPause={onPause}
      onError={handleError}
      className={`bg-black ${className}`}
    />
  );
};

// ============================================
// Responsive Image Component
// ============================================

interface ResponsiveImageProps extends LazyImageProps {
  /**
   * Responsive image sources
   */
  srcSet?: {
    mobile: string;
    tablet: string;
    desktop: string;
  };

  /**
   * Responsive sizes
   */
  responsiveSizes?: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

/**
 * ResponsiveImage Component
 * 
 * A responsive image component that serves different images
 * based on screen size.
 * 
 * Validates: Requirements 6.3
 * 
 * @example
 * ```tsx
 * <ResponsiveImage
 *   src="/images/post-desktop.jpg"
 *   alt="Post"
 *   srcSet={{
 *     mobile: '/images/post-mobile.jpg',
 *     tablet: '/images/post-tablet.jpg',
 *     desktop: '/images/post-desktop.jpg',
 *   }}
 *   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
 * />
 * ```
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  srcSet,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    if (!srcSet) return;

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setImageSrc(srcSet.mobile);
      } else if (width < 1024) {
        setImageSrc(srcSet.tablet);
      } else {
        setImageSrc(srcSet.desktop);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [srcSet]);

  return (
    <LazyImage
      src={imageSrc}
      alt={alt}
      sizes={sizes}
      {...props}
    />
  );
};

// ============================================
// Image Gallery Component
// ============================================

interface ImageGalleryProps {
  /**
   * Array of image URLs
   */
  images: string[];

  /**
   * Array of alt texts
   */
  alts?: string[];

  /**
   * Image width
   */
  width?: number;

  /**
   * Image height
   */
  height?: number;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Grid columns
   * @default "grid-cols-3"
   */
  gridCols?: string;

  /**
   * Gap between images
   * @default "gap-4"
   */
  gap?: string;

  /**
   * Blur placeholder data URL
   */
  blurDataURL?: string;
}

/**
 * ImageGallery Component
 * 
 * A gallery component that lazy-loads multiple images in a grid.
 * 
 * Validates: Requirements 6.1, 6.3
 * 
 * @example
 * ```tsx
 * <ImageGallery
 *   images={['/img1.jpg', '/img2.jpg', '/img3.jpg']}
 *   alts={['Image 1', 'Image 2', 'Image 3']}
 *   gridCols="grid-cols-2"
 *   gap="gap-2"
 * />
 * ```
 */
export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alts = [],
  width = 300,
  height = 300,
  className = '',
  gridCols = 'grid-cols-3',
  gap = 'gap-4',
  blurDataURL,
}) => {
  return (
    <div className={`grid ${gridCols} ${gap} ${className}`}>
      {images.map((src, index) => (
        <LazyImage
          key={index}
          src={src}
          alt={alts[index] || `Gallery image ${index + 1}`}
          width={width}
          height={height}
          blurDataURL={blurDataURL}
          className="rounded-lg overflow-hidden"
        />
      ))}
    </div>
  );
};

export default {
  LazyImage,
  LazyVideo,
  ResponsiveImage,
  ImageGallery,
};
