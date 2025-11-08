// src/lib/api.ts
/* =========================================================================
   Central API helpers for Demedia frontend (TypeScript)
   - All user/profile data is fetched from backend endpoints (no user data
     retrieval from localStorage).
   - Only the auth token (JWT) is read/written from localStorage.
   - Robust fetch with retries, timeouts and direct-backend fallback.
   ========================================================================= */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = ""; // same-origin; Next.js rewrites /api to backend in production
const DIRECT_API_BASE = "https://demedia-backend.fly.dev"; // direct backend fallback

/* ------------------------------------------------------------------------- */
/* --------------------------- Utility helpers ----------------------------- */
/* ------------------------------------------------------------------------- */

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

/* ------------------------------------------------------------------------- */
/* -------------------------- Auth helpers --------------------------------- */
/* ------------------------------------------------------------------------- */

/** Only token is stored in localStorage — everything else pulled from backend */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Return headers including Authorization if token exists
 * userId should be passed from AuthContext, not localStorage
 */
export function getAuthHeaders(userId?: string | number): Record<string, string> {
  const token = getToken();
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) base["Authorization"] = `Bearer ${token}`;
  if (userId) base["user-id"] = String(userId);
  return base;
}

/* ------------------------------------------------------------------------- */
/* ---------------------- Robust fetch / retry logic ----------------------- */
/* ------------------------------------------------------------------------- */

export async function apiFetch(path: string, options: RequestInit = {}, userId?: string | number): Promise<Response> {
  // attach token from localStorage (userId should be passed as parameter from AuthContext)
  const token = getToken();

  // copy/merge headers
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined) || {},
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
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
          credentials: "omit",
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

      // handle unauthorized centrally
      if (res.status === 401) {
        // If it's not the auth/me check, remove token and broadcast logout
        if (typeof window !== "undefined" && !path.includes("/auth/me")) {
          localStorage.removeItem("token");
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
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

/* ------------------------------------------------------------------------- */
/* ----------------------------- API wrappers ------------------------------ */
/* ------------------------------------------------------------------------- */

/* ----------------------------- Types ------------------------------------ */

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
  if (!res.ok) {
    const errMsg = (parsed as any)?.error || (parsed as any)?.message || res.statusText;
    throw new Error(`Request failed ${res.status} - ${errMsg}`);
  }
  return parsed as T;
}

/* ----------------------------- Auth endpoints --------------------------- */

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

  if (res?.token) {
    localStorage.setItem("token", res.token);
    // userId should come from database via AuthContext, not localStorage
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

  if (res?.token) {
    localStorage.setItem("token", res.token);
    // userId should come from database via AuthContext, not localStorage
  }
  return res;
}

/** Fetch current authenticated user from backend only */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const body = await requestJson<{ user: User | null }>("/api/auth/me", {
      method: "GET",
      headers: getAuthHeaders(), // userId not needed for /auth/me endpoint
      cache: "no-store",
    });

    if (!body || !body.user) return null;
    return body.user;
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
  localStorage.removeItem("token");
  // userId should come from database via AuthContext, not localStorage
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:logout"));
}

/* ----------------------------- User endpoints --------------------------- */

/** Get a user's public profile by id (pulls from backend) */
export async function getUserProfile(userId: string | number) {
  try {
    const res = await apiFetch(`/api/users/${userId}/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Failed to get profile: ${res.status} ${txt}`);
    }
    const profile = await res.json();
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
    body: isForm ? (payload as any) : JSON.stringify(payload),
    headers: isForm ? { Authorization: `Bearer ${getToken()}` } : getAuthHeaders(),
    credentials: "include",
  });
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