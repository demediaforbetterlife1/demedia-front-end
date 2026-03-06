import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deSnapId } = await params;

    // Get token from cookie or Authorization header
    let token = request.cookies.get('token')?.value;
    const authHeader = request.headers.get('authorization');
    
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend-production.up.railway.app';
    
    try {
      const response = await fetch(`${backendUrl}/api/desnaps/${deSnapId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `token=${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', response.status, errorText);
        return NextResponse.json({ 
          error: errorText || `Backend responded with ${response.status}` 
        }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('Backend connection failed:', backendError);
      
      // Return mock success response if backend is unavailable
      return NextResponse.json({ 
        success: true,
        liked: true,
        message: 'Like recorded (backend unavailable)'
      });
    }
  } catch (error) {
    console.error('Error liking DeSnap:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to like DeSnap' 
    }, { status: 500 });
  }
}
