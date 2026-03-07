/**
 * Centralized backend URL configuration
 * This ensures all parts of the application use the correct backend URL
 */

export const BACKEND_URL = 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.BACKEND_URL || 
  "https://demedia-backend-production.up.railway.app";

export const API_BASE_URL = BACKEND_URL;

// Helper to ensure URLs use the correct backend
export function ensureCorrectBackendUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Replace old fly.dev URLs with railway URLs
  if (url.includes("demedia-backend.fly.dev")) {
    return url.replace(
      "https://demedia-backend.fly.dev",
      BACKEND_URL
    );
  }
  
  return url;
}
