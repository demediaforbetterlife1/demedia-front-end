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
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!(headers as Record<string, string>)["Content-Type"] && options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let url = `${API_BASE}${path}`;
  if (options.method === 'GET' || !options.method) {
    const cacheBuster = Date.now();
    const version = 'v2.2.0';
    url = `${API_BASE}${path}${path.includes('?') ? '&' : '?'}cb=${cacheBuster}&v=${version}`;
  }

  const isPostsEndpoint = path.includes('/posts');
  const isAuthEndpoint = path.includes('/auth');
  const method = (options.method || 'GET').toUpperCase();

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
      console.log(`Making API request to: ${url} (attempt ${attempt + 1}, timeout: ${timeout}ms)`);

      let fetchOptions: RequestInit;
      
      if (isPostsEndpoint || isAuthEndpoint) {
        fetchOptions = {
          ...options,
          headers,
          cache: 'no-cache',
          mode: 'cors',
          credentials: 'include'
        };
      } else {
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

      const res = isAuthEndpoint
        ? await Promise.race<Promise<Response>>([
            fetch(url, fetchOptions),
            new Promise<Response>((resolve) => {
              setTimeout(() => {
                const body = JSON.stringify({ error: 'Login request timed out' });
                resolve(new Response(body, { status: 504, headers: { 'Content-Type': 'application/json' } }));
              }, timeout || 20000);
            })
          ])
        : await fetch(url, fetchOptions);

      if (res.status === 401 && typeof window !== "undefined" && !path.includes('/auth/me')) {
        console.log('Auto logout due to 401 response');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      if (isAuthEndpoint && res.status === 504) {
        console.log('Auth endpoint soft-timeout, trying direct backend...');
        try {
          const directRes = await tryDirectConnection(path, { ...options, headers });
          return directRes;
        } catch (e) {
          throw new Error('Login request timed out');
        }
      }

      return res;
    } catch (err: unknown) {
      lastError = err;
      console.error(`API fetch error (attempt ${attempt + 1}):`, err);

      if (isPostsEndpoint && method === 'GET' && attempt === maxRetries) {
        console.log('Posts GET failed, returning empty data');
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const errName = (err as any)?.name || '';
      if (errName === 'AbortError') {
        console.log('Request was aborted');
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
          continue;
        }
        if (isAuthEndpoint) {
          try {
            return await tryDirectConnection(path, { ...options, headers });
          } catch {}
        }
      }

      const errMsg = ((err as any)?.message || '').toString();
      if (attempt < maxRetries && (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('timeout'))) {
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
        continue;
      }

      if (attempt === maxRetries && (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('timeout') || errName === 'AbortError')) {
        try {
          return await tryDirectConnection(path, options);
        } catch (directError) {
          console.error('Direct connection also failed:', directError);
          if (isPostsEndpoint && method === 'GET') {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          throw err;
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
    console.log('getUserProfile called with userId:', userId);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

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
    return null;
  }
}
