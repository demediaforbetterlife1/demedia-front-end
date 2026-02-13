/**
 * Profile Photo Service
 * 
 * Centralized service for managing profile photo updates across the entire application.
 * Ensures consistency and real-time updates everywhere profile photos are displayed.
 */

interface ProfileUpdatePayload {
  userId: string | number;
  profilePicture: string;
  name?: string;
  username?: string;
  timestamp?: number;
}

class ProfilePhotoService {
  private static instance: ProfilePhotoService;
  private updateQueue: ProfileUpdatePayload[] = [];
  private isProcessing = false;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): ProfilePhotoService {
    if (!ProfilePhotoService.instance) {
      ProfilePhotoService.instance = new ProfilePhotoService();
    }
    return ProfilePhotoService.instance;
  }

  /**
   * Broadcast profile photo update to all components
   */
  public broadcastProfileUpdate(payload: ProfileUpdatePayload): void {
    if (typeof window === 'undefined') {
      console.warn('[ProfilePhotoService] ⚠️ Cannot broadcast - window is undefined (SSR)');
      return;
    }

    const eventDetail = {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    };

    console.log('[ProfilePhotoService] 📢 Broadcasting profile update:', {
      userId: eventDetail.userId,
      profilePicture: eventDetail.profilePicture?.substring(0, 50),
      name: eventDetail.name,
      username: eventDetail.username,
      timestamp: eventDetail.timestamp
    });

    // Add to queue for batch processing
    this.updateQueue.push(eventDetail);
    console.log('[ProfilePhotoService] 📋 Queue size:', this.updateQueue.length);
    this.processQueue();
  }

  /**
   * Process queued updates with debouncing
   */
  private processQueue(): void {
    if (this.isProcessing) {
      console.log('[ProfilePhotoService] ⏳ Already processing queue, skipping');
      return;
    }
    
    if (this.updateQueue.length === 0) {
      console.log('[ProfilePhotoService] ✅ Queue is empty');
      return;
    }

    console.log('[ProfilePhotoService] 🔄 Processing queue with', this.updateQueue.length, 'updates');
    this.isProcessing = true;

    // Get the latest update for each user
    const latestUpdates = new Map<string, ProfileUpdatePayload>();
    
    this.updateQueue.forEach(update => {
      const key = String(update.userId);
      const existing = latestUpdates.get(key);
      
      if (!existing || (update.timestamp || 0) > (existing.timestamp || 0)) {
        latestUpdates.set(key, update);
      }
    });

    console.log('[ProfilePhotoService] 📊 Unique users to update:', latestUpdates.size);

    // Clear the queue
    this.updateQueue = [];

    // Dispatch events for each unique user update
    latestUpdates.forEach((update, userId) => {
      console.log(`[ProfilePhotoService] 📤 Dispatching events for user ${userId}`);
      this.dispatchUpdateEvents(update);
    });

    this.isProcessing = false;
    console.log('[ProfilePhotoService] ✅ Queue processing complete');
  }

  /**
   * Dispatch multiple events to ensure all components receive the update
   */
  private dispatchUpdateEvents(payload: ProfileUpdatePayload): void {
    if (typeof window === 'undefined') {
      console.warn('[ProfilePhotoService] ⚠️ Cannot dispatch events - window is undefined');
      return;
    }

    const events = [
      'profile:updated',
      'user:updated',
      'avatar:updated',
      'profilePhoto:changed'
    ];

    console.log(`[ProfilePhotoService] 🎯 Dispatching ${events.length} event types for user ${payload.userId}`);

    events.forEach(eventName => {
      const event = new CustomEvent(eventName, { 
        detail: payload,
        bubbles: true,
        cancelable: false
      });
      
      window.dispatchEvent(event);
      console.log(`[ProfilePhotoService] ✅ Dispatched: ${eventName}`);
    });

    // Also dispatch with a slight delay to catch any late-mounting components
    setTimeout(() => {
      console.log(`[ProfilePhotoService] 🔄 Dispatching delayed events for user ${payload.userId}`);
      events.forEach(eventName => {
        const event = new CustomEvent(eventName, { 
          detail: payload,
          bubbles: true,
          cancelable: false
        });
        window.dispatchEvent(event);
      });
      console.log(`[ProfilePhotoService] ✅ Delayed events dispatched`);
    }, 100);

    console.log('[ProfilePhotoService] ✅ All events dispatched for user:', payload.userId);
  }

  /**
   * Update profile photo in localStorage cache
   */
  public updateLocalCache(userId: string | number, profilePicture: string): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheKey = `profile_photo_${userId}`;
      const cacheData = {
        url: profilePicture,
        timestamp: Date.now(),
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('[ProfilePhotoService] Updated local cache for user:', userId);
    } catch (error) {
      console.error('[ProfilePhotoService] Failed to update local cache:', error);
    }
  }

  /**
   * Get profile photo from localStorage cache
   */
  public getFromLocalCache(userId: string | number): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const cacheKey = `profile_photo_${userId}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const cacheData = JSON.parse(cached);
        
        // Cache is valid for 1 hour
        const isExpired = Date.now() - cacheData.timestamp > 60 * 60 * 1000;
        
        if (!isExpired) {
          return cacheData.url;
        }
      }
    } catch (error) {
      console.error('[ProfilePhotoService] Failed to read from local cache:', error);
    }

    return null;
  }

  /**
   * Clear cache for a specific user
   */
  public clearUserCache(userId: string | number): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheKey = `profile_photo_${userId}`;
      localStorage.removeItem(cacheKey);
      console.log('[ProfilePhotoService] Cleared cache for user:', userId);
    } catch (error) {
      console.error('[ProfilePhotoService] Failed to clear cache:', error);
    }
  }

  /**
   * Clear all profile photo caches
   */
  public clearAllCaches(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('profile_photo_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('[ProfilePhotoService] Cleared all profile photo caches');
    } catch (error) {
      console.error('[ProfilePhotoService] Failed to clear all caches:', error);
    }
  }

  /**
   * Force refresh all profile photos on the page
   */
  public forceRefreshAll(): void {
    if (typeof window === 'undefined') return;

    console.log('[ProfilePhotoService] Force refreshing all profile photos');
    
    const event = new CustomEvent('profile:forceRefresh', {
      detail: { timestamp: Date.now() },
      bubbles: true,
      cancelable: false
    });

    window.dispatchEvent(event);
  }
}

// Export singleton instance
export const profilePhotoService = ProfilePhotoService.getInstance();

// Export helper function for easy use
export function updateProfilePhoto(
  userId: string | number,
  profilePicture: string,
  additionalData?: { name?: string; username?: string }
): void {
  profilePhotoService.broadcastProfileUpdate({
    userId,
    profilePicture,
    ...additionalData,
  });

  profilePhotoService.updateLocalCache(userId, profilePicture);
}

export default profilePhotoService;
