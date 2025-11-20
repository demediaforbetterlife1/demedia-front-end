import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { participantId } = await request.json();
    
    // Get the auth token from cookies or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const authHeader = `Bearer ${token}`;

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 });
    }

    console.log('Creating/finding chat with participant:', participantId);

    // Try to connect to the actual backend first
    try {
      const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
      const backendResponse = await fetch(`${backendUrl}/api/chat/create-or-find`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'user-id': request.headers.get('user-id') || '',
        },
        body: JSON.stringify({ participantId: parseInt(participantId) }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend chat data received:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text().catch(() => 'Unknown error');
        console.error('Backend chat creation failed:', backendResponse.status, errorText);
        
        // Return the backend error if it's a client error (4xx)
        if (backendResponse.status >= 400 && backendResponse.status < 500) {
          try {
            const errorData = JSON.parse(errorText);
            return NextResponse.json(errorData, { status: backendResponse.status });
          } catch {
            return NextResponse.json({ error: errorText }, { status: backendResponse.status });
          }
        }
      }
    } catch (backendError: any) {
      console.error('Backend chat connection error:', backendError);
      
      // If it's a timeout, provide specific message
      if (backendError.name === 'AbortError' || backendError.name === 'TimeoutError') {
        return NextResponse.json({ 
          error: 'Chat service is taking too long to respond. Please try again.',
          code: 'TIMEOUT'
        }, { status: 504 });
      }
    }

    // Provide a more user-friendly response when backend is unavailable
    console.log('Chat creation failed - backend unavailable');
    return NextResponse.json({ 
      error: 'Unable to start chat right now. The messaging service may be temporarily unavailable. Please try again in a few moments.',
      code: 'CHAT_SERVICE_UNAVAILABLE',
      retryAfter: 30 // seconds
    }, { status: 503 });

  } catch (error) {
    console.error('Error creating/finding chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
