import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://demedia-backend.fly.dev";

<<<<<<< HEAD
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;
    
    console.log('[API] Get interests request for user:', userId);

    // Get token from cookies or headers
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/users/${userId}/interests`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
    
  } catch (error: any) {
    console.error('[API] Get interests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interests' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
=======
export async function POST(request: NextRequest) {
>>>>>>> a064d07f3d2124e8ad18d897f7676c358233ac55
  try {
    // /api/users/:id/interests
    const parts = request.nextUrl.pathname.split("/");
    const userId = parts[3];

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body?.interests || !Array.isArray(body.interests)) {
      return NextResponse.json(
        { error: "Interests array is required" },
        { status: 400 }
      );
    }

    const token =
      request.cookies.get("token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
<<<<<<< HEAD
      console.error('[API] No authentication token found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/users/${userId}/interests`;
    console.log('[API] Forwarding to backend:', backendUrl);

    // Forward to backend with proper headers and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[API] Backend response status:', backendResponse.status);

      // Get response data
      let data;
      const contentType = backendResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await backendResponse.json();
      } else {
        const text = await backendResponse.text();
        console.error('[API] Non-JSON response from backend:', text);
        data = { error: 'Invalid response from server', details: text };
      }
      
      console.log('[API] Backend response data:', data);

      // If backend returned an error, pass it through
      if (!backendResponse.ok) {
        return NextResponse.json(
          data || { error: 'Failed to save interests' },
          { status: backendResponse.status }
        );
      }

      // Return the successful response
      return NextResponse.json(data, { status: 200 });
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[API] Backend request timeout');
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }
    
  } catch (error: any) {
    console.error('[API] Save interests error:', error);
    console.error('[API] Error stack:', error.stack);
    
=======
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // ✅ THE REAL BACKEND ENDPOINT:
    const forwardUrl = `${BACKEND_URL}/api/interests/${userId}/interests`;

    const backendResponse = await fetch(forwardUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await backendResponse.text();

    let data: any = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (err: any) {
>>>>>>> a064d07f3d2124e8ad18d897f7676c358233ac55
    return NextResponse.json(
      {
        error: "Failed to save interests. Please try again.",
        details: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
