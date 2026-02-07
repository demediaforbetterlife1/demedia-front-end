"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProfilePhotoProps {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  userId?: string | number;
  fallbackSrc?: string;
  onError?: () => void;
  priority?: boolean;
}

/**
 * ProfilePhoto component that automatically updates when profile photos change
 * Listens for real-time profile update events and refreshes the image immediately
 */
export default function ProfilePhoto({
  src,
  alt = 'Profile photo',
  width = 40,
  height = 40,
  className = 'w-full h-full object-cover rounded-full',
  userId,
  fallbackSrc = '/assets/images/default-avatar.svg',
  onError,
  priority = false
}: ProfilePhotoProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null);
  const [hasError, setHasError] = useState(false);

  // Update local src when prop changes
  useEffect(() => {
    setCurrentSrc(src || null);
    setHasError(false);
  }, [src]);

  // Listen for real-time profile photo updates
  useEffect(() => {
    if (!userId) return;

    const handleProfileUpdate = (event: CustomEvent) => {
      const { userId: updatedUserId, profilePicture } = event.detail;
      if (updatedUserId === userId && profilePicture) {
        console.log('[ProfilePhoto] Real-time update received for user:', userId);
        setCurrentSrc(profilePicture);
        setHasError(false);
      }
    };

    window.addEventListener('profile:updated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profile:updated', handleProfileUpdate as EventListener);
    };
  }, [userId]);

  const handleError = () => {
    if (!hasError) {
      console.log('[ProfilePhoto] Image failed to load, using fallback');
      setHasError(true);
      setCurrentSrc(fallbackSrc);
      onError?.();
    }
  };

  const imageSrc = currentSrc || fallbackSrc;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      priority={priority}
      // Add key to force re-render when src changes (helps with caching issues)
      key={`${userId}-${imageSrc}`}
    />
  );
}