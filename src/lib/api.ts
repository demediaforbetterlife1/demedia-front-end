export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = ""; // same-origin; Next.js rewrite proxies /api to backend

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch(path: string, options: RequestInit = {}, retryCount = 3): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (userId) {
    headers["user-id"] = userId;
  }
  if (!(headers as any)["Content-Type"] && options.body) {
    headers["Content-Type"] = "application/json";
  }

  // Add cache-busting for GET requests only
  let url = `${API_BASE}${path}`;
  if (options.method === 'GET' || !options.method) {
    const cacheBuster = Date.now();
    const version = 'v2.2.0'; // Force cache invalidation
    url = `${API_BASE}${path}${path.includes('?') ? '&' : '?'}cb=${cacheBuster}&v=${version}`;
  }

  try {
    console.log('Making API request to:', url);
    const res = await fetch(url, { 
      ...options, 
      headers,
      // Add timeout for better error handling
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    console.log('API response status:', res.status);
    
    if (res.status === 401) {
      // Only auto logout if it's not an auth check request
      if (typeof window !== "undefined" && !path.includes('/auth/me')) {
        console.log('Auto logout due to 401 response');
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        // Dispatch a custom event to notify AuthContext
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    
    // Retry on server errors, network errors, and rate limiting
    if (!res.ok && retryCount > 0 && (
      res.status >= 500 || 
      res.status === 429 || 
      res.status === 408 ||
      res.status === 0 // Network error
    )) {
      console.log(`Retrying request, attempts left: ${retryCount}`);
            await delay(300 * (4 - retryCount)); // Faster progressive delay
      return apiFetch(path, options, retryCount - 1);
    }
    return res;
  } catch (err: unknown) {
    console.error('API fetch error:', err);
    if (retryCount > 0 && (
      err instanceof TypeError || // Network error
      (err instanceof Error && err.name === 'AbortError') || // Timeout
      (err instanceof Error && err.message?.includes('Failed to fetch')) ||
      (err instanceof Error && err.message?.includes('NetworkError')) ||
      (err instanceof Error && err.message?.includes('signal timed out'))
    )) {
      console.log(`Retrying request due to network/timeout error, attempts left: ${retryCount}`);
      await delay(500 * (4 - retryCount)); // Progressive delay
      return apiFetch(path, options, retryCount - 1);
    }
    throw err;
  }
}

export async function readJsonSafe<T = any>(res: Response): Promise<T | { error?: string }> {
	try {
		return (await res.json()) as T;
	} catch (_) {
		try {
			const txt = await res.text();
			return { error: txt || res.statusText };
		} catch (_) {
			return { error: res.statusText };
		}
	}
}

interface UserProfileResponse {
    id: number;
    name: string;
    username: string;
    email: string;
    bio: string | null;
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
        const res = await fetch(`/api/user/${userId}/profile`, {
            cache: "no-store", // عشان ما يكاشي
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to fetch profile: ${res.status} ${errorText}`);
        }
        
        return await res.json() as UserProfileResponse;
    } catch (err) {
        console.error("Error fetching user profile:", err);
        return null; // Return null instead of throwing to handle gracefully
    }
}
