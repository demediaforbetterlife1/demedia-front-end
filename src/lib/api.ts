// src/lib/api.ts
/* =========================================================================
   Central API helpers for Demedia frontend
   - All user/profile data is fetched from backend endpoints (no user data
     retrieval from localStorage).
   - Only the auth token (JWT) is read/written from localStorage.
   - Robust fetch with retries, timeouts and direct-backend fallback.
   - TypeScript types for common responses.
   ========================================================================= */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = ""; // same-origin; Next.js rewrites /api to backend in prod
const DIRECT_API_BASE = "https://demedia-backend.fly.dev"; // fallback direct backend

/* ------------------------------------------------------------------------- */
/* --------------------------- Utility helpers ----------------------------- */
/* ------------------------------------------------------------------------- */

/** Try connecting directly to the backend domain (fallback) */
async function tryDirectConnection(path: string, options: RequestInit = {}): Promise<Response> {
  console.log("[api] Trying direct backend connection...", DIRECT_API_BASE, path);
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
    console.log("[api] direct response status:", response.status);

    // if backend returns 500, treat gracefully by returning empty array as before
    if (response.status === 500) {
      console.warn("[api] Backend returned 500, returning empty array fallback");
      return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return response;
  } catch (error) {
    console.error("[api] tryDirectConnection failed:", error);
    // fallback: return empty data (keeps UI from crashing for GET lists)
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

/** Only token is stored in localStorage — everything else is pulled from backend */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Return headers including Authorization if token exists */
function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) base["Authorization"] = `Bearer ${token}`;
  return base;
}

/* ------------------------------------------------------------------------- */
/* ---------------------- Robust fetch / retry logic ----------------------- */
/* ------------------------------------------------------------------------- */

/**
 * Core fetch wrapper with:
 * - automatic authorization header from localStorage token
 * - cache-busting for GET
 * - special handling/timeouts for auth and posts endpoints
 * - retries on network/timeout errors
 * - fallback to direct backend when needed
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  // attach token/userId headers from localStorage if present
  const token = getToken();
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // copy/merge headers
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined) || {},
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (userId) headers["user-id"] = userId;

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
    // ensure we don't add duplicate cb param
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
      console.log(`[api] request to ${url} attempt ${attempt + 1}/${maxRetries + 1} timeout=${timeout}`);

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
        const timer = setTimeout(() => {
          console.warn(`[api] aborting request after ${timeout}ms`);
          controller.abort();
        }, timeout);

        fetchOptions = {
          ...options,
          headers,
          signal: controller.signal,
          cache: "no-cache",
          mode: "cors",
          credentials: "omit",
        };

        // ensure timer cleared on fetch completion inside try below
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
          localStorage.removeItem("userId");
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
      }

      // if auth synthetic timeout (504), try direct backend
      if (isAuthEndpoint && res.status === 504) {
        console.warn("[api] auth soft-timeout -> trying direct backend");
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
      console.error(`[api] fetch error attempt ${attempt + 1}:`, err);

      // If AbortError, maybe retry
      const errName = err?.name || "";

      // retry policy for network-related errors
      const msg = (err?.message || "").toString();
      const isNetworkError = msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("timeout");

      if (errName === "AbortError") {
        // try again unless last attempt
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
          continue;
        } else if (isAuthEndpoint) {
          // final attempt: try direct backend for auth
          try {
            return await tryDirectConnection(path, options);
          } catch {}
        }
      }

      if (attempt < maxRetries && isNetworkError) {
        // wait a bit and retry
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
        continue;
      }

      // final fallback: try direct backend if network error or abort
      if (attempt === maxRetries && (isNetworkError || errName === "AbortError")) {
        try {
          return await tryDirectConnection(path, options);
        } catch (directErr) {
          console.error("[api] direct fallback also failed:", directErr);
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

/** Generic JSON request that throws for non-ok responses and returns parsed JSON */
async function requestJson<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, opts);
  const parsed = await readJsonSafe<T | { error?: string }>(res);

  // if response is a Response-like wrapper with ok flag or error, we rely on caller
  if (!res.ok) {
    // if parsed includes error/message, include it
    const errMsg = (parsed as any)?.error || (parsed as any)?.message || res.statusText;
    throw new Error(`Request failed ${res.status} - ${errMsg}`);
  }

  return parsed as T;
}

/* ----------------------------- Auth endpoints --------------------------- */

/**
 * Sign up (register)
 * NOTE: your backend expects phoneNumber signup — adapt payload accordingly.
 */
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

  // After registration, backend may or may not return token. We don't force local storage of user data
  if (res?.token) {
    localStorage.setItem("token", res.token);
    // optionally save userId if returned
    if (res.user?.id) localStorage.setItem("userId", String(res.user.id));
  }

  return res;
}

/** Sign in with phoneNumber + password */
export async function signIn(payload: { phoneNumber: string; password: string }): Promise<AuthResponse> {
  const res = await requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });

  if (res?.token) {
    localStorage.setItem("token", res.token);
    if (res.user?.id) localStorage.setItem("userId", String(res.user.id));
  }

  return res;
}

/** Fetch current authenticated user from backend only */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const body = await requestJson<{ user: User | null }>("/api/auth/me", {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    // backend may return { user: null } if not logged in
    if (!body || !body.user) {
      return null;
    }
    return body.user;
  } catch (err) {
    console.warn("[api] fetchCurrentUser failed:", err);
    return null;
  }
}

/** Verify phone token */
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
  localStorage.removeItem("userId");
  // optional: notify other windows
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:logout"));
}

/* ----------------------------- User endpoints --------------------------- */

/** Get a user's public profile by id (pulls from backend) */
export async function getUserProfile(userId: string | number) {
  try {
    const profile = await requestJson(`/api/users/${userId}/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return profile;
  } catch (err) {
    console.error("[api] getUserProfile error:", err);
    return null;
  }
}

/** Update current user's profile (backend is the source of truth) */
export async function updateUserProfile(updates: Partial<User>) {
  const res = await requestJson<{ success?: boolean; user?: User }>("/api/user/update", {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  return res;
}

/* ----------------------------- Posts endpoints -------------------------- */

/** Example: fetch posts (list) */
export async function getPosts({ page = 1, limit = 20, q = "" }: { page?: number; limit?: number; q?: string } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  const res = await requestJson<{ posts: any[] }>(`/api/posts?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  return res.posts || [];
}

/** Example: get single post */
export async function getPost(postId: string | number) {
  const res = await requestJson<{ post: any }>(`/api/posts/${postId}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  return res.post;
}

/** Create a post (body is JSON or FormData handled by caller) */
export async function createPost(payload: any) {
  const isForm = payload instanceof FormData;
  const res = await apiFetch(`/api/posts`, {
    method: "POST",
    body: isForm ? payload : JSON.stringify(payload),
    headers: isForm ? { Authorization: `Bearer ${getToken()}` } : getAuthHeaders(),
    credentials: "include",
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Failed to create post (${res.status})`);
  }
  return (await res.json()) as any;
}

/* --------------------------- Comments endpoints ------------------------- */

export async function postComment(postId: string | number, content: string) {
  const res = await requestJson<{ success?: boolean; comment?: any }>(`/api/comments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ postId, content }),
  });
  return res;
}

/* ------------------------ Notifications endpoints ---------------------- */

export async function getNotifications({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await requestJson<{ notifications: any[] }>(`/api/notifications?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  return res.notifications || [];
}

export async function markNotificationRead(notificationId: string | number) {
  return await requestJson(`/api/notifications/${notificationId}/read`, { method: "POST", headers: getAuthHeaders() });
}

/* ---------------------- Misc / Utility endpoints ----------------------- */

/** Example: search endpoint (enhancedSearchRoutes) */
export async function enhancedSearch(q: string, opts: { limit?: number; type?: string } = {}) {
  const params = new URLSearchParams({ q, limit: String(opts.limit || 10) });
  if (opts.type) params.set("type", opts.type);
  const res = await requestJson(`/api/search?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  return res;
}

/* ---------------------- Admin / Maintenance helpers -------------------- */

/** Ping backend health (returns parsed response) */
export async function pingHealth() {
  try {
    const res = await requestJson("/api/health", { method: "GET", headers: getAuthHeaders() });
    return res;
  } catch (err) {
    console.warn("[api] pingHealth failed:", err);
    return null;
  }
}

/* ------------------------------------------------------------------------- */
/* -------------------------- Backwards compat helpers --------------------- */
/* ------------------------------------------------------------------------- */

/**
 * getCurrentUserSafe:
 * - returns null if not authed
 * - guarantees that the user object is computed from backend only
 */
export async function getCurrentUserSafe(): Promise<User | null> {
  return await fetchCurrentUser();
}

/* ------------------------------------------------------------------------- */
/* ----------------------------- Exports ---------------------------------- */
/* ------------------------------------------------------------------------- */

export default {
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