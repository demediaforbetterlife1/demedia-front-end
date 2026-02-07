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
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);
  const [key, setKey] = useState(0);

  // Update when prop changes
  useEffect(() => {
    if (src) {
      console.log('[ProfilePhoto] Src prop changed:', src);
      setCurrentSrc(src);
      setKey(prev => prev + 1);
    }
  }, [src]);

  // Listen for profile updates
  useEffect(() => {
    if (!userId) return;

    const handleUpdate = (event: any) => {
      const detail = event.detail;
      if (String(detail.userId) === String(userId) && detail.profilePicture) {
        console.log('[ProfilePhoto] Update event received for user', userId);
        setCurrentSrc(detail.profilePicture);
        setKey(prev => prev + 1);
      }
    };

    window.addEventListener('profile:updated', handleUpdate);
    return () => window.removeEventListener('profile:updated', handleUpdate);
  }, [userId]);

  return (
    <Image
      key={`profile-${userId}-${key}`}
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        console.log('[ProfilePhoto] Error loading image, using fallback');
        setCurrentSrc(fallbackSrc);
        onError?.();
      }}
      priority={priority}
      unoptimized={currentSrc.startsWith('data:') || currentSrc.startsWith('blob:')}
    />
  );
}