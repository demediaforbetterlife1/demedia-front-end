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
      });

      console.log('🔄 Backend response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('✅ DeSnaps fetched via backend:', data.length, 'items');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.error('❌ Backend DeSnaps fetch failed:', backendResponse.status, errorText);
        throw new Error(`Backend responded with ${backendResponse.status}: ${errorText}`);
      }
    } catch (backendError) {
      console.error('❌ Backend connection failed for DeSnaps:', backendError);
      console.log('🔄 Using fallback for DeSnaps');
    }

    // Fallback: Return empty array if backend is not available
    console.log('Backend not available for DeSnaps, returning empty array');
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching DeSnaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}