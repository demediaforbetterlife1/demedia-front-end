import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string = '';
  let body: any = {};
  let authHeader: string | null = null;
  
  try {
    const resolvedParams = await params;
    userId = resolvedParams.id;
    
    // Validate userId
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    body = await request.json();
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    console.log('User profile update request:', { userId, body });

    // Get the authorization token
    authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Try to connect to the actual backend first
    try {
      // Use plural users endpoint to match backend convention
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }

      const text = await backendResponse.text();
      return NextResponse.json({ error: text || 'Failed to update profile' }, { status: backendResponse.status });
    } catch (_) {
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ User profile update error:', { 
      message: errorMessage, 
      stack: errorStack, 
      userId,
      body,
      authHeader: !!authHeader 
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to update profile',
      details: errorMessage
    }, { status: 500 });
  }
}
