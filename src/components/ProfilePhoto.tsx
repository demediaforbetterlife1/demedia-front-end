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
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);
  const [updateKey, setUpdateKey] = useState(0);

  // Update local src when prop changes
  useEffect(() => {
    console.log('[ProfilePhoto] Prop src changed:', { userId, newSrc: src });
    if (src) {
      setCurrentSrc(src);
      setHasError(false);
      setUpdateKey(prev => prev + 1);
    }
  }, [src, userId]);

  // Listen for real-time profile photo updates
  useEffect(() => {
    if (!userId) {
      console.log('[ProfilePhoto] No userId provided, skipping event listener');
      return;
    }

    const handleProfileUpdate = (event: CustomEvent) => {
      const { userId: updatedUserId, profilePicture, timestamp } = event.detail;
      
      console.log('[ProfilePhoto] Event received:', {
        myUserId: userId,
        eventUserId: updatedUserId,
        matches: String(updatedUserId) === String(userId),
        newPicture: profilePicture,
        timestamp
      });
      
      if (String(updatedUserId) === String(userId) && profilePicture) {
        console.log('[ProfilePhoto] Updating photo for user:', userId);
        setCurrentSrc(profilePicture);
        setHasError(false);
        setUpdateKey(prev => prev + 1);
      }
    };

    console.log('[ProfilePhoto] Setting up event listener for user:', userId);
    window.addEventListener('profile:updated', handleProfileUpdate as EventListener);
    
    return () => {
      console.log('[ProfilePhoto] Cleaning up event listener for user:', userId);
      window.removeEventListener('profile:updated', handleProfileUpdate as EventListener);
    };
  }, [userId]);

  const handleError = () => {
    if (!hasError) {
      console.log('[ProfilePhoto] Image failed to load, using fallback:', { userId, src: currentSrc });
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
      // Add key to force re-render when src changes
      key={`${userId}-${updateKey}-${imageSrc}`}
      unoptimized={imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')}
    />
  );
}