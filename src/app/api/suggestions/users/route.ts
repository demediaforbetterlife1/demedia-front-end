import { NextRequest, NextResponse } from "next/server";

/**
 * User Suggestions API - Proxies requests to backend
 * Frontend communicates with backend, backend handles database operations
 */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    console.log('Fetching user suggestions via backend, userId:', userId);

    if (!authHeader || !userId) {
      console.log('⚠️ No authentication provided, returning empty suggestions');
      return NextResponse.json([]);
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend-production.up.railway.app';
    console.log('🔄 Connecting to backend for suggestions:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/suggestions/users`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Fetched user suggestions via backend:', data.length, 'suggestions');
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed for suggestions:', backendError);
      
      // Fallback: Return empty suggestions array
      console.log('🔄 Using fallback: returning empty suggestions array');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching user suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
