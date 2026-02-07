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
  const [forceUpdate, setForceUpdate] = useState(0);

  // Update when prop changes
  useEffect(() => {
    if (src) {
      console.log('[ProfilePhoto] Src prop changed:', src.substring(0, 100));
      // Add cache buster to force reload
      const cacheBustedSrc = src.includes('?') ? `${src}&t=${Date.now()}` : `${src}?t=${Date.now()}`;
      setCurrentSrc(cacheBustedSrc);
      setKey(prev => prev + 1);
      setForceUpdate(prev => prev + 1);
    }
  }, [src]);

  // Listen for profile updates with aggressive re-rendering
  useEffect(() => {
    if (!userId) return;

    const handleUpdate = (event: any) => {
      const detail = event.detail;
      if (String(detail.userId) === String(userId) && detail.profilePicture) {
        console.log('[ProfilePhoto] Update event received for user', userId, 'new photo:', detail.profilePicture.substring(0, 100));
        // Add cache buster to force reload
        const cacheBustedSrc = detail.profilePicture.includes('?') 
          ? `${detail.profilePicture}&t=${Date.now()}` 
          : `${detail.profilePicture}?t=${Date.now()}`;
        setCurrentSrc(cacheBustedSrc);
        setKey(prev => prev + 1);
        setForceUpdate(prev => prev + 1);
        
        // Force multiple re-renders to ensure the update sticks
        setTimeout(() => {
          setForceUpdate(prev => prev + 1);
        }, 50);
        setTimeout(() => {
          setForceUpdate(prev => prev + 1);
        }, 150);
        setTimeout(() => {
          setForceUpdate(prev => prev + 1);
        }, 300);
      }
    };

    // Listen for both profile:updated and user:updated events
    window.addEventListener('profile:updated', handleUpdate);
    window.addEventListener('user:updated', handleUpdate);
    
    // Also listen for storage events (in case of cross-tab updates)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'user_data' && e.newValue) {
        try {
          const userData = JSON.parse(e.newValue);
          if (String(userData.id) === String(userId) && userData.profilePicture) {
            console.log('[ProfilePhoto] Storage update detected');
            const cacheBustedSrc = userData.profilePicture.includes('?') 
              ? `${userData.profilePicture}&t=${Date.now()}` 
              : `${userData.profilePicture}?t=${Date.now()}`;
            setCurrentSrc(cacheBustedSrc);
            setKey(prev => prev + 1);
            setForceUpdate(prev => prev + 1);
          }
        } catch (err) {
          console.error('[ProfilePhoto] Error parsing storage data:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener('profile:updated', handleUpdate);
      window.removeEventListener('user:updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [userId]);

  return (
    <Image
      key={`profile-${userId}-${key}-${forceUpdate}`}
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