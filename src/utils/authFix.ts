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
 * Set token in cookie
 */
export function setCookieToken(token: string): void {
  if (typeof document === "undefined") return;
  
  const date = new Date();
  date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
  const expires = `expires=${date.toUTCString()}`;
  
  document.cookie = `token=${encodeURIComponent(token)}; ${expires}; path=/; SameSite=Lax; Secure`;
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
  // Clear cookie
  if (typeof document !== "undefined") {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
  
  // Clear localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
}

/**
 * Validate if we have any authentication token
 */
export function hasValidAuth(): boolean {
  const token = getBestToken();
  return !!token && token.length > 10; // Basic validation
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
    throw new Error("No authentication token available");
  }

  const headers = {
    ...getAuthHeaders(userId),
    ...(options.headers || {})
  };

  const enhancedOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // Always include cookies
  };

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