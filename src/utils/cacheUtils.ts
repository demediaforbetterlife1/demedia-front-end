/**
 * Ultra-Aggressive Cache Prevention Utilities
 * Ensures 100% fresh content delivery to all users
 */

/**
 * Generate ultra-aggressive cache-busting parameters
 */
export const generateCacheBuster = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const uuid = Math.random().toString(36).substring(2, 15);
  
  return `t=${timestamp}&cb=${random}&v=${Date.now()}&nocache=true&uuid=${uuid}`;
};

/**
 * Add ultra-aggressive cache busting to any URL
 */
export const bustCache = (url: string): string => {
  if (!url) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${generateCacheBuster()}`;
};

/**
 * Ultra-aggressive fetch with complete cache prevention
 */
export const fetchNoCacheUltra = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const cacheBustedUrl = bustCache(url);
  
  const ultraHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0, stale-while-revalidate=0, stale-if-error=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
    'If-None-Match': '*',
    'Surrogate-Control': 'no-store',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'X-Timestamp': Date.now().toString(),
    'X-Cache-Buster': Math.random().toString(36).substring(7),
    ...(options.headers || {})
  };

  return fetch(cacheBustedUrl, {
    ...options,
    cache: 'no-store',
    headers: ultraHeaders,
    credentials: 'include'
  });
};

/**
 * Clear all possible browser caches
 */
export const clearAllCaches = async (): Promise<void> => {
  try {
    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('🗑️ All service worker caches cleared');
    }

    // Clear localStorage (preserve ONLY auth token)
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('token');
      
      localStorage.clear();
      
      if (authToken) localStorage.setItem('token', authToken);
      
      console.log('🧹 LocalStorage cleared (auth token preserved)');
    }

    // Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
      console.log('🧹 SessionStorage cleared');
    }

    // Force refresh all images
    const images = document.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
    images.forEach(img => {
      if (img.src && !img.src.startsWith('data:')) {
        img.src = bustCache(img.src);
      }
    });

    console.log('✅ All caches cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
  }
};

/**
 * Force refresh of all cached elements on the page
 */
export const refreshAllCachedElements = (): void => {
  try {
    // Refresh all images
    const images = document.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
    images.forEach(img => {
      if (img.src && !img.src.startsWith('data:')) {
        const originalSrc = img.src.split('?')[0]; // Remove existing cache busters
        img.src = bustCache(originalSrc);
      }
    });

    // Refresh all stylesheets
    const links = document.querySelectorAll('link[rel="stylesheet"]') as NodeListOf<HTMLLinkElement>;
    links.forEach(link => {
      if (link.href) {
        const originalHref = link.href.split('?')[0]; // Remove existing cache busters
        link.href = bustCache(originalHref);
      }
    });

    // Refresh all scripts
    const scripts = document.querySelectorAll('script[src]') as NodeListOf<HTMLScriptElement>;
    scripts.forEach(script => {
      if (script.src && !script.src.includes('_next/static')) {
        const originalSrc = script.src.split('?')[0]; // Remove existing cache busters
        const newScript = document.createElement('script');
        newScript.src = bustCache(originalSrc);
        newScript.async = script.async;
        newScript.defer = script.defer;
        script.parentNode?.replaceChild(newScript, script);
      }
    });

    console.log('🔄 All cached elements refreshed');
  } catch (error) {
    console.error('❌ Error refreshing cached elements:', error);
  }
};

/**
 * Override global fetch to add cache busting to all requests
 */
export const enableGlobalCacheBusting = (): void => {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url: string;
    
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = input.url;
    }

    // Don't cache-bust Next.js static assets (they have unique hashes)
    if (url.includes('/_next/static/')) {
      return originalFetch.call(this, input, init);
    }

    // 🔐 IMPORTANT: Never cache-bust API/auth requests.
    // These must hit the backend with clean URLs and headers
    // to avoid interfering with auth, rate limiting, or body parsing.
    if (url.startsWith('/api/') || url.includes('/api/auth/')) {
      return originalFetch.call(this, input, init);
    }

    // Add cache busting to all other requests
    const cacheBustedUrl = bustCache(url);
    
    const ultraInit: RequestInit = {
      ...init,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        ...(init?.headers || {})
      }
    };

    return originalFetch.call(this, cacheBustedUrl, ultraInit);
  };

  console.log('🌐 Global cache busting enabled');
};

/**
 * Check if content is fresh (not cached)
 */
export const isContentFresh = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    const cacheControl = response.headers.get('Cache-Control');
    const lastModified = response.headers.get('Last-Modified');
    const etag = response.headers.get('ETag');

    // Check if response indicates no caching
    const isNoCache = cacheControl?.includes('no-cache') || 
                     cacheControl?.includes('no-store') ||
                     cacheControl?.includes('max-age=0');

    console.log(`🔍 Content freshness check for ${url}:`, {
      isNoCache,
      cacheControl,
      lastModified,
      etag
    });

    return isNoCache || false;
  } catch (error) {
    console.warn('⚠️ Could not check content freshness:', error);
    return false;
  }
};

/**
 * Initialize smart cache prevention (NO AUTO-RELOAD)
 */
export const initUltraCachePrevention = (): void => {
  console.log('🚀 Initializing smart cache prevention (auth debug mode)...');

  // NOTE: While debugging authentication, we disable global cache busting
  // and aggressive cache clearing to ensure auth requests are sent cleanly
  // without extra query parameters or headers that could affect the backend.
  //
  // If you want to re‑enable the ultra cache prevention later, uncomment:
  //
  // enableGlobalCacheBusting();
  // clearAllCaches();

  // DON'T set up periodic cache clearing - only clear on user action
  
  // Listen for visibility changes to check for updates (but don't auto-reload)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('👁️ Page visible - checking for updates');
      checkForUpdates();
    }
  });

  // Listen for focus events to check for updates (but don't auto-reload)
  window.addEventListener('focus', () => {
    console.log('🎯 Window focused - checking for updates');
    checkForUpdates();
  });

  console.log('✅ Smart cache prevention initialized (NO AUTO-RELOAD)');
};

/**
 * Check for updates without auto-reloading
 */
const checkForUpdates = async (): Promise<void> => {
  try {
    const response = await fetch(`/version.json?v=${Date.now()}&cb=${Math.random()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    });

    const versionData = await response.json();
    const newVersion = versionData.buildId || Date.now().toString();
    const currentVersion = localStorage.getItem('app_version');

    if (currentVersion && currentVersion !== newVersion) {
      console.log('🔄 New version available:', newVersion);
      localStorage.setItem('update_available', 'true');
      localStorage.setItem('new_version', newVersion);

      // Dispatch event for update notification component
      window.dispatchEvent(new CustomEvent('app:update-available', {
        detail: {
          oldVersion: currentVersion,
          newVersion: newVersion,
          timestamp: Date.now()
        }
      }));
    }
  } catch (error) {
    console.warn('⚠️ Update check failed:', error);
  }
};

/**
 * Force immediate content refresh
 */
export const forceContentRefresh = (): void => {
  console.log('🔄 Forcing immediate content refresh...');
  
  clearAllCaches();
  refreshAllCachedElements();
  
  // Dispatch custom event for components to refresh
  window.dispatchEvent(new CustomEvent('content:refresh', {
    detail: { timestamp: Date.now() }
  }));
  
  console.log('✅ Content refresh complete');
};

export default {
  generateCacheBuster,
  bustCache,
  fetchNoCacheUltra,
  clearAllCaches,
  refreshAllCachedElements,
  enableGlobalCacheBusting,
  isContentFresh,
  initUltraCachePrevention,
  forceContentRefresh
};