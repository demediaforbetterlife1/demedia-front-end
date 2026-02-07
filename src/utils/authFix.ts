// Authentication Fix Utilities
// This file provides robust authentication handling to prevent 401 errors

export interface AuthTokens {
  cookieToken: string | null;
  localStorageToken: string | null;
  authHeader: string | null;
}

/**
 * Get all available authentication tokens
 */
export function getAllAuthTokens(): AuthTokens {
  const cookieToken = getCookieToken();
  const localStorageToken = getLocalStorageToken();
  const authHeader = getAuthHeaderToken();

  return {
    cookieToken,
    localStorageToken,
    authHeader
  };
}

/**
 * Get token from cookies
 */
export function getCookieToken(): string | null {
  if (typeof document === "undefined") return null;

  const nameEQ = "token=";
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Get token from localStorage
 */
export function getLocalStorageToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Get token from Authorization header (if previously set)
 */
export function getAuthHeaderToken(): string | null {
  // This would be set by previous API calls
  return null; // Not applicable for client-side
}

/**
 * Get the best available token
 */
export function getBestToken(): string | null {
  const tokens = getAllAuthTokens();
  
  // Prefer cookie token first (most secure)
  if (tokens.cookieToken) {
    return tokens.cookieToken;
  }
  
  // Fallback to localStorage
  if (tokens.localStorageToken) {
    return tokens.localStorageToken;
  }
  
  return null;
}

/**
 * Set token in both cookie and localStorage for redundancy
 */
export function setAuthToken(token: string): void {
  // Set cookie
  setCookieToken(token);
  
  // Set localStorage
  setLocalStorageToken(token);
}

/**
 * Set token in cookie with long expiration and secure settings
 */
export function setCookieToken(token: string): void {
  if (typeof document === "undefined") return;
  
  const date = new Date();
  date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
  const expires = `expires=${date.toUTCString()}`;
  
  // More permissive cookie settings for better persistence
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  
  document.cookie = `token=${encodeURIComponent(token)}; ${expires}; path=/; SameSite=Lax${secureFlag}`;
}

/**
 * Set token in localStorage
 */
export function setLocalStorageToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

/**
 * Clear all authentication tokens
 */
export function clearAllTokens(): void {
  console.log("[AuthFix] Clearing all authentication tokens...");
  
  // Clear cookie with multiple variations to ensure complete removal
  if (typeof document !== "undefined") {
    // Clear with different path and domain combinations
    const cookieVariations = [
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;",
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname + ";",
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;",
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict;",
      "token=; max-age=0; path=/;",
    ];
    
    cookieVariations.forEach(cookieStr => {
      document.cookie = cookieStr;
    });
    
    console.log("[AuthFix] Cookies cleared");
  }
  
  // Clear localStorage with all possible token keys
  if (typeof window !== "undefined") {
    const tokenKeys = ["token", "auth_token", "authToken", "jwt", "access_token"];
    tokenKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear any user data
    localStorage.removeItem("user");
    localStorage.removeItem("userData");
    
    console.log("[AuthFix] LocalStorage cleared");
  }
  
  // Clear sessionStorage as well
  if (typeof window !== "undefined") {
    sessionStorage.clear();
    console.log("[AuthFix] SessionStorage cleared");
  }
  
  console.log("[AuthFix] All tokens cleared successfully");
}

/**
 * Validate if we have any authentication token
 * More lenient validation - just checks if token exists and has reasonable length
 */
export function hasValidAuth(): boolean {
  const token = getBestToken();
  return !!token && token.length > 20; // More lenient - just check if it looks like a JWT
}

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(userId?: string | number): Record<string, string> {
  const token = getBestToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (userId) {
    headers["user-id"] = String(userId);
  }

  return headers;
}

/**
 * Enhanced fetch with automatic authentication
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}, 
  userId?: string | number
): Promise<Response> {
  const token = getBestToken();
  
  if (!token) {
    throw new Error("Authentication required - please log in again");
  }

  // Build headers with authentication
  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  // Add user-id header if provided (for backend fallback)
  if (userId) {
    authHeaders["user-id"] = String(userId);
  }

  // Merge with existing headers
  const headers = {
    ...authHeaders,
    ...(options.headers || {})
  };

  const enhancedOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // Always include cookies
  };

  console.log("🔐 Making authenticated request:", {
    url,
    method: options.method || 'GET',
    hasToken: !!token,
    hasUserId: !!userId,
    tokenPreview: token.substring(0, 20) + '...'
  });

  return fetch(url, enhancedOptions);
}

/**
 * Debug authentication state
 */
export function debugAuth(): void {
  const tokens = getAllAuthTokens();
  const bestToken = getBestToken();
  
  console.log("🔐 Authentication Debug:", {
    cookieToken: tokens.cookieToken ? `${tokens.cookieToken.substring(0, 20)}...` : null,
    localStorageToken: tokens.localStorageToken ? `${tokens.localStorageToken.substring(0, 20)}...` : null,
    bestToken: bestToken ? `${bestToken.substring(0, 20)}...` : null,
    hasValidAuth: hasValidAuth(),
    cookieExists: !!tokens.cookieToken,
    localStorageExists: !!tokens.localStorageToken
  });
}