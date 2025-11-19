'use client';

import React, { useState, useRef, useCallback } from 'react';

interface MediaVideoProps {
  src: string | null | undefined;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  poster?: string;
  onError?: () => void;
  onLoad?: () => void;
}

export default function MediaVideo({
  src,
  className = '',
  controls = true,
  autoPlay = false,
  muted = true,
  loop = false,
  poster,
  onError,
  onLoad
}: MediaVideoProps) {
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Validate and clean the video URL
  const getValidVideoUrl = useCallback((url: string | null | undefined): string | null => {
    if (!url || url === 'null' || url === 'undefined') {
      return null;
    }

    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If it starts with /uploads, prepend the backend URL
    if (url.startsWith('/uploads')) {
      return `https://demedia-backend.fly.dev${url}`;
    }

    // If it's a relative path, treat it as a local asset
    if (url.startsWith('/')) {
      return url;
    }

    return null;
  }, []);

  const handleVideoError = useCallback(() => {
    console.log(`Video failed to load: ${src}`);
    setVideoError(true);
    setIsLoading(false);
    onError?.();
  }, [src, onError]);

  const handleVideoLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const videoUrl = getValidVideoUrl(src);

  if (!videoUrl || videoError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center min-h-[200px] rounded`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🎥</div>
          <div className="text-sm">
            {videoError ? 'Video failed to load' : 'No video available'}
          </div>
          {videoError && (
            <button 
              onClick={() => {
                setVideoError(false);
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded flex items-center justify-center">
          <div className="text-gray-500">Loading video...</div>
        </div>
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        className={`w-full h-auto rounded ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        poster={poster}
        onError={handleVideoError}
        onLoadedData={handleVideoLoad}
        onLoadStart={() => setIsLoading(true)}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
      {videoError && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-75">
          Video failed to load
        </div>
      )}
    </div>
  );
}
