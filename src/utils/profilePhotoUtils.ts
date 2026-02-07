/**
 * Utility functions for handling real-time profile photo updates
 */

export interface ProfileUpdateEvent {
  userId: string | number;
  profilePicture?: string;
  name?: string;
  username?: string;
}

/**
 * Dispatch a profile update event for real-time updates across components
 */
export const dispatchProfileUpdate = (data: ProfileUpdateEvent) => {
  if (typeof window !== "undefined") {
    console.log('[ProfileUtils] Dispatching profile update event:', data);
    window.dispatchEvent(new CustomEvent('profile:updated', {
      detail: data
    }));
  }
};

/**
 * Add ULTRA-AGGRESSIVE cache buster to URL to ensure immediate display of new photos
 */
export const addCacheBuster = (url: string): string => {
  if (!url) return url;
  
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const separator = url.includes('?') ? '&' : '?';
  
  // Multiple cache-busting parameters for maximum effectiveness
  return `${url}${separator}t=${timestamp}&cb=${random}&v=${Date.now()}&nocache=true`;
};

/**
 * Hook to listen for profile photo updates
 */
export const useProfilePhotoUpdates = (
  userId: string | number | undefined,
  onUpdate: (profilePicture: string) => void
) => {
  if (typeof window === "undefined") return;

  const handleProfileUpdate = (event: CustomEvent<ProfileUpdateEvent>) => {
    const { userId: updatedUserId, profilePicture } = event.detail;
    if (updatedUserId === userId && profilePicture) {
      console.log('[ProfileUtils] Profile photo updated for user:', userId);
      onUpdate(profilePicture);
    }
  };

  window.addEventListener('profile:updated', handleProfileUpdate as EventListener);
  
  return () => {
    window.removeEventListener('profile:updated', handleProfileUpdate as EventListener);
  };
};

/**
 * Create a profile photo URL with ULTRA-AGGRESSIVE cache busting for immediate display
 */
export const createImmediatePhotoUrl = (baseUrl: string): string => {
  if (!baseUrl) return baseUrl;
  
  // For base64 data URLs, add fragment identifier with multiple parameters
  if (baseUrl.startsWith('data:')) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${baseUrl}#t=${timestamp}&cb=${random}&v=${Date.now()}`;
  }
  
  // For regular URLs, add ULTRA-AGGRESSIVE query parameters
  return addCacheBuster(baseUrl);
};

/**
 * Update profile photo across all components immediately
 */
export const updateProfilePhotoEverywhere = (
  userId: string | number,
  profilePicture: string,
  userInfo?: { name?: string; username?: string }
) => {
  // Create cache-busted URL for immediate display
  const immediateUrl = createImmediatePhotoUrl(profilePicture);
  
  // Dispatch event for real-time updates
  dispatchProfileUpdate({
    userId,
    profilePicture: immediateUrl,
    ...userInfo
  });
  
  return immediateUrl;
};