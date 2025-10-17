export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = ""; // same-origin; Next.js rewrite proxies /api to backend
const DIRECT_API_BASE = "https://demedia-backend.fly.dev"; // Direct backend URL as fallback

// Health check function
async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const response = await fetch('/api/health', { 
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(t);
    return response.ok;
  } catch {
    return false;
  }
}

// Fallback function to try direct backend connection
async function tryDirectConnection(path: string, options: RequestInit = {}): Promise<Response> {
  console.log('Trying direct backend connection...');
  const directUrl = `${DIRECT_API_BASE}${path}`;
  
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);
  const response = await fetch(directUrl, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
    signal: controller.signal
  });
  clearTimeout(t);
  
  return response;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
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
  // Only set Content-Type to application/json if body is not FormData
  if (!(headers as any)["Content-Type"] && options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add cache-busting for GET requests only
  let url = `${API_BASE}${path}`;
  if (options.method === 'GET' || !options.method) {
    const cacheBuster = Date.now();
    const version = 'v2.2.0'; // Force cache invalidation
    url = `${API_BASE}${path}${path.includes('?') ? '&' : '?'}cb=${cacheBuster}&v=${version}`;
  }

  // Special handling for authentication endpoints
  const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/sign-up');
  
  // Progressive timeout strategy - start with longer timeouts
  const timeouts = isAuthEndpoint ? [20000, 30000, 40000] : [15000, 25000, 35000]; // Auth gets longer timeouts
  const maxRetries = timeouts.length - 1;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const timeout = timeouts[attempt];
    try {
      console.log(`Making API request to: ${url} (attempt ${attempt + 1}, timeout: ${timeout}ms)`);
      
      // For auth endpoints, add a small delay between attempts
      if (isAuthEndpoint && attempt > 0) {
        console.log(`Waiting ${attempt * 2000}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
      
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { 
      ...options, 
      headers,
      signal: controller.signal
    });
    clearTimeout(t);
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
    
      return res;
    } catch (err: unknown) {
      lastError = err;
      console.error(`API fetch error (attempt ${attempt + 1}):`, err);
      
      // Only retry on network errors, not on auth errors
      if (attempt < maxRetries && err instanceof Error && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('NetworkError') ||
        err.message.includes('timeout') ||
        err.name === 'AbortError'
      )) {
        console.log(`Retrying request in ${(attempt + 1) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
        continue;
      }
      
      // If all retries failed, try direct connection as last resort
      if (attempt === maxRetries && err instanceof Error && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('NetworkError') ||
        err.message.includes('timeout') ||
        err.name === 'AbortError'
      )) {
        console.log('All retries failed, trying direct backend connection...');
        try {
          return await tryDirectConnection(path, options);
        } catch (directError) {
          console.error('Direct connection also failed:', directError);
          throw err; // Throw original error
        }
      }
      
      throw err;
    }
  }
  
  throw lastError;
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
        console.log('getUserProfile called with userId:', userId, 'type:', typeof userId);
        
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        
        console.log('getUserProfile auth check:', {
            hasToken: !!token,
            currentUserId,
            targetUserId: userId,
            tokenPreview: token ? token.substring(0, 20) + '...' : 'No token'
        });
        
        console.log('Auth data:', { 
            hasToken: !!token, 
            currentUserId, 
            targetUserId: userId 
        });
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (currentUserId) {
            headers['user-id'] = currentUserId;
        }

        console.log('Making profile request to:', `/api/users/${userId}/profile`);
        console.log('Request headers:', headers);

        const res = await apiFetch(`/api/users/${userId}/profile`, {
            cache: "no-store",
            headers
        });

        console.log('Profile response status:', res.status, 'ok:', res.ok);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Profile request failed:', res.status, errorText);
            throw new Error(`Failed to fetch profile: ${res.status} ${errorText}`);
        }
        
        const profileData = await res.json();
        console.log('Profile data received:', profileData);
        return profileData as UserProfileResponse;
    } catch (err) {
        console.error("Error fetching user profile:", err);
        return null; // Return null instead of throwing to handle gracefully
    }
}
