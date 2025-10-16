import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const viewerId = request.nextUrl.searchParams.get('viewerId');

    console.log('DeSnaps API called for user:', userId, 'viewer:', viewerId);

    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Try to connect to the actual backend first
    try {
      console.log('🔄 Fetching DeSnaps via backend for user:', userId, 'viewer:', viewerId);

      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/desnaps/user/${userId}?viewerId=${viewerId}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      console.log('🔄 Backend response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('✅ DeSnaps fetched via backend:', data.length, 'items');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.error('❌ Backend DeSnaps fetch failed:', backendResponse.status, errorText);
        // Don't throw error, continue to fallback
      }
    } catch (backendError) {
      console.error('❌ Backend connection failed for DeSnaps (using fallback):', backendError);
      console.log('🔄 Using fallback for DeSnaps');
      // Don't throw error, continue to fallback
    }

    // Fallback: Return empty array if backend is not available
    console.log('Backend not available for DeSnaps, returning empty array');
    return NextResponse.json([]);
  } catch (error) {
    console.error('❌ DeSnaps API error:', { 
      message: error.message, 
      stack: error.stack, 
      userId, 
      viewerId,
      authHeader: !!authHeader 
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}