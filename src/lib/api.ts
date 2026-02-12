export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = ""; // same-origin; Next.js rewrites /api to backend in production
const DIRECT_API_BASE = process.env.BACKEND_URL || "https://demedia-backend.fly.dev"; // direct backend fallback

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

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
};

/* ------------------------------------------------------------------------- */
/* -------------------------- Auth helpers --------------------------------- */
/* ------------------------------------------------------------------------- */

/** Get token from cookies first, then localStorage as fallback (matches AuthContext behavior) */
export function getToken(): string | null {
  // First try cookies (primary storage)
  const cookieToken = getCookie("token");
  if (cookieToken) {
    console.log('🔑 Token retrieved from cookies');
    return cookieToken;
  }

  // Fallback to localStorage (secondary storage)
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem("token");
    if (localToken) {
      console.log('🔑 Token retrieved from localStorage (fallback)');
      return localToken;
    }
  }

  console.warn('⚠️ No token found in cookies or localStorage');
  return null;
}

/** Return headers including Authorization if token exists */
export function getAuthHeaders(userId?: string | number): Record<string, string> {
  const token = getToken();
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Always add Authorization if token exists
  if (token) {
    base["Authorization"] = `Bearer ${token}`;
  }

  // Use consistent header name - make sure it matches what backend expects
  if (userId) {
    base["user-id"] = String(userId);
  }

  return base;
}

/* ------------------------------------------------------------------------- */
/* ---------------------- Robust fetch / retry logic ----------------------- */
/* ------------------------------------------------------------------------- */

export async function apiFetch(path: string, options: RequestInit = {}, userId?: string | number): Promise<Response> {
  // Get token and build headers
  const headers = getAuthHeaders(userId);

  // For FormData, completely omit Content-Type to let browser set multipart boundary
  if (options.body && options.body instanceof FormData) {
    delete headers["Content-Type"];
  } else if (!headers["Content-Type"] && options.body) {
    headers["Content-Type"] = "application/json";
  }

  // Build URL - NO CACHE BUSTING for auth/API requests
  const method = ((options.method || "GET") as string).toUpperCase();
  let url = `${API_BASE}${path}`;
  
  // IMPORTANT: Do NOT add cache busting to auth/API requests
  // This was causing authentication failures by:
  // 1. Adding query parameters that backend doesn't expect
  // 2. Interfering with request parsing
  // 3. Breaking token validation
  
  try {
    const fetchHeaders = {
      ...headers,
      // Minimal cache control - don't be too aggressive
      'Cache-Control': 'no-cache',
    };

    const fetchOptions: RequestInit = {
      ...options,
      headers: fetchHeaders,
      cache: "no-store",
      credentials: "include",
    };

    console.log(`🔄 API Request: ${method} ${url}`);
    const res = await fetch(url, fetchOptions);
    console.log(`📡 API Response: ${res.status}`);

    return res;
  } catch (err: any) {
    console.error(`❌ API Error: ${method} ${url}`, err);
    throw err;
  }
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

  // Try to capture raw response text once for logging and error messages
  let rawText: string | null = null;
  try {
    rawText = await res.clone().text();
  } catch {
    // ignore clone/text failures
  }

  const parsed = await readJsonSafe<T | { error?: string; message?: string }>(res);

  if (!res.ok && res.status !== 401) {
    const backendMsg =
      (parsed as any)?.error ||
      (parsed as any)?.message ||
      rawText ||
      res.statusText;

    console.error("[api] requestJson error", {
      path,
      status: res.status,
      backendMsg,
      rawBodyPreview: rawText ? rawText.substring(0, 500) : null,
    });

    // Throw with the backend's message so callers (AuthContext) can show it directly
    throw new Error(backendMsg || `Request failed with status ${res.status}`);
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
  });
  return res;
}

/** Sign in (login) */
export async function signIn(payload: { phoneNumber: string; password: string }): Promise<AuthResponse> {
  const res = await requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res;
}

/** Fetch current authenticated user from backend only */
export async function fetchCurrentUser(): Promise<User | null> {
  const token = getToken();

  // Don't attempt to fetch user if no token
  if (!token) {
    console.warn("[api] fetchCurrentUser: No token");
    return null;
  }

  try {
    const res = await apiFetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });

    // Handle 401 specifically for auth/me
    if (res.status === 401) {
      console.warn("[api] fetchCurrentUser: Token invalid or expired");
      return null;
    }

    if (!res.ok) {
      console.warn("[api] fetchCurrentUser: Request failed", res.status);
      return null;
    }

    const body = await readJsonSafe<{ user: User | null }>(res);

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
  });
  return !!res.success;
}

/** Resend phone verification code */
export async function resendPhoneVerification(phoneNumber: string): Promise<boolean> {
  const res = await requestJson<{ success: boolean; message?: string }>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
  });
  return !!res.success;
}

/** Send verification code (sms/whatsapp) */
export async function sendVerificationCode(phoneNumber: string, method: "whatsapp" | "sms"): Promise<boolean> {
  const res = await requestJson<{ success: boolean }>("/api/auth/send-verification", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, method }),
  });
  return !!res.success;
}

/** Logout (clears token on client) */
export function logoutClient(): void {
  // Clear both cookie and localStorage
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
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
      cache: "no-store",
    }, userId);

    console.log("[api] getUserProfile: Response status:", res.status);

    // Handle 401 for profile requests
    if (res.status === 401) {
      console.warn("[api] getUserProfile: Unauthorized (401)");
      return null;
    }

    const profile = await res.json();

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

/* ----------------------------- Follow endpoints ------------------------- */

/** Follow a user */
export async function followUser(targetUserId: string | number, currentUserId?: string | number) {
  const res = await apiFetch(`/api/user/${targetUserId}/follow`, {
    method: "POST",
  }, currentUserId);

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Follow error ${res.status}:`, errorText);
    throw new Error("Follow request failed");
  }

  return await res.json();
}

/** Unfollow a user */
export async function unfollowUser(targetUserId: string | number, currentUserId?: string | number) {
  const res = await apiFetch(`/api/user/${targetUserId}/unfollow`, {
    method: "POST",
  }, currentUserId);

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Unfollow error ${res.status}:`, errorText);
    throw new Error("Unfollow request failed");
  }

  return await res.json();
}

/* ----------------------------- Posts endpoints -------------------------- */

export async function getPosts({ page = 1, limit = 20, q = "" }: { page?: number; limit?: number; q?: string } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  const res = await apiFetch(`/api/posts?${params.toString()}`, {
    method: "GET",
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

  const res = await apiFetch(`/api/posts`, {
    method: "POST",
    body: isForm ? payload : JSON.stringify(payload),
    headers: isForm ? {} : { "Content-Type": "application/json" },
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
  const res = await apiFetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
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
    const res = await apiFetch("/api/health", { method: "GET" });
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
  // follow
  followUser,
  unfollowUser,
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
