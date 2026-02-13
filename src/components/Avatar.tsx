"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  userId?: string | number;
  fallbackSrc?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-24 h-24',
};

/**
 * Centralized Avatar Component
 * 
 * Features:
 * - Automatic cache busting for profile images
 * - Real-time updates via profile:updated events
 * - Fallback to default avatar
 * - Optimized Next.js Image component
 * - Consistent styling across the app
 */
export default function Avatar({ 
  src, 
  alt = 'User avatar', 
  size = 'md', 
  className = '',
  userId,
  fallbackSrc = '/assets/images/default-avatar.svg'
}: AvatarProps) {
  const [imageSrc, setImageSrc] = useState<string>(src || fallbackSrc);
  const [imageError, setImageError] = useState(false);
  const [cacheKey, setCacheKey] = useState(Date.now());

  // Update image when src prop changes
  useEffect(() => {
    if (src && src !== imageSrc) {
      setImageSrc(src);
      setImageError(false);
      setCacheKey(Date.now());
    }
  }, [src]);

  // Listen for profile updates
  useEffect(() => {
    if (!userId) return;

    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        userId?: string | number;
        profilePicture?: string;
        timestamp?: number;
      }>;

      const { userId: updatedUserId, profilePicture, timestamp } = customEvent.detail || {};

      // Check if this update is for this user
      if (updatedUserId && String(updatedUserId) === String(userId) && profilePicture) {
        console.log(`[Avatar] Updating avatar for user ${userId}:`, profilePicture.substring(0, 50));
        setImageSrc(profilePicture);
        setImageError(false);
        setCacheKey(timestamp || Date.now());
      }
    };

    window.addEventListener('profile:updated', handleProfileUpdate as EventListener);
    window.addEventListener('user:updated', handleProfileUpdate as EventListener);

    return () => {
      window.removeEventListener('profile:updated', handleProfileUpdate as EventListener);
      window.removeEventListener('user:updated', handleProfileUpdate as EventListener);
    };
  }, [userId]);

  const handleError = () => {
    if (!imageError) {
      console.warn(`[Avatar] Failed to load image for user ${userId}, using fallback`);
      setImageError(true);
      setImageSrc(fallbackSrc);
    }
  };

  // Build the final image URL with cache busting
  const finalImageSrc = imageError ? fallbackSrc : `${imageSrc}${imageSrc.includes('?') ? '&' : '?'}t=${cacheKey}`;

  const sizeClass = sizeClasses[size];

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 ${className}`}>
      {finalImageSrc && !imageError ? (
        <Image
          src={finalImageSrc}
          alt={alt}
          width={96}
          height={96}
          className="w-full h-full object-cover"
          onError={handleError}
          unoptimized={finalImageSrc.startsWith('http')} // Disable optimization for external URLs
          priority={size === '2xl' || size === 'xl'} // Prioritize larger avatars
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
          <User className="w-1/2 h-1/2 text-white" />
        </div>
      )}
    </div>
  );
}
