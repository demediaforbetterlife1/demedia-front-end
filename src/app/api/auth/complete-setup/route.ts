import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Try to get token from cookie first, then fall back to Authorization header
    let token = request.cookies.get('token')?.value;
    
    if (!token) {
      // Fallback to Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token found' }, { status: 401 });
    }

    const userId = request.headers.get('user-id');
    
    // Extract userId from JWT if not provided in header
    let targetUserId = userId;
    if (!targetUserId) {
      try {
        const part = token.split('.')[1];
        const decoded = JSON.parse(Buffer.from(part, 'base64').toString('utf-8'));
        targetUserId = (decoded.sub || decoded.userId || decoded.id)?.toString?.() || null;
      } catch (err) {
        console.error('Failed to decode JWT:', err);
      }
    }

    // Get request body to forward dob if provided
    const body = await request.json().catch(() => ({}));

    // Call backend complete-setup endpoint (auth route, not user route)
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/auth/complete-setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cookie': `token=${token}`, // Forward cookie for backend auth
        },
        body: JSON.stringify(body), // Forward the request body (may contain dob)
        signal: AbortSignal.timeout(10000)
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }

      const errorText = await backendResponse.text();
      console.error('Backend complete-setup failed:', backendResponse.status, errorText);
      return NextResponse.json({ error: errorText || 'Failed to complete setup' }, { status: backendResponse.status });
    } catch (err) {
      console.error('Backend connection failed:', err);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error('Error completing setup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}