// src/lib/api.ts
/* =========================================================================
   Robust API helper for Demedia frontend
   - All data fetched from backend (backend is source of truth)
   - JWT stored in localStorage, auto-attached to requests
   - Retry logic, timeouts, direct-backend fallback
   - TypeScript types for responses
   ========================================================================= */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = ""; // Next.js /api rewrites
const DIRECT_API_BASE = "https://demedia-backend.fly.dev";

/* ------------------------------------------------------------------------- */
/* --------------------------- Utility helpers ----------------------------- */
/* ------------------------------------------------------------------------- */

async function tryDirectConnection(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${DIRECT_API_BASE}${path}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { ...options, signal: controller.signal, credentials: "include" });
    clearTimeout(timer);
    return res.status === 500
      ? new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } })
      : res;
  } catch (err) {
    return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}

export async function readJsonSafe<T = unknown>(res: Response): Promise<T | { error?: string }> {
  try { return await res.json() as T; }
  catch { 
    try { const txt = await res.text(); return { error: txt || res.statusText }; } 
    catch { return { error: res.statusText }; } 
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/* ------------------------------------------------------------------------- */
/* ---------------------- Robust fetch / retry logic ----------------------- */
/* ------------------------------------------------------------------------- */

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  let url = `${API_BASE}${path}`;
  const method = ((options.method || "GET") as string).toUpperCase();
  if (method === "GET") url += `${path.includes("?") ? "&" : "?"}cb=${Date.now()}&v=client-1`;

  const isAuth = path.includes("/auth");
  const timeouts = isAuth ? [20000] : [15000, 25000, 35000];
  const maxRetries = timeouts.length - 1;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeouts[attempt]);
      const res: Response = await fetch(url, { ...options, headers, signal: controller.signal, credentials: "include" });
      clearTimeout(timer);

      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }

      if (isAuth && res.status === 504) return await tryDirectConnection(path, { ...options, headers });

      return res;
    } catch (err: any) {
      lastError = err;
      const msg = (err?.message || "").toString();
      const isNetworkError = msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("timeout");

      if (attempt < maxRetries && (isNetworkError || err?.name === "AbortError")) await new Promise(r => setTimeout(r, (attempt + 1) * 1000));
      else if (attempt === maxRetries) return await tryDirectConnection(path, options);
    }
  }

  throw lastError;
}

/* ------------------------------------------------------------------------- */
/* -------------------------- Types --------------------------------------- */
/* ------------------------------------------------------------------------- */

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
  age?: number | null;
  language?: string | null;
  isSetupComplete?: boolean;
  isPhoneVerified?: boolean;
  interests?: string[];
  createdAt?: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  media?: string[];
  createdAt: string;
  updatedAt?: string;
  likes?: number;
  comments?: number;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------------- */
/* ----------------------------- API Wrappers ----------------------------- */
/* ------------------------------------------------------------------------- */

async function requestJson<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, opts);
  const parsed = await readJsonSafe<T | { error?: string }>(res);
  if (!res.ok) throw new Error((parsed as any)?.error || (parsed as any)?.message || res.statusText);
  return parsed as T;
}

/* ---------------------- Auth ---------------------- */
export async function signUp(payload: { name: string; username: string; phoneNumber: string; password: string }): Promise<{ token?: string; user?: User; requiresPhoneVerification?: boolean }> {
  const res = await requestJson<{ token?: string; user?: User; requiresPhoneVerification?: boolean }>("/api/auth/sign-up", { method: "POST", body: JSON.stringify(payload) });
  if (res.token) localStorage.setItem("token", res.token);
  if (res.user?.id) localStorage.setItem("userId", res.user.id);
  return res;
}

export async function signIn(payload: { phoneNumber: string; password: string }): Promise<{ token?: string; user?: User; requiresPhoneVerification?: boolean }> {
  const res = await requestJson<{ token?: string; user?: User; requiresPhoneVerification?: boolean }>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
  if (res.token) localStorage.setItem("token", res.token);
  if (res.user?.id) localStorage.setItem("userId", res.user.id);
  return res;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await requestJson<{ user: User | null }>("/api/auth/me", { method: "GET", headers: getAuthHeaders(), cache: "no-store" });
    return res.user || null;
  } catch { return null; }
}

export async function verifyPhone(token: string): Promise<boolean> {
  const res = await requestJson<{ success: boolean }>("/api/auth/verify-phone", { method: "POST", body: JSON.stringify({ token }), headers: getAuthHeaders() });
  return !!res.success;
}

export async function resendPhoneVerification(phoneNumber: string): Promise<boolean> {
  const res = await requestJson<{ success: boolean }>("/api/auth/resend-verification", { method: "POST", body: JSON.stringify({ phoneNumber }), headers: { "Content-Type": "application/json" } });
  return !!res.success;
}

export async function sendVerificationCode(phoneNumber: string, method: "whatsapp" | "sms"): Promise<boolean> {
  const res = await requestJson<{ success: boolean }>("/api/auth/send-verification", { method: "POST", body: JSON.stringify({ phoneNumber, method }), headers: { "Content-Type": "application/json" } });
  return !!res.success;
}

export function logoutClient() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:logout"));
}

/* ---------------------- User ---------------------- */
export async function getUserProfile(userId: string): Promise<User | null> {
  try { return await requestJson<User>(`/api/users/${userId}/profile`, { method: "GET", headers: getAuthHeaders(), cache: "no-store" }); } 
  catch { return null; }
}

export async function updateUserProfile(updates: Partial<User>): Promise<User | null> {
  try {
    const res = await requestJson<{ user: User }>("/api/user/update", { method: "PATCH", body: JSON.stringify(updates), headers: getAuthHeaders() });
    return res.user || null;
  } catch { return null; }
}

/* ---------------------- Posts ---------------------- */
export async function getPosts(params: { page?: number; limit?: number; q?: string } = {}): Promise<Post[]> {
  const searchParams = new URLSearchParams({ page: String(params.page || 1), limit: String(params.limit || 20) });
  if (params.q) searchParams.set("q", params.q);
  const res = await requestJson<{ posts: Post[] }>(`/api/posts?${searchParams.toString()}`, { method: "GET", headers: getAuthHeaders(), cache: "no-store" });
  return res.posts || [];
}

export async function getPost(postId: string): Promise<Post | null> {
  try { return await requestJson<{ post: Post }>(`/api/posts/${postId}`, { method: "GET", headers: getAuthHeaders(), cache: "no-store" }).then(r => r.post); }
  catch { return null; }
}

export async function createPost(payload: any): Promise<Post> {
  const isForm = payload instanceof FormData;
  const res = await apiFetch(`/api/posts`, { method: "POST", body: isForm ? payload : JSON.stringify(payload), headers: isForm ? { Authorization: `Bearer ${getToken()}` } : getAuthHeaders(), credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

/* ---------------------- Comments ---------------------- */
export async function postComment(postId: string, content: string) {
  return await requestJson(`/api/comments`, { method: "POST", body: JSON.stringify({ postId, content }), headers: getAuthHeaders() });
}

/* ---------------------- Notifications ---------------------- */
export async function getNotifications(params: { page?: number; limit?: number } = {}): Promise<Notification[]> {
  const searchParams = new URLSearchParams({ page: String(params.page || 1), limit: String(params.limit || 20) });
  const res = await requestJson<{ notifications: Notification[] }>(`/api/notifications?${searchParams.toString()}`, { method: "GET", headers: getAuthHeaders(), cache: "no-store" });
  return res.notifications || [];
}

export async function markNotificationRead(notificationId: string) {
  return await requestJson(`/api/notifications/${notificationId}/read`, { method: "POST", headers: getAuthHeaders() });
}

/* ---------------------- Misc ---------------------- */
export async function enhancedSearch(q: string, opts: { limit?: number; type?: string } = {}) {
  const params = new URLSearchParams({ q, limit: String(opts.limit || 10) });
  if (opts.type) params.set("type", opts.type);
  return await requestJson(`/api/search?${params.toString()}`, { method: "GET", headers: getAuthHeaders(), cache: "no-store" });
}

export async function pingHealth() { return await requestJson(`/api/health`, { method: "GET", headers: getAuthHeaders() }); }

export async function getCurrentUserSafe(): Promise<User | null> { return await fetchCurrentUser(); }

export default {
  apiFetch,
  getToken,
  getAuthHeaders,
  signUp,
  signIn,
  fetchCurrentUser,
  verifyPhone,
  resendPhoneVerification,
  sendVerificationCode,
  logoutClient,
  getUserProfile,
  updateUserProfile,
  getPosts,
  getPost,
  createPost,
  postComment,
  getNotifications,
  markNotificationRead,
  enhancedSearch,
  pingHealth,
  getCurrentUserSafe,
};