// src/lib/api.ts
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = ""; // Next.js proxy (leave empty to use same origin)
const DIRECT_API_BASE = "https://demedia-backend.fly.dev"; // direct fallback

// ===== Safe JSON reader =====
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

// ===== Fallback to direct backend =====
async function tryDirectConnection(path: string, options: RequestInit = {}, authToken?: string): Promise<Response> {
  const directUrl = `${DIRECT_API_BASE}${path}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(directUrl, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response;
  } catch (error) {
    console.error("Direct connection failed:", error);
    return new Response(JSON.stringify({ error: "direct-fallback-failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ===== Unified API Fetch Wrapper =====
export async function apiFetch(path: string, options: RequestInit = {}, authToken?: string): Promise<Response> {
  // fallback to localStorage token (client-side) if authToken not provided
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("token") || undefined;
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  if (!headers["Content-Type"] && options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let url = `${API_BASE}${path}`;
  // attach cache-buster on GETs to avoid stale cached responses in client
  if (options.method === "GET" || !options.method) {
    const cacheBuster = Date.now();
    const version = "v2.3.0";
    url = `${API_BASE}${path}${path.includes("?") ? "&" : "?"}cb=${cacheBuster}&v=${version}`;
  }

  const isPostsEndpoint = path.includes("/posts");
  const isAuthEndpoint = path.includes("/auth");
  const timeouts = isPostsEndpoint
    ? [5000, 8000, 10000]
    : isAuthEndpoint
    ? [20000]
    : [15000, 25000, 35000];

  const maxRetries = timeouts.length - 1;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const timeout = timeouts[attempt];
    try {
      console.log(`🌍 API request → ${url} (attempt ${attempt + 1})`);

      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        ...options,
        headers,
        cache: "no-cache",
        mode: "cors",
        credentials: "include",
        signal: controller.signal,
      };

      const res = await fetch(url, fetchOptions);
      clearTimeout(t);

      // ✅ إذا الـ response رجع token، خزّنه في localStorage (client-side) — لكن لا نفترض أن كل طلب يرد token
      if (typeof window !== "undefined") {
        try {
          const clone = res.clone();
          const data = await clone.json().catch(() => null);
          if (data && data.token && typeof data.token === "string") {
            localStorage.setItem("token", data.token);
          }
        } catch (e) {
          // ignore json parse errors
        }
      }

      if (res.status === 401 && typeof window !== "undefined" && !path.includes("/auth/me")) {
        // Not forced logout — emit event so UI can decide (or silent)
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }

      if (!res.ok && attempt < maxRetries) {
        // retry after short delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      console.error(`API fetch error (attempt ${attempt + 1}):`, err);

      if (attempt === maxRetries) {
        // try direct backend fallback as last resort
        return tryDirectConnection(path, options, authToken);
      }

      // small backoff before next attempt
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  throw lastError;
}

// ===== User Profile Fetcher =====
interface UserProfileResponse {
  id: number;
  name: string;
  username: string;
  email?: string;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  profilePicture?: string | null;
  coverPhoto?: string | null;
  createdAt?: string;
  followersCount?: number;
  followingCount?: number;
  likesCount?: number;
  privacy?: string;
  stories?: Array<{
    id: number;
    content: string;
    createdAt: string;
  }>;
}

export async function getUserProfile(userId: string | number, authToken?: string): Promise<UserProfileResponse | null> {
  try {
    const res = await apiFetch(`/api/users/${userId}/profile`, {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    }, authToken);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch profile: ${res.status} ${text}`);
    }

    return (await res.json()) as UserProfileResponse;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}