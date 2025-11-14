import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get the authorization token from header or cookie
    let authHeader = request.headers.get('authorization');
    
    // If no auth header, try to get token from cookie
    if (!authHeader) {
      const cookies = request.cookies;
      const token = cookies.get('token')?.value;
      if (token) {
        authHeader = `Bearer ${token}`;
      }
    }
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header or token' }, { status: 401 });
    }

    // Extract current user id from JWT (server-safe)
    let currentUserId: string | null = null;
    try {
      const token = authHeader.replace('Bearer ', '');
      const part = token.split('.')[1];
      const decoded = JSON.parse(Buffer.from(part, 'base64').toString('utf-8'));
      currentUserId = (decoded.sub || decoded.userId || decoded.id)?.toString?.() || null;
    } catch (_) {}

    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/user/${userId}/profile`, {
        headers: {
          'Authorization': authHeader,
          'user-id': currentUserId || request.headers.get('user-id') || '',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000)
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        if (data.profilePicture && typeof data.profilePicture === 'string' && !data.profilePicture.startsWith('http')) {
          data.profilePicture = `https://demedia-backend.fly.dev${data.profilePicture}`;
        }
        if (data.coverPhoto && typeof data.coverPhoto === 'string' && !data.coverPhoto.startsWith('http')) {
          data.coverPhoto = `https://demedia-backend.fly.dev${data.coverPhoto}`;
        }
        return NextResponse.json(data);
      }

      // Handle 404 specifically - return 200 with error message so component can handle it
      if (backendResponse.status === 404) {
        const text = await backendResponse.text().catch(() => 'User not found');
        console.error(`Profile not found: ${userId}`);
        return NextResponse.json({ 
          error: text || 'User profile not found',
          id: null 
        }, { status: 200 }); // Return 200 so component can handle the error
      }

      const text = await backendResponse.text();
      console.error(`Profile fetch failed: ${backendResponse.status} - ${text}`);
      return NextResponse.json({ error: text || 'Failed to fetch profile' }, { status: backendResponse.status });
    } catch (err: any) {
      console.error('Backend fetch error:', err);
      if (err.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
      }
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Forward update to backend API to keep logic centralized
    const authHeader = request.headers.get('authorization');
    const currentUserId = request.headers.get('user-id') || '';

    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/user/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || '',
          'user-id': currentUserId,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });

      if (backendResponse.ok) {
        const updatedUser = await backendResponse.json();
        return NextResponse.json(updatedUser);
      }

      const errorText = await backendResponse.text();
      return NextResponse.json({ error: errorText || 'Failed to update profile' }, { status: backendResponse.status });
    } catch (err) {
      console.error('❌ Backend update failed:', err);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}