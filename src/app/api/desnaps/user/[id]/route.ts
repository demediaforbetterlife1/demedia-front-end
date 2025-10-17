import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let userId: string = '';
  let authHeader: string | null = null;
  let viewerId: string | null = null;
  let currentUserId: string | null = null;
  
  try {
    userId = params.id;
    const viewerParam = request.nextUrl.searchParams.get('viewerId');
    // Sanitize viewerId: allow only valid numeric values
    viewerId = viewerParam && !isNaN(Number(viewerParam)) ? String(Number(viewerParam)) : null;

    console.log('DeSnaps API called for user:', userId, 'viewer:', viewerId);

    // Get the authorization token
    authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Try to connect to the actual backend first
    try {
      // Extract current user id from JWT if present
      try {
        const token = authHeader.replace('Bearer ', '');
        const part = token.split('.')[1];
        const decoded = JSON.parse(Buffer.from(part, 'base64').toString('utf-8'));
        currentUserId = (decoded.sub || decoded.userId || decoded.id)?.toString?.() || null;
      } catch (_) {}

      console.log('🔄 Fetching DeSnaps via backend for user:', userId, 'viewer:', viewerId);

      const backendQuery = viewerId ? `?viewerId=${viewerId}` : '';
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/desnaps/user/${userId}${backendQuery}`, {
        headers: {
          'Authorization': authHeader,
          'user-id': currentUserId || request.headers.get('user-id') || '',
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(8000)
      });

      console.log('🔄 Backend response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('✅ DeSnaps fetched via backend:', Array.isArray(data) ? data.length : 0, 'items');
        // Ensure we always return an array for the client
        return NextResponse.json(Array.isArray(data) ? data : []);
      } else {
        const errorText = await backendResponse.text();
        console.error('❌ Backend DeSnaps fetch failed:', backendResponse.status, errorText);
        // Gracefully degrade to empty list on 5xx/404 to avoid client error loops
        if (backendResponse.status >= 500 || backendResponse.status === 404) {
          return NextResponse.json([]);
        }
        return NextResponse.json({ error: errorText || 'Failed to fetch desnaps' }, { status: backendResponse.status });
      }
    } catch (backendError) {
      console.error('❌ Backend connection failed for DeSnaps:', backendError);
      // Graceful fallback for connectivity: empty list keeps UI stable
      return NextResponse.json([]);
    }
    // No fallback
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ DeSnaps API error:', { 
      message: errorMessage, 
      stack: errorStack, 
      userId, 
      viewerId,
      authHeader: !!authHeader 
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}