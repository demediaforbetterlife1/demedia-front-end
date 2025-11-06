export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = ""; // Next.js proxy to backend (same-origin)
const DIRECT_API_BASE = "https://demedia-backend.fly.dev"; // Direct backend URL as fallback

// ===== Direct fallback request =====
async function tryDirectConnection(path: string, options: RequestInit = {}): Promise<Response> {
  console.log("Trying direct backend connection...");
  const directUrl = `${DIRECT_API_BASE}${path}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(directUrl, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ مهم جدًا علشان يبعث الكوكيز
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 500) {
      console.log("Backend returned 500 error, returning empty data");
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return response;
  } catch (error) {
    console.error("Direct connection failed:", error);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ===== Unified fetch wrapper =====
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!headers["Content-Type"] && options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let url = `${API_BASE}${path}`;
  if (options.method === "GET" || !options.method) {
    const cacheBuster = Date.now();
    const version = "v2.2.0";
    url = `${API_BASE}${path}${path.includes("?") ? "&" : "?"}cb=${cacheBuster}&v=${version}`;
  }

  const isPostsEndpoint = path.includes("/posts");
  const isAuthEndpoint = path.includes("/auth");
  const method = (options.method || "GET").toUpperCase();

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
      console.log(`Making API request to: ${url} (attempt ${attempt + 1})`);

      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        ...options,
        headers,
        cache: "no-cache",
        mode: "cors",
        credentials: "include", // ✅ أضفناها هنا كمان لكل الطلبات
        signal: controller.signal,
      };

      const res = await fetch(url, fetchOptions);
      clearTimeout(t);

      if (res.status === 401 && typeof window !== "undefined" && !path.includes("/auth/me")) {
        console.log("Auto logout due to 401");
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }

      if (!res.ok && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      console.error(`API fetch error (attempt ${attempt + 1}):`, err);

      if (attempt === maxRetries) {
        console.log("Trying direct backend fallback...");
        return await tryDirectConnection(path, options);
      }
    }
  }

  throw lastError;
}

// ===== Safe JSON Reader =====
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

// ===== User Profile Fetcher =====
interface UserProfileResponse {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  profilePicture: string | null;
  coverPhoto: string | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  privacy?: string;
  stories: Array<{
    id: number;
    content: string;
    createdAt: string;
  }>;
}

export async function getUserProfile(userId: string | number): Promise<UserProfileResponse | null> {
  try {
    const res = await apiFetch(`/api/users/${userId}/profile`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

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