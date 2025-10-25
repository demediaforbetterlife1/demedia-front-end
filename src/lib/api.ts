export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = ""; // same-origin; Next.js rewrite proxies /api to backend
const DIRECT_API_BASE = "https://demedia-backend.fly.dev"; // Direct backend URL as fallback


// Fallback function to try direct backend connection
async function tryDirectConnection(path: string, options: RequestInit = {}): Promise<Response> {
  console.log('Trying direct backend connection...');
  const directUrl = `${DIRECT_API_BASE}${path}`;
  
  try {
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
    
    console.log('Direct connection response status:', response.status);
    
    // If we get a 500 error, return a mock response with empty data
    if (response.status === 500) {
      console.log('Backend returned 500 error, returning empty data');
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return response;
  } catch (error) {
    console.error('Direct connection failed:', error);
    // Return empty data as fallback
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
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

  console.log('🌐 apiFetch called:', {
    path,
    method: options.method || 'GET',
    hasToken: !!token,
    userId,
    headers: Object.keys(headers)
  });
  // Only set Content-Type to application/json if body is not FormData
  if (!(headers as Record<string, string>)["Content-Type"] && options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add cache-busting for GET requests only
  let url = `${API_BASE}${path}`;
  if (options.method === 'GET' || !options.method) {
    const cacheBuster = Date.now();
    const version = 'v2.2.0'; // Force cache invalidation
    url = `${API_BASE}${path}${path.includes('?') ? '&' : '?'}cb=${cacheBuster}&v=${version}`;
  }

  // Special handling for posts endpoint - use more conservative approach
  const isPostsEndpoint = path.includes('/posts');
  
  // For posts, use shorter timeouts and fewer retries to avoid long waits
  const timeouts = isPostsEndpoint ? [5000, 8000, 10000] : [15000, 25000, 35000];
  const maxRetries = timeouts.length - 1;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const timeout = timeouts[attempt];
    try {
      console.log(`Making API request to: ${url} (attempt ${attempt + 1}, timeout: ${timeout}ms)`);
      
      // Use a more reliable fetch approach without AbortController for posts
      let fetchOptions: RequestInit;
      
      if (isPostsEndpoint) {
        // For posts, use a simpler approach without AbortController to avoid AbortError
        fetchOptions = {
          ...options,
          headers,
          cache: 'no-cache',
          mode: 'cors',
          credentials: 'include'

        };
      } else {
        // For other endpoints, use AbortController
        const controller = new AbortController();
        setTimeout(() => {
          console.log(`Request timeout after ${timeout}ms`);
          controller.abort();
        }, timeout);
        
        fetchOptions = {
          ...options,
          headers,
          signal: controller.signal,
          cache: 'no-cache',
          mode: 'cors',
          credentials: 'omit'
        };
      }
      
      const res = await fetch(url, fetchOptions);
      console.log('📡 API response:', {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText,
        url: res.url
      });
    
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
      
      // For posts endpoint, handle errors more gracefully
      if (isPostsEndpoint && attempt === maxRetries) {
        console.log('Posts endpoint failed, returning empty data');
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle AbortError specifically
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request was aborted');
        if (attempt < maxRetries) {
          console.log(`Retrying request in ${(attempt + 1) * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
          continue;
        }
      }
      
      // Only retry on network errors
      if (attempt < maxRetries && err instanceof Error && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('NetworkError') ||
        err.message.includes('timeout')
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
          // For posts, return empty data instead of throwing
          if (isPostsEndpoint) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          throw err; // Throw original error for non-posts endpoints
        }
      }
      
      throw err;
    }
  }
  
  throw lastError;
}

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
