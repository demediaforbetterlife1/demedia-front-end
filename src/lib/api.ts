export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = ""; // same-origin; Next.js rewrites /api to backend in production
const DIRECT_API_BASE = "https://demedia-backend.fly.dev"; // direct backend fallback


/* --------------------------- Utility helpers ----------------------------- */

/** Try connecting directly to the backend domain (fallback) */
async function tryDirectConnection(path: string, options: RequestInit = {}): Promise<Response> {
  const directUrl = `${DIRECT_API_BASE}${path}`;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(directUrl, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      credentials: "include",
    });
    clearTimeout(t);

    // Graceful fallback for 500
    if (response.status === 500) {
      return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return response;
  } catch (error) {
    console.error("[api] tryDirectConnection failed:", error);
    return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}

/** Safe JSON reader that falls back to text/status message */
export async function readJsonSafe<T = unknown>(res: Response): Promise<T | { error?: string }> {
  try {
    return (await res.json()) as T;
  } catch {
    try {
      const txt = await res.text();
      return { error: txt || res.statusText };
    } catch {
      return { error: res.statusText };
    }
  }
}
/* -------------------------- Cookie Helper Functions ---------------------- */
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window === "undefined") return;
  
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
};

const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

/* ------------------------------------------------------------------------- */
/* -------------------------- Auth helpers --------------------------------- */
/* ------------------------------------------------------------------------- */

/** Only token is stored in cookies — everything else pulled from backend */
export function getToken(): string | null {
  return getCookie("token");
}

/** Validate token format */
function isValidToken(token: string | null): boolean {
  if (!token) return false;
  // Basic JWT validation - check if it has 3 parts separated by dots
  const parts = token.split('.');
  return parts.length === 3 && token.length > 30;
}

/** Return headers including Authorization if token exists and is valid */
// lib/api.ts
export function getAuthHeaders(userId?: string | number): Record<string, string> {
  const token = getToken();
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  
  // Always add Authorization if token exists - remove the isValidToken check
  // This is likely where your issue is - isValidToken might be returning false
  if (token) {
    base["Authorization"] = `Bearer ${token}`;
  }
  
  // Use consistent header name - make sure it matches what backend expects
  if (userId) base["user-id"] = String(userId);
  return base;
}

/* ------------------------------------------------------------------------- */
/* ---------------------- Robust fetch / retry logic ----------------------- */
/* ------------------------------------------------------------------------- */

export async function apiFetch(path: string, options: RequestInit = {}, userId?: string | number): Promise<Response> {
  // attach token from cookies (userId should be passed as parameter from AuthContext)
  const token = getToken();

  // copy/merge headers - prioritize Authorization from options.headers if provided
  const providedHeaders = (options.headers as Record<string, string> | undefined) || {};
  const headers: Record<string, string> = {
    ...providedHeaders,
  };

  // Only add Authorization if token exists and is valid
  // But don't overwrite if it's already in providedHeaders
  if (token && isValidToken(token) && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // If Authorization is in providedHeaders, use it (it might be more up-to-date)
  if (providedHeaders["Authorization"]) {
    headers["Authorization"] = providedHeaders["Authorization"];
  }
  
  if (userId) headers["user-id"] = String(userId);

  // Only set Content-Type automatically if body is not FormData
  if (!headers["Content-Type"] && options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // build URL (API_BASE may be empty => same-origin)
  let url = `${API_BASE}${path}`;

  // cache-busting for GET requests
  const method = ((options.method || "GET") as string).toUpperCase();
  if (method === "GET") {
    const cb = Date.now();
    url = `${API_BASE}${path}${path.includes("?") ? "&" : "?"}cb=${cb}&v=client-1`;
  }

  const isPostsEndpoint = path.includes("/posts");
  const isAuthEndpoint = path.includes("/auth");
  const timeouts = isPostsEndpoint ? [5000, 8000, 10000] : isAuthEndpoint ? [20000] : [15000, 25000, 35000];
  const maxRetries = timeouts.length - 1;

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const timeout = timeouts[attempt];
    try {
      // choose fetch options
      let fetchOptions: RequestInit;
      if (isPostsEndpoint || isAuthEndpoint) {
        // don't abort posts/auth requests (to avoid mid-flight aborts)
        fetchOptions = {
          ...options,
          headers,
          cache: "no-cache",
          mode: "cors",
          credentials: "include",
        };
      } else {
        // use AbortController for non-auth/post endpoints
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        fetchOptions = {
          ...options,
          headers,
          signal: controller.signal,
          cache: "no-cache",
          mode: "cors",
          credentials: "include", // Always include credentials to send httpOnly cookies
        };

        // Note: timer will be cleared implicitly when request finishes or caught below
      }

      // For auth endpoints: soft timeout using Promise.race to return 504 synthetic response
      const res: Response = isAuthEndpoint
        ? await Promise.race<Promise<Response>>([
            fetch(url, fetchOptions),
            new Promise<Response>((resolve) =>
              setTimeout(() => {
                const body = JSON.stringify({ error: "Auth request timed out" });
                resolve(new Response(body, { status: 504, headers: { "Content-Type": "application/json" } }));
              }, timeout || 20000)
            ),
          ])
        : await fetch(url, fetchOptions);

      // FIXED: Improved 401 handling - don't logout immediately
      if (res.status === 401) {
        console.warn("[api] 401 Unauthorized for:", path);
        
        // Only logout if this is NOT an auth endpoint and we have a valid token
        const currentToken = getToken();
        if (typeof window !== "undefined" && currentToken && isValidToken(currentToken) && !path.includes("/auth/")) {
          console.warn("[api] Removing invalid token and logging out");
          deleteCookie("token");
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        
        // Return the response so the caller can handle 401 appropriately
        return res;
      }

      // if auth synthetic timeout (504), try direct backend
      if (isAuthEndpoint && res.status === 504) {
        try {
          const directRes = await tryDirectConnection(path, { ...options, headers });
          return directRes;
        } catch (e) {
          throw new Error("Auth request timed out");
        }
      }

      return res;
    } catch (err: any) {
      lastError = err;
      const errName = err?.name || "";
      const msg = (err?.message || "").toString();
      const isNetworkError = msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("timeout");

      // Retry policy
      if (errName === "AbortError") {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
          continue;
        } else if (isAuthEndpoint) {
          try {
            return await tryDirectConnection(path, options);
          } catch {}
        }
      }

      if (attempt < maxRetries && isNetworkError) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
        continue;
      }

      // final fallback: try direct backend
      if (attempt === maxRetries && (isNetworkError || errName === "AbortError")) {
        try {
          return await tryDirectConnection(path, options);
        } catch (directErr) {
          throw err;
        }
      }

      throw err;
    }
  }

  throw lastError;
}
/* ----------------------------- API wrappers ------------------------------ */

export interface User {
  id: string;
  name?: string;
  username?: string;
  phoneNumber?: string;
  profilePicture?: string | null;
  coverPhoto?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  dateOfBirth?: string | null;
  dob?: string | null;
  age?: number | null;
  language?: string | null;
  preferredLang?: string | null;
  privacy?: string | null;
  interests?: string[] | null;
  isSetupComplete?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token?: string;
  user?: User;
  requiresPhoneVerification?: boolean;
  message?: string;
  error?: string;
}
/* ----------------------------- Generic request -------------------------- */
async function requestJson<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, opts);
  const parsed = await readJsonSafe<T | { error?: string }>(res);
  
  // Don't throw for 401 - let the caller handle it
  if (!res.ok && res.status !== 401) {
    const errMsg = (parsed as any)?.error || (parsed as any)?.message || res.statusText;
    throw new Error(`Request failed ${res.status} - ${errMsg}`);
  }
  
  return parsed as T;
}
/*----------------------------- Auth endpoints --------------------------- */

/** Sign up (register using phoneNumber) */
export async function signUp(payload: {
  name: string;
  username: string;
  phoneNumber: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await requestJson<AuthResponse>("/api/auth/sign-up", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });

  if (res?.token && isValidToken(res.token)) {
    setCookie("token", res.token, 7);
  }
  return res;
}

/** Sign in (login) */
export async function signIn(payload: { phoneNumber: string; password: string }): Promise<AuthResponse> {
  const res = await requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });

  if (res?.token && isValidToken(res.token)) {
    setCookie("token", res.token, 7);
  }
  return res;
}

/** Fetch current authenticated user from backend only */
export async function fetchCurrentUser(): Promise<User | null> {
  const token = getToken();
  
  // Don't attempt to fetch user if no valid token
  if (!token || !isValidToken(token)) {
    console.warn("[api] fetchCurrentUser: No valid token");
    return null;
  }

  try {
    const res = await apiFetch("/api/auth/me", {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    // Handle 401 specifically for auth/me
    if (res.status === 401) {
      console.warn("[api] fetchCurrentUser: Token invalid or expired");
      // Don't remove token here - let the apiFetch handle it
      return null;
    }

    if (!res.ok) {
      console.warn("[api] fetchCurrentUser: Request failed", res.status);
      return null;
    }

    const body = await readJsonSafe<{ user: User | null }>(res);
    
    // FIXED: Type-safe property access
    if (body && 'user' in body && body.user) {
      return body.user;
    }
    
    // Check if it's an error response
    if (body && 'error' in body) {
      console.warn("[api] fetchCurrentUser: Error in response:", body.error);
    }
    
    console.warn("[api] fetchCurrentUser: Invalid response body", body);
    return null;
  } catch (err) {
    console.warn("[api] fetchCurrentUser failed:", err);
    return null;
  }
}

/** Verify phone token (if you need it later) */
export async function verifyPhone(token: string): Promise<boolean> {
  const res = await requestJson<{ success: boolean; message?: string }>("/api/auth/verify-phone", {
    method: "POST",
    body: JSON.stringify({ token }),
    headers: getAuthHeaders(),
  });
  return !!res.success;
}

/** Resend phone verification code */
export async function resendPhoneVerification(phoneNumber: string): Promise<boolean> {
  const res = await requestJson<{ success: boolean; message?: string }>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
    headers: { "Content-Type": "application/json" },
  });
  return !!res.success;
}

/** Send verification code (sms/whatsapp) */
export async function sendVerificationCode(phoneNumber: string, method: "whatsapp" | "sms"): Promise<boolean> {
  const res = await requestJson<{ success: boolean }>("/api/auth/send-verification", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, method }),
    headers: { "Content-Type": "application/json" },
  });
  return !!res.success;
}

/** Logout (clears token on client) */
export function logoutClient(): void {
  deleteCookie("token");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }
}

/* ----------------------------- User endpoints --------------------------- */

/** Get a user's public profile by id (pulls from backend) */
export async function getUserProfile(userId: string | number) {
  try {
    // Ensure userId is valid
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error("[api] getUserProfile: Invalid userId provided:", userId);
      return null;
    }

    console.log("[api] getUserProfile: Fetching profile for userId:", userId, "type:", typeof userId);
    
    const res = await apiFetch(`/api/users/${userId}/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    
    console.log("[api] getUserProfile: Response status:", res.status);
    
    // Handle 401 for profile requests
    if (res.status === 401) {
      console.warn("[api] getUserProfile: Unauthorized (401)");
      return null;
    }
    
    const profile = await res.json();
    console.log("[api] getUserProfile: Response data:", profile);
    
    // Check if the response contains an error (even if status is 200)
    if (profile && profile.error && !profile.id) {
      console.error("[api] getUserProfile error:", profile.error);
      return null;
    }
    
    if (!res.ok) {
      const errorMsg = profile?.error || `Failed to get profile: ${res.status}`;
      console.error("[api] getUserProfile: Request failed:", errorMsg);
      throw new Error(errorMsg);
    }
    
    // Ensure profile has required fields
    if (!profile || !profile.id) {
      console.error("[api] getUserProfile: Invalid profile data returned");
      return null;
    }
    
    return profile;
  } catch (err) {
    console.error("[api] getUserProfile error:", err);
    return null;
  }
}

/** Update current user's profile (backend is source of truth) */
export async function updateUserProfile(updates: Partial<User>) {
  const res = await apiFetch("/api/user/update", {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  
  // Handle 401 for update requests
  if (res.status === 401) {
    throw new Error("Authentication required");
  }
  
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Update failed: ${res.status} ${txt}`);
  }
  return await res.json();
}

/* ----------------------------- Posts endpoints -------------------------- */

export async function getPosts({ page = 1, limit = 20, q = "" }: { page?: number; limit?: number; q?: string } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  const res = await apiFetch(`/api/posts?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  
  // Handle 401 for posts requests
  if (res.status === 401) {
    return [];
  }
  
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to fetch posts: ${res.status} ${txt}`);
  }
  const body = await res.json();
  return body.posts || [];
}

export async function getPost(postId: string | number) {
  const res = await apiFetch(`/api/posts/${postId}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  
  // Handle 401 for single post requests
  if (res.status === 401) {
    throw new Error("Authentication required");
  }
  
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to fetch post: ${res.status} ${txt}`);
  }
  return await res.json();
}

export async function createPost(payload: any) {
  const isForm = payload instanceof FormData;
  const token = getToken();
  
  const res = await apiFetch(`/api/posts`, {
    method: "POST",
    body: isForm ? (payload as any) : JSON.stringify(payload),
    headers: isForm ? { 
      ...(token && isValidToken(token) ? { Authorization: `Bearer ${token}` } : {})
    } : getAuthHeaders(),
    credentials: "include",
  });
  
  // Handle 401 for post creation
  if (res.status === 401) {
    throw new Error("Authentication required");
  }
  
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || `Failed to create post (${res.status})`);
  }
  return await res.json();
}

/* --------------------------- Comments endpoints ------------------------- */

export async function postComment(postId: string | number, content: string) {
  const res = await apiFetch(`/api/comments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ postId, content }),
  });
  
  // Handle 401 for comment posts
  if (res.status === 401) {
    throw new Error("Authentication required");
  }
  
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to post comment: ${res.status} ${txt}`);
  }
  return await res.json();
}

/* ------------------------ Notifications endpoints ---------------------- */

export async function getNotifications({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await apiFetch(`/api/notifications?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  // Handle 401 for notifications
  if (res.status === 401) {
    return [];
  }
  
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to fetch notifications: ${res.status} ${txt}`);
  }
  const body = await res.json();
  return body.notifications || [];
}

export async function markNotificationRead(notificationId: string | number) {
  const res = await apiFetch(`/api/notifications/${notificationId}/read`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  
  // Handle 401 for notification updates
  if (res.status === 401) {
    throw new Error("Authentication required");
  }
  
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to mark read: ${res.status} ${txt}`);
  }
  return await res.json();
}

/* ---------------------- Misc / Utility endpoints ----------------------- */

export async function enhancedSearch(q: string, opts: { limit?: number; type?: string } = {}) {
  const params = new URLSearchParams({ q, limit: String(opts.limit || 10) });
  if (opts.type) params.set("type", opts.type);
  const res = await apiFetch(`/api/search?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  
  // Handle 401 for search
  if (res.status === 401) {
    return { users: [], posts: [] };
  }
  
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Search failed: ${res.status} ${txt}`);
  }
  return await res.json();
}

/* ---------------------- Admin / Maintenance helpers -------------------- */

export async function pingHealth() {
  try {
    const res = await apiFetch("/api/health", { method: "GET", headers: getAuthHeaders() });
    return await readJsonSafe(res);
  } catch (err) {
    console.warn("[api] pingHealth failed:", err);
    return null;
  }
}

/* -------------------------- Backwards compat helpers ------------------- */

export async function getCurrentUserSafe(): Promise<User | null> {
  return await fetchCurrentUser();
}

/* ----------------------------- Exports ---------------------------------- */
const api = {
  apiFetch,
  tryDirectConnection,
  readJsonSafe,
  getToken,
  getAuthHeaders,
  isValidToken,
  // auth
  signUp,
  signIn,
  fetchCurrentUser,
  verifyPhone,
  resendPhoneVerification,
  sendVerificationCode,
  logoutClient,
  // user
  getUserProfile,
  updateUserProfile,
  // posts/comments
  getPosts,
  getPost,
  createPost,
  postComment,
  // notifications
  getNotifications,
  markNotificationRead,
  // misc
  enhancedSearch,
  pingHealth,
  getCurrentUserSafe,
};

export default api;