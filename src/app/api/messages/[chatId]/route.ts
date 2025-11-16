import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  let chatId: string = '';
  let authHeader: string | null = null;
  let userId: string | null = null;
  
  try {
    const resolvedParams = await params;
    chatId = resolvedParams.chatId;
    
    // Get the auth token from cookies or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    authHeader = `Bearer ${token}`;
    userId = request.headers.get('user-id');

    console.log('Fetching messages for chatId:', chatId);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/messages/${chatId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend messages data received:', data.length, 'messages');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.error('Backend messages fetch failed:', backendResponse.status, errorText);
        return NextResponse.json({ error: errorText || 'Failed to fetch messages' }, { status: backendResponse.status });
      }
    } catch (backendError) {
      console.error('Backend messages connection error:', backendError);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
    // No fallback

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ Messages API error:', { 
      message: errorMessage, 
      stack: errorStack, 
      chatId,
      authHeader: !!authHeader,
      userId 
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}
