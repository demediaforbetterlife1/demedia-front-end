/**
 * Application configuration and environment variables
 */

export const config = {
  // Backend API configuration
  backend: {
    url: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://demedia-backend.fly.dev',
    timeout: 10000, // 10 seconds
  },

  // App configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'DeMedia',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://de-media.vercel.app',
  },

  // Push notifications
  push: {
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  },

  // File upload limits
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
    allowedVideoTypes: (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm,video/ogg').split(','),
  },

  // Development settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Feature flags
  features: {
    enablePushNotifications: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    enableOfflineMode: true,
    enableMediaRetry: true,
  },

  // API retry configuration
  retry: {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
  },
};

/**
 * Validates required environment variables
 */
export function validateConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'NEXT_PUBLIC_BACKEND_URL',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

/**
 * Gets the full backend URL for an endpoint
 */
export function getBackendUrl(endpoint: string): string {
  const baseUrl = config.backend.url.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Checks if push notifications are available
 */
export function isPushNotificationAvailable(): boolean {
  return config.features.enablePushNotifications && 
         typeof window !== 'undefined' && 
         'serviceWorker' in navigator && 
         'PushManager' in window;
}
